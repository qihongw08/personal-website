import { SectionHeader } from "@/components/shared/SectionHeader";
import { FadeInWhenVisible } from "@/components/shared/FadeInWhenVisible";
import { FriendsGraph } from "./FriendsGraph";

export function Friends() {
  return (
    <section
      id="friends"
      className="mx-auto max-w-[1100px] px-10 pt-[140px] pb-[100px]"
    >
      <FadeInWhenVisible>
        <SectionHeader title="Friends" />
        <FriendsGraph />
      </FadeInWhenVisible>
    </section>
  );
}
