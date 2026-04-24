import * as simpleIcons from "simple-icons";
import { Database } from "lucide-react";
import { profile } from "@/content/profile";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { CommitGraph } from "./CommitGraph";

export function About() {
  return (
    <section
      id="about"
      className="mx-auto max-w-[1100px] px-5 pt-20 pb-16 sm:px-6 md:px-10 md:pt-[140px] md:pb-[100px]"
    >
      <FadeInWhenVisible>
        <SectionHeader title="About Me" />

        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[220px_1fr] md:gap-[60px]">
          <div className="flex items-start gap-4 md:block">
            <div
              className="flex aspect-[3/4] w-28 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--glass-border)] font-mono text-[11px] text-[var(--ink-faint)] sm:w-36 md:w-full"
              style={{
                background:
                  "linear-gradient(160deg, rgba(8,145,178,0.08), rgba(124,58,237,0.06))",
              }}
            >
              {profile.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profilePhoto}
                  alt={`${profile.name.en} profile photo`}
                  className="block h-[125%] w-full self-end object-cover scale-105"
                />
              ) : (
                "[ profile photo ]"
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1.5 md:mt-4">
              {[profile.email, profile.location].map((t) => (
                <span
                  key={t}
                  className="truncate font-mono text-xs text-[var(--ink-faint)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p
              className="m-0 text-base leading-[1.9] text-[var(--ink)]"
              style={{ textWrap: "pretty" }}
            >
              {profile.bio.intro}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <SkillChip key={s.name} name={s.name} icon={s.icon} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <CommitGraph />
        </div>
      </FadeInWhenVisible>
    </section>
  );
}

function SkillChip({ name, icon }: { name: string; icon: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] py-1 pl-2 pr-2.5 text-[12px] font-medium text-[var(--ink)]"
      style={{ background: "rgba(255,255,255,0.5)" }}
    >
      <SkillIcon slug={icon} />
      {name}
    </span>
  );
}

function SkillIcon({ slug }: { slug: string }) {
  if (slug === "sql") {
    return <Database size={14} className="text-[var(--ink-muted)]" />;
  }
  if (slug === "java") {
    return <JavaMark size={14} />;
  }
  const key =
    `si${slug.charAt(0).toUpperCase()}${slug.slice(1)}` as keyof typeof simpleIcons;
  const icon = simpleIcons[key] as
    | { path: string; hex: string; title: string }
    | undefined;
  if (!icon) {
    return <Database size={14} className="text-[var(--ink-muted)]" />;
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill={`#${icon.hex}`}
      aria-hidden
    >
      <path d={icon.path} />
    </svg>
  );
}

function JavaMark({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="#ea2d2e"
      aria-hidden
    >
      <path d="M8.85 18.56s-.92.54.65.71c1.91.22 2.89.19 5-.21a3.6 3.6 0 0 0 1.33.65c-4.72 2.02-10.69-.12-6.98-1.15M8.27 15.9s-1.03.76.54.92c2.05.21 3.67.23 6.47-.31a2.8 2.8 0 0 0 .99.6c-5.71 1.67-12.08.13-8-1.21M13.16 11.38c1.16 1.33-.31 2.53-.31 2.53s2.95-1.52 1.59-3.43c-1.26-1.78-2.23-2.66 3.01-5.7 0 0-8.25 2.06-4.29 6.6M19.33 20.5s.68.56-.75.99c-2.7.82-11.28 1.07-13.65.03-.85-.37.75-.88 1.25-.99.52-.11.82-.09.82-.09-.95-.67-6.12 1.31-2.63 1.88 9.49 1.54 17.3-.69 14.96-1.82M9.29 13.14s-4.33 1.03-1.53 1.4c1.18.16 3.53.12 5.72-.06 1.79-.15 3.58-.47 3.58-.47s-.63.27-1.08.57c-4.39 1.16-12.88.62-10.44-.55 2.07-.99 3.76-.89 3.76-.89M17.06 17.48c4.47-2.33 2.41-4.56.97-4.26-.36.08-.52.14-.52.14s.13-.21.38-.3c2.86-1.01 5.06 2.96-.93 4.53 0 0 .07-.06.1-.11M14.45 0s2.48 2.48-2.35 6.29c-3.87 3.06-.88 4.81 0 6.8-2.26-2.04-3.92-3.84-2.81-5.51 1.64-2.46 6.17-3.65 5.16-7.58M9.74 23.88c4.29.27 10.88-.15 11.03-2.18 0 0-.3.77-3.54 1.38-3.66.69-8.17.61-10.85.17 0 0 .55.46 3.36.63" />
    </svg>
  );
}
