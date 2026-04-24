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
        <a
          href={profile.socials.github.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-[var(--ink-faint)] transition-colors hover:text-[var(--brand)]"
        >
          github.com/{profile.socials.github.handle}
        </a>
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
            "#a7e8c9",
            "#4dceaa",
            "#1cb389",
            "#0a8562",
          ],
        }}
      />
    </div>
  );
}
