import fs from "node:fs";
import path from "node:path";

export type Media = {
  /** Public URL path, e.g. "/hobbies/badminton/shot1.jpg" */
  src: string;
  type: "image" | "video";
  /** Alt text — derived from the filename. */
  label: string;
  /** Optional caption (from `_captions.json` sidecar). */
  caption: string | null;
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

/**
 * Scan a directory under `public/` and return every image/video in it as
 * Media entries. Alphabetical order (filenames drive the sort, so prefix with
 * `01-`, `02-`, etc. for explicit ordering).
 *
 * Captions are passed in from `content/hobbies.ts` — the keys are exact
 * filenames (e.g. "01-rally.mp4"). Any file without a key has no caption.
 *
 * Called at build/request time inside Server Components.
 */
export function scanMedia(
  publicDir: string,
  captions: Record<string, string> = {},
): Media[] {
  const fullPath = path.join(
    process.cwd(),
    "public",
    publicDir.replace(/^\/+/, ""),
  );
  let entries: string[];
  try {
    entries = fs.readdirSync(fullPath);
  } catch {
    return [];
  }

  return entries
    .filter((name) => !name.startsWith(".")) // skip dotfiles
    .filter((name) => IMAGE_EXT.test(name) || VIDEO_EXT.test(name))
    .sort()
    .map((name) => {
      const type: Media["type"] = VIDEO_EXT.test(name) ? "video" : "image";
      const label = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const src = `/${publicDir.replace(/^\/+|\/+$/g, "")}/${name}`;
      return { src, type, label, caption: captions[name] ?? null };
    });
}
