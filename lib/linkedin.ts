import { head } from "@vercel/blob";
import { z } from "zod";
import type { FriendNode } from "@/components/friend-graph";

const BLOB_PATHNAME = "linkedin-profile/profiles.json";

const PictureAssetSchema = z.object({
  url: z.string().nullish(),
  sizes: z
    .array(
      z.object({
        url: z.string(),
        width: z.number().nullish(),
        height: z.number().nullish(),
      }),
    )
    .nullish(),
});

const ApifyProfileSchema = z
  .object({
    linkedinUrl: z.string().nullish(),
    url: z.string().nullish(),
    profileUrl: z.string().nullish(),
    publicIdentifier: z.string().nullish(),
    firstName: z.string().nullish(),
    lastName: z.string().nullish(),
    fullName: z.string().nullish(),
    name: z.string().nullish(),
    headline: z.string().nullish(),
    photo: z.string().nullish(),
    photoUrl: z.string().nullish(),
    pictureUrl: z.string().nullish(),
    profilePic: z.string().nullish(),
    profilePicHighQuality: z.string().nullish(),
    profilePicture: z.union([z.string(), PictureAssetSchema]).nullish(),
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
  return p.linkedinUrl ?? p.url ?? p.profileUrl ?? undefined;
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
    p.photoUrl ??
    undefined
  );
}

async function fetchProfilesFromBlob(): Promise<ApifyProfile[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const blob = await head(BLOB_PATHNAME);
    const res = await fetch(blob.url, { cache: "no-store" });
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

/**
 * Resolve LinkedIn URLs to FriendNodes using data uploaded to Vercel Blob
 * by the weekly scrape-linkedin GitHub Action. URLs without a matching
 * scraped record fall back to a synthesized node (name inferred from the
 * URL handle, no photo, no headline).
 */
export async function buildFriendNodesFromLinkedin<T extends string>(
  profiles: Record<string, T[]>,
): Promise<FriendNode<T>[]> {
  const scraped = await fetchProfilesFromBlob();
  const byUrl = new Map<string, ApifyProfile>();
  for (const p of scraped) {
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
      headline: match.headline ?? undefined,
      photo: pickPhoto(match),
      link: url,
      tags,
    };
  });
}
