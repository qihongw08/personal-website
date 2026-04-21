"use client";

import { useEffect, useState } from "react";
import { profile } from "@/content/profile";

const NAV_SECTIONS = [
  "Home",
  "About",
  "Career",
  "Projects",
  "Hobbies",
  "Friends",
] as const;

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<(typeof NAV_SECTIONS)[number]>("Home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);

      for (let i = NAV_SECTIONS.length - 1; i >= 0; i--) {
        const id = NAV_SECTIONS[i].toLowerCase();
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 200) {
          setActive(NAV_SECTIONS[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id.toLowerCase());
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between px-10 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(248,247,244,0.62)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--glass-border)"
          : "1px solid transparent",
        boxShadow: scrolled ? "inset 0 1px 0 var(--glass-highlight)" : "none",
      }}
    >
      <button
        onClick={() => scrollTo("Home")}
        className="cursor-pointer font-display text-lg font-bold tracking-[2px] text-[var(--brand)]"
      >
        {profile.initials}
        <span className="text-[var(--ink-faint)]">.</span>
      </button>
      <div className="flex gap-8">
        {NAV_SECTIONS.map((s) => (
          <button
            key={s}
            onClick={() => scrollTo(s)}
            className="cursor-pointer text-[13px] uppercase tracking-[1.5px] transition-colors duration-300 hover:text-[var(--brand)]"
            style={{
              color: active === s ? "var(--brand)" : "var(--ink-muted)",
              fontWeight: active === s ? 600 : 400,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </nav>
  );
}
