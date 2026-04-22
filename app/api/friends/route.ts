import { NextResponse } from "next/server";
import { friendLinkedins } from "@/content/friends";
import { buildFriendNodesFromLinkedin } from "@/lib/linkedin";

// Data lives in Vercel Blob (refreshed weekly by scrape-linkedin.yml). The
// blob fetch is cached by Next's data cache + unstable_cache in lib/linkedin.ts.
export const revalidate = 3600;

export async function GET() {
  const friends = await buildFriendNodesFromLinkedin(friendLinkedins);
  return NextResponse.json({ friends });
}
