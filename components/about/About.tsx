import { profile } from "@/content/profile";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { CommitGraph } from "./CommitGraph";

export function About() {
  return (
    <section
      id="about"
      className="mx-auto max-w-[1100px] px-10 pt-[140px] pb-[100px]"
    >
      <FadeInWhenVisible>
        <SectionHeader title="About Me" />

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] items-start gap-[60px]">
          <div>
            <div
              className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--glass-border)] font-mono text-[11px] text-[var(--ink-faint)]"
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
                  className="h-full w-full object-cover"
                />
              ) : (
                "[ profile photo ]"
              )}
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {[profile.email, profile.location].map((t) => (
                <span
                  key={t}
                  className="font-mono text-xs text-[var(--ink-faint)]"
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
              <strong className="font-semibold">
                I&apos;m {profile.name.en}
              </strong>
              {" — "}
              {profile.bio.intro.replace(/^I'm [^—]+—\s*/, "")}
            </p>
            <p
              className="mt-5 text-base leading-[1.9] text-[var(--ink-muted)]"
              style={{ textWrap: "pretty" }}
            >
              {profile.bio.offClock}
            </p>

            <div className="mt-8 flex flex-wrap gap-5">
              {Object.entries(profile.skills).map(([cat, items]) => (
                <div key={cat}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[2px] text-[var(--brand)]">
                    {cat}
                  </div>
                  <div className="text-[13px] leading-[1.6] text-[var(--ink-muted)]">
                    {items.join(" · ")}
                  </div>
                </div>
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
