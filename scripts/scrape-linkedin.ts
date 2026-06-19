/**
 * Weekly LinkedIn scrape — run by .github/workflows/scrape-linkedin.yml.
 *
 * Reads the URL list from content/friends.ts, fires the Apify actor, and
 * uploads the raw profile response to Vercel Blob at pathname
 * `linkedin-profiles.json`. The app reads it at runtime via lib/linkedin.ts.
 *
 * Run locally: `APIFY_API_TOKEN=... BLOB_READ_WRITE_TOKEN=... bun run scripts/scrape-linkedin.ts`
 */

import { ApifyClient } from "apify-client";
import { put } from "@vercel/blob";
import { friendLinkedins } from "../content/friends";
import { profile } from "../content/profile";

const apifyToken = process.env.APIFY_API_TOKEN;
if (!apifyToken) {
  console.error("APIFY_API_TOKEN is required.");
  process.exit(1);
}

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!blobToken) {
  console.error("BLOB_READ_WRITE_TOKEN is required.");
  process.exit(1);
}

const actorId = process.env.APIFY_LINKEDIN_ACTOR_ID || "LpVuK3Zozwuipa5bp";
const BLOB_PATHNAME = "linkedin-profile/profiles.json";

// Free Apify accounts cap this actor at 10 profiles per run, so we chunk the
// URL list and run the actor once per batch, merging the datasets.
const BATCH_SIZE = Number(process.env.APIFY_BATCH_SIZE) || 10;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Guard the upload: a valid profile must carry the fields lib/linkedin.ts reads
// (a resolvable URL + a name). This rejects actor error payloads like
// `{ error: "Free users are limited…" }`, so a failed run never overwrites the
// last good blob.
function isValidProfile(item: unknown): boolean {
  if (typeof item !== "object" || item === null) return false;
  const p = item as Record<string, unknown>;
  if ("error" in p) return false;
  const str = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const hasUrl = str(p.linkedinUrl) || str(p.url) || str(p.profileUrl);
  const hasName =
    str(p.fullName) || str(p.name) || str(p.firstName) || str(p.lastName);
  return hasUrl && hasName;
}

const urls = [
  profile.socials.linkedin.url,
  ...Object.keys(friendLinkedins),
];

const items: unknown[] = [];
if (urls.length === 0) {
  console.log("No profiles configured; nothing to scrape.");
} else {
  const batches = chunk(urls, BATCH_SIZE);
  console.log(
    `Scraping ${urls.length} profiles via actor ${actorId} in ${batches.length} batch(es) of up to ${BATCH_SIZE}…`,
  );

  const client = new ApifyClient({ token: apifyToken });

  for (const [i, batch] of batches.entries()) {
    const run = await client
      .actor(actorId)
      .call({ profileUrls: batch }, { waitSecs: 300 });

    if (!run?.defaultDatasetId) {
      console.error(`Batch ${i + 1} returned no dataset.`);
      process.exit(1);
    }

    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    items.push(...dataset.items);
    console.log(
      `Batch ${i + 1}/${batches.length}: received ${dataset.items.length} item(s).`,
    );
  }

  console.log(`Received ${items.length} profile item(s) total.`);
}

const invalid = items.filter((item) => !isValidProfile(item));
if (items.length === 0 || invalid.length > 0) {
  console.error(
    `Refusing to overwrite blob: ${invalid.length}/${items.length} item(s) lack the expected url + name fields.`,
  );
  if (invalid.length > 0) {
    console.error("First invalid item:", JSON.stringify(invalid[0], null, 2));
  }
  process.exit(1);
}

const body = JSON.stringify(items, null, 2);
const blob = await put(BLOB_PATHNAME, body, {
  access: "public",
  contentType: "application/json",
  addRandomSuffix: false,
  allowOverwrite: true,
  token: blobToken,
});

console.log(`Uploaded to ${blob.url}`);
