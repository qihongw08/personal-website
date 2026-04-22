/**
 * Resolve a content asset path to a full URL.
 *
 * - In production: prepends `NEXT_PUBLIC_BLOB_BASE_URL` (the `personal-website-content`
 *   Vercel Blob store host, e.g. `https://xxxx.public.blob.vercel-storage.com`).
 * - When the env var is unset: falls back to `/<path>` so files still served
 *   from `public/` (if any) keep working during local dev.
 *
 * Accepts either a leading-slash or bare pathname.
 */
const BASE = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? "";

export function asset(pathname: string): string {
  const clean = pathname.replace(/^\/+/, "");
  if (!BASE) return `/${clean}`;
  return `${BASE.replace(/\/+$/, "")}/${clean}`;
}
