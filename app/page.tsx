import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/about/About";
import { Career } from "@/components/career/Career";
import { Projects } from "@/components/projects/Projects";
import { Hobbies } from "@/components/hobbies/Hobbies";
import { Friends } from "@/components/friends/Friends";
import { profile } from "@/content/profile";

export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <Navigation />
      <Hero />
      <About />
      <Career />
      <Projects />
      <Hobbies />
      <Friends />
      <footer className="border-t border-[var(--glass-border)] px-10 py-[60px] text-center">
        <div className="text-[13px] text-[var(--ink-faint)]">
          Built by {profile.name.en} · {new Date().getFullYear()}
        </div>
      </footer>
    </>
  );
}
