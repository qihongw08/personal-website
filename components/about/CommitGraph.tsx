"use client";

import dynamic from "next/dynamic";
import { profile } from "@/content/profile";

const GitHubCalendar = dynamic(
  () => import("react-github-calendar").then((m) => m.GitHubCalendar),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-md bg-[var(--glass-bg)]"
        style={{ height: 112 }}
        aria-hidden
      />
    ),
  },
);

export function CommitGraph() {
  return (
    <div className="glass-card rounded-xl px-6 py-5">
      <div className="mb-4 flex items-center justify-between"> 
        <span className="font-mono text-[11px] text-[var(--ink-faint)]">
          github.com/{profile.socials.github.handle}
        </span>
      </div>
      <GitHubCalendar
        username={profile.socials.github.handle}
        colorScheme="light"
        blockSize={11}
        blockMargin={3}
        blockRadius={2}
        fontSize={11}
        theme={{
          light: [
            "rgba(0,0,0,0.04)",
            "rgba(8,145,178,0.15)",
            "rgba(8,145,178,0.3)",
            "rgba(8,145,178,0.5)",
            "rgba(8,145,178,0.75)",
          ],
        }}
      />
    </div>
  );
}
