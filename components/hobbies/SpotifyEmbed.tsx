import { favoriteSong } from "@/content/song";

export function SpotifyEmbed() {
  return (
    <div className="glass-card col-span-full overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
            NOW PLAYING
          </span>
          <div className="flex items-center gap-1">
            <div
              className="h-1.5 w-1.5 animate-pulse rounded-full"
              style={{ background: "var(--brand)", boxShadow: "0 0 8px rgba(8,145,178,0.4)" }}
            />
            <span className="font-mono text-[9px] tracking-[1px] text-[var(--brand)]">
              LIVE
            </span>
          </div>
        </div>
        <span className="font-mono text-[9px] text-[var(--ink-faint)]">
          spotify.com
        </span>
      </div>
      <iframe
        title={`Spotify player: ${favoriteSong.title}`}
        src={`https://open.spotify.com/embed/track/${favoriteSong.spotifyTrackId}?utm_source=generator&theme=0`}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="block border-0"
        suppressHydrationWarning
      />
    </div>
  );
}
