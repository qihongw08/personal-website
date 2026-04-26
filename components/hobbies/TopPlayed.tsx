import { Music } from "lucide-react";
import { getTopPlayed } from "@/lib/kugou";

export async function TopPlayed() {
  const songs = await getTopPlayed(6);
  if (songs.length === 0) return null;

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
        <span className="font-mono text-[9px] text-[var(--ink-faint)]">
          kugou.com
        </span>
      </div>
      <ol className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {songs.map((song, i) => (
          <li
            key={song.hash || `${song.title}-${i}`}
            className="flex items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-2.5 transition-colors hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-bg-hover)] lg:flex-col lg:items-stretch lg:gap-2 lg:p-3"
          >
            <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-md bg-[rgba(8,145,178,0.06)] lg:w-full">
              {song.imageUrl ? (
                // Album art comes from KuGou's CDN; next/image isn't worth wiring up
                // for a domain that isn't in next.config.
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
    </div>
  );
}
