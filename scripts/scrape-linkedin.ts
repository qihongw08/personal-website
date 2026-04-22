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

const actorId = process.env.APIFY_LINKEDIN_ACTOR_ID ?? "LpVuK3Zozwuipa5bp";
const scraperMode =
  process.env.APIFY_SCRAPER_MODE ?? "Profile details no email ($4 per 1k)";
const BLOB_PATHNAME = "linkedin-profiles.json";

const urls = Object.keys(friendLinkedins);

let items: unknown[] = [];
if (urls.length === 0) {
  console.log("No profiles configured; uploading empty array.");
} else {
  console.log(`Scraping ${urls.length} profiles via actor ${actorId}…`);

  const client = new ApifyClient({ token: apifyToken });
  const run = await client
    .actor(actorId)
    .call(
      { profileScraperMode: scraperMode, queries: urls },
      { waitSecs: 300 },
    );

  if (!run?.defaultDatasetId) {
    console.error("Actor run returned no dataset.");
    process.exit(1);
  }

  const dataset = await client.dataset(run.defaultDatasetId).listItems();
  items = dataset.items;
  console.log(`Received ${items.length} profile item(s).`);
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
