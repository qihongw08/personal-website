import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { FriendsClient } from "./FriendsClient";
import { profile } from "@/content/profile";

export function Friends() {
  return (
    <section
      id="friends"
      className="mx-auto max-w-[1200px] px-5 pt-20 pb-16 sm:px-6 md:px-10 md:pt-[140px] md:pb-[100px]"
    >
      <FadeInWhenVisible>
        <SectionHeader title="Friends" />
        <div className="glass-card overflow-hidden rounded-2xl px-4 py-6">
          <FriendsClient
            root={{
              name: profile.name.en,
              photo: profile.profilePhoto ?? undefined,
              link: profile.socials.linkedin.url,
            }}
            height={680}
          />
        </div>
        <p className="mt-3 text-center text-xs text-[var(--ink-faint)]">
          <span className="hidden md:inline">Scroll to zoom · Drag to pan</span>
          <span className="md:hidden">Drag to explore</span>
        </p>
      </FadeInWhenVisible>
    </section>
  );
}
