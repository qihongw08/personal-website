import { Suspense } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/about/About";
import { Career } from "@/components/career/Career";
import { Projects } from "@/components/projects/Projects";
import { Hobbies } from "@/components/hobbies/Hobbies";
import { Friends } from "@/components/friends/Friends";
import { profile } from "@/content/profile";

export const revalidate = 3600;

function ProjectsSkeleton() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pt-20 pb-16 sm:px-6 md:px-10 md:pt-[140px] md:pb-[100px]">
      <div className="mb-8 h-7 w-28 animate-pulse rounded bg-[var(--glass-bg)]" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card h-56 animate-pulse rounded-xl" />
        ))}
      </div>
    </section>
  );
}

function HobbiesSkeleton() {
  return (
    <section className="mx-auto max-w-[1100px] px-5 pt-20 pb-16 sm:px-6 md:px-10 md:pt-[140px] md:pb-[100px]">
      <div className="mb-8 h-7 w-24 animate-pulse rounded bg-[var(--glass-bg)]" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="glass-card h-64 animate-pulse rounded-xl md:col-span-2 md:row-span-2" />
        <div className="glass-card h-64 animate-pulse rounded-xl md:col-span-2 md:row-span-2" />
        <div className="glass-card col-span-full h-32 animate-pulse rounded-xl" />
        <div className="glass-card h-32 animate-pulse rounded-xl md:col-span-2" />
        <div className="glass-card h-32 animate-pulse rounded-xl md:col-span-2" />
        <div className="glass-card col-span-full h-40 animate-pulse rounded-xl" />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Navigation />
      <Hero />
      <About />
      <Career />
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects />
      </Suspense>
      <Suspense fallback={<HobbiesSkeleton />}>
        <Hobbies />
      </Suspense>
      <Friends />
      <footer className="border-t border-[var(--glass-border)] px-5 py-10 text-center sm:px-6 md:px-10 md:py-[60px]">
        <div className="text-[13px] text-[var(--ink-faint)]">
          Built by {profile.name.en} & Claude Opus 4.6
        </div>
      </footer>
    </>
  );
}
