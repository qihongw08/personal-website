import { Code2, Feather } from "lucide-react";
import { hobbies } from "@/content/hobbies";
import { scanMedia } from "@/lib/media";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { MediaViewer } from "./MediaViewer";
import { TopPlayed } from "./TopPlayed";
import { LeagueCard } from "./LeagueCard";

export async function Hobbies() {
  const cardBase = "glass-card relative overflow-hidden rounded-xl p-6";

  const [badmintonMedia, hikingMedia, edmMedia, hackathonMedia] =
    await Promise.all([
      scanMedia(
        hobbies.badminton.mediaDir,
        hobbies.badminton.captions,
        hobbies.badminton.dates,
      ),
      scanMedia(
        hobbies.hiking.mediaDir,
        hobbies.hiking.captions,
        hobbies.hiking.dates,
      ),
      scanMedia(hobbies.edm.mediaDir, hobbies.edm.captions, hobbies.edm.dates),
      scanMedia(
        hobbies.hackathon.mediaDir,
        hobbies.hackathon.captions,
        hobbies.hackathon.dates,
      ),
    ]);

  return (
    <section
      id="hobbies"
      className="mx-auto max-w-[1100px] px-5 pt-20 pb-16 sm:px-6 md:px-10 md:pt-[140px] md:pb-[100px]"
    >
      <FadeInWhenVisible>
        <SectionHeader title="Hobbies" />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {/* League of Legends — 2x2 on md+, live Riot API */}
          <LeagueCard />

          {/* Badminton — 2x2 on md+ */}
          <div className={`${cardBase} !p-0 md:col-span-2 md:row-span-2`}>
            <div className="flex items-center gap-3 px-6 pt-5 pb-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(8,145,178,0.08)",
                  border: "1px solid rgba(8,145,178,0.15)",
                }}
              >
                <Feather size={14} className="text-[var(--brand)]" />
              </div>
              <h3 className="m-0 font-display text-[22px] font-bold text-[var(--ink)]">
                {hobbies.badminton.title}
              </h3>
            </div>
            <div className="p-3 pt-0">
              <MediaViewer media={badmintonMedia} variant="wall" />
            </div>
          </div>

          {/* Hackathons — full width strip */}
          <div className={`${cardBase} col-span-full`}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(8,145,178,0.08)",
                  border: "1px solid rgba(8,145,178,0.15)",
                }}
              >
                <Code2 size={14} className="text-[var(--brand)]" />
              </div>
              <h3 className="m-0 font-display text-xl font-bold text-[var(--ink)]">
                {hobbies.hackathon.title}
              </h3>
            </div>
            {hackathonMedia.length > 0 && (
              <div className="mt-2">
                <MediaViewer media={hackathonMedia} variant="strip" />
              </div>
            )}
          </div>

          {/* Hiking */}
          <div className={`${cardBase} md:col-span-2`}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="mb-2 font-mono text-[10px] tracking-[1px] text-[var(--ink-faint)]">
                  TRAIL_LOG
                </div>
                <h3 className="m-0 font-display text-xl font-bold text-[var(--ink)]">
                  {hobbies.hiking.title}
                </h3>
              </div>
              <div className="flex gap-4">
                {hobbies.hiking.stats.map((s) => (
                  <div key={s.label} className="text-right">
                    <div className="mb-0.5 font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
                      {s.label}
                    </div>
                    <div className="text-[13px] font-semibold text-[var(--brand)]">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {hikingMedia.length > 0 && (
              <div className="mt-2">
                <MediaViewer media={hikingMedia} variant="strip" />
              </div>
            )}
          </div>

          {/* EDM */}
          <div className={`${cardBase} md:col-span-2`}>
            <div className="mb-3 flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.15)",
                }}
              >
                <span className="text-sm">♪</span>
              </div>
              <h3 className="m-0 font-display text-xl font-bold text-[var(--ink)]">
                {hobbies.edm.title}
              </h3>
            </div>
            {edmMedia.length > 0 && (
              <div className="mt-3">
                <MediaViewer media={edmMedia} variant="strip" />
              </div>
            )}
          </div>

          {/* KuGou top played */}
          <TopPlayed />
        </div>
      </FadeInWhenVisible>
    </section>
  );
}
