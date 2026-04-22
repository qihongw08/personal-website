import { head } from "@vercel/blob";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import type { FriendNode } from "@/components/friend-graph";

const BLOB_PATHNAME = "linkedin-profiles.json";

const PictureAssetSchema = z.object({
  url: z.string().optional(),
  sizes: z
    .array(
      z.object({
        url: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .optional(),
});

const ApifyProfileSchema = z
  .object({
    linkedinUrl: z.string().optional(),
    url: z.string().optional(),
    profileUrl: z.string().optional(),
    publicIdentifier: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    name: z.string().optional(),
    headline: z.string().optional(),
    photo: z.string().optional(),
    photoUrl: z.string().optional(),
    pictureUrl: z.string().optional(),
    profilePic: z.string().optional(),
    profilePicHighQuality: z.string().optional(),
    profilePicture: z.union([z.string(), PictureAssetSchema]).optional(),
  })
  .loose();

type ApifyProfile = z.infer<typeof ApifyProfileSchema>;

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

function handleFromUrl(url: string): string {
  const m = url.match(/\/in\/([^/?#]+)/i);
  return m?.[1] ?? url;
}

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function idFromUrl(url: string): string {
  return handleFromUrl(url)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fallbackNode<T extends string>(url: string, tags: T[]): FriendNode<T> {
  const handle = handleFromUrl(url);
  return {
    id: idFromUrl(url),
    name: titleCase(handle),
    tags,
    link: url,
  };
}

function pickUrl(p: ApifyProfile): string | undefined {
  return p.linkedinUrl ?? p.url ?? p.profileUrl;
}

function pickName(p: ApifyProfile, url: string): string {
  if (p.fullName) return p.fullName;
  if (p.name) return p.name;
  if (p.firstName || p.lastName) {
    return [p.firstName, p.lastName].filter(Boolean).join(" ");
  }
  return titleCase(handleFromUrl(url));
}

function pickPhoto(p: ApifyProfile): string | undefined {
  if (p.photo) return p.photo;
  if (typeof p.profilePicture === "string") return p.profilePicture;
  if (p.profilePicture) {
    const sizes = p.profilePicture.sizes;
    if (sizes && sizes.length > 0) {
      const best = [...sizes].sort(
        (a, b) => (b.width ?? 0) - (a.width ?? 0),
      )[0];
      if (best?.url) return best.url;
    }
    if (p.profilePicture.url) return p.profilePicture.url;
  }
  return (
    p.profilePicHighQuality ??
    p.pictureUrl ??
    p.profilePic ??
    p.photoUrl
  );
}

async function fetchProfilesFromBlob(): Promise<ApifyProfile[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const blob = await head(BLOB_PATHNAME);
    const res = await fetch(blob.url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const raw: unknown = await res.json();
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        const parsed = ApifyProfileSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((p): p is ApifyProfile => p !== null);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[linkedin] failed to load profiles from blob:", err);
    }
    return [];
  }
}

// Memoize the blob read at the Next data-cache layer. The blob URL is cheap
// to resolve (one head() call) and the body fetch is further cached by the
// `next: { revalidate }` hint inside fetchProfilesFromBlob.
const getCachedProfiles = unstable_cache(
  fetchProfilesFromBlob,
  ["linkedin-profiles-v1"],
  { revalidate: 3600 },
);

/**
 * Resolve LinkedIn URLs to FriendNodes using data uploaded to Vercel Blob
 * by the weekly scrape-linkedin GitHub Action. URLs without a matching
 * scraped record fall back to a synthesized node (name inferred from the
 * URL handle, no photo, no headline).
 */
export async function buildFriendNodesFromLinkedin<T extends string>(
  profiles: Record<string, T[]>,
): Promise<FriendNode<T>[]> {
  const cachedProfiles = await getCachedProfiles();
  const byUrl = new Map<string, ApifyProfile>();
  for (const p of cachedProfiles) {
    const u = pickUrl(p);
    if (u) byUrl.set(normalizeUrl(u), p);
  }

  const entries = Object.entries(profiles) as Array<[string, T[]]>;
  return entries.map(([url, tags]) => {
    const match = byUrl.get(normalizeUrl(url));
    if (!match) return fallbackNode(url, tags);
    return {
      id: idFromUrl(url),
      name: pickName(match, url),
      headline: match.headline,
      photo: pickPhoto(match),
      link: url,
      tags,
    };
  });
}
