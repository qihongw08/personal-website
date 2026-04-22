import fs from "node:fs";
import path from "node:path";
import { list } from "@vercel/blob";
import { unstable_cache } from "next/cache";

export type Media = {
  /** Absolute URL to the file. Blob URL in prod, `/<path>` in dev fallback. */
  src: string;
  type: "image" | "video";
  /** Alt text — derived from the filename. */
  label: string;
  /** Optional caption (from `_captions.json` sidecar). */
  caption: string | null;
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

function basename(p: string): string {
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
}

function toMedia(
  filename: string,
  src: string,
  captions: Record<string, string>,
): Media {
  const type: Media["type"] = VIDEO_EXT.test(filename) ? "video" : "image";
  const label = filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  return { src, type, label, caption: captions[filename] ?? null };
}

function scanMediaFromDisk(
  dir: string,
  captions: Record<string, string>,
): Media[] {
  const full = path.join(process.cwd(), "public", dir.replace(/^\/+/, ""));
  let entries: string[];
  try {
    entries = fs.readdirSync(full);
  } catch {
    return [];
  }
  return entries
    .filter((name) => !name.startsWith("."))
    .filter((name) => IMAGE_EXT.test(name) || VIDEO_EXT.test(name))
    .sort()
    .map((name) => {
      const src = `/${dir.replace(/^\/+|\/+$/g, "")}/${name}`;
      return toMedia(name, src, captions);
    });
}

async function scanMediaFromBlob(
  prefix: string,
  captions: Record<string, string>,
): Promise<Media[]> {
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "") + "/";
  const { blobs } = await list({ prefix: cleanPrefix });
  return blobs
    .map((b) => ({ blob: b, name: basename(b.pathname) }))
    .filter(({ name }) => !name.startsWith("."))
    .filter(({ name }) => IMAGE_EXT.test(name) || VIDEO_EXT.test(name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ blob, name }) => toMedia(name, blob.url, captions));
}

const scanMediaCached = unstable_cache(
  async (
    prefix: string,
    captionsJson: string,
  ): Promise<Media[]> => {
    const captions = JSON.parse(captionsJson) as Record<string, string>;
    return scanMediaFromBlob(prefix, captions);
  },
  ["scan-media-v1"],
  { revalidate: 3600 },
);

/**
 * Resolve a media directory to its images/videos. In prod, reads from the
 * Vercel Blob store via `list({ prefix })`. With no blob token (e.g. local
 * dev), falls back to `fs.readdirSync` on `public/<dir>` so offline work
 * keeps functioning.
 *
 * Alphabetical by filename — prefix files with `01-`, `02-` for explicit
 * ordering. Caption keys must match exact filenames.
 */
export async function scanMedia(
  dir: string,
  captions: Record<string, string> = {},
): Promise<Media[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return scanMediaFromDisk(dir, captions);
  }
  try {
    // unstable_cache needs serializable inputs → stringify the captions map.
    return await scanMediaCached(dir, JSON.stringify(captions));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[media] blob list failed for ${dir}:`, err);
    }
    return scanMediaFromDisk(dir, captions);
  }
}
