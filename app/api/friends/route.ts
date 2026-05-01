import { NextResponse } from "next/server";
import { friendLinkedins, friendPhotoOverrides } from "@/content/friends";
import { buildFriendNodesFromLinkedin } from "@/lib/linkedin";
import { profile } from "@/content/profile";

// Data lives in Vercel Blob (refreshed weekly by scrape-linkedin.yml). The
// blob fetch is cached by Next's data cache + unstable_cache in lib/linkedin.ts.
export const revalidate = 3600;

export async function GET() {
  const { nodes, root } = await buildFriendNodesFromLinkedin(
    friendLinkedins,
    friendPhotoOverrides,
    profile.socials.linkedin.url,
  );
  return NextResponse.json({ friends: nodes, root });
}
