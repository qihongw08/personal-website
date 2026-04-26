"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import type { TopSong } from "@/lib/kugou";

type Tab = "en" | "cn";

export function TopPlayedTabs({
  enSongs,
  cnSongs,
}: {
  enSongs: TopSong[];
  cnSongs: TopSong[];
}) {
  const [tab, setTab] = useState<Tab>("en");
  const songs = tab === "en" ? enSongs : cnSongs;

  return (
    <div className="glass-card col-span-full overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
            TOP PLAYED
          </span>
          <div className="flex items-center gap-1">
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{
                background: "var(--brand)",
                boxShadow: "0 0 8px rgba(8,145,178,0.4)",
              }}
            />
            <span className="font-mono text-[9px] tracking-[1px] text-[var(--brand)]">
              LIVE
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            role="tablist"
            aria-label="Language"
            className="flex items-center rounded-md border border-[var(--glass-border)] p-0.5"
          >
            {(["en", "cn"] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t)}
                  className={`rounded px-2 py-0.5 font-mono text-[9px] tracking-[1px] transition-colors ${
                    active
                      ? "bg-[rgba(8,145,178,0.15)] text-[var(--brand)]"
                      : "text-[var(--ink-faint)] hover:text-[var(--ink-muted)]"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              );
            })}
          </div>
          <span className="font-mono text-[9px] text-[var(--ink-faint)]">
            kugou.com
          </span>
        </div>
      </div>
      {songs.length === 0 ? (
        <div className="px-6 py-10 text-center font-mono text-[10px] tracking-[1px] text-[var(--ink-faint)]">
          NO TRACKS
        </div>
      ) : (
        <ol className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {songs.map((song, i) => (
            <li
              key={song.hash || `${song.title}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5 transition-colors hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-bg-hover)] lg:flex-col lg:items-stretch lg:gap-2 lg:p-3"
            >
              <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-md bg-[rgba(8,145,178,0.06)] lg:w-full">
                {song.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={song.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Music
                      size={18}
                      className="text-[var(--brand)] opacity-60"
                    />
                  </div>
                )}
                <div className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
              </div>
              <div className="min-w-0 flex-1 lg:flex-initial">
                <div
                  className="truncate font-display text-[13px] font-semibold text-[var(--ink)]"
                  title={song.title}
                >
                  {song.title}
                </div>
                <div
                  className="truncate text-[11px] text-[var(--ink-muted)]"
                  title={song.artist}
                >
                  {song.artist}
                </div>
                {song.playCount != null && (
                  <div className="mt-0.5 font-mono text-[9px] tracking-[0.5px] text-[var(--ink-faint)]">
                    {song.playCount.toLocaleString()} plays
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
