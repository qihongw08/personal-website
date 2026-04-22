import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { FriendsClient } from "./FriendsClient";
import { profile } from "@/content/profile";

export function Friends() {
  return (
    <section
      id="friends"
      className="mx-auto max-w-[1200px] px-10 pt-[140px] pb-[100px]"
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
          Scroll to zoom · Drag to pan · Bridges link clusters that share tags
        </p>
      </FadeInWhenVisible>
    </section>
  );
}
