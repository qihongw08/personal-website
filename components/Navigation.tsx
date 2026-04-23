"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { profile } from "@/content/profile";

const NAV_SECTIONS = [
  "Home",
  "About",
  "Career",
  "Projects",
  "Hobbies",
  "Friends",
] as const;

type Section = (typeof NAV_SECTIONS)[number];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<Section>("Home");
  const [open, setOpen] = useState(false);

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

  // Lock body scroll while drawer is open so the page doesn't shift behind it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id.toLowerCase());
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
    setOpen(false);
  };

  const surfaceStyle = {
    background: scrolled || open ? "rgba(248,247,244,0.62)" : "transparent",
    backdropFilter: scrolled || open ? "blur(24px) saturate(1.4)" : "none",
    WebkitBackdropFilter:
      scrolled || open ? "blur(24px) saturate(1.4)" : "none",
    borderBottom:
      scrolled || open
        ? "1px solid var(--glass-border)"
        : "1px solid transparent",
    boxShadow: scrolled || open ? "inset 0 1px 0 var(--glass-highlight)" : "none",
  } as const;

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[1000] flex h-16 items-center justify-between px-5 transition-all duration-300 sm:px-6 md:px-10"
      style={surfaceStyle}
    >
      <button
        onClick={() => scrollTo("Home")}
        className="cursor-pointer font-display text-lg font-bold tracking-[2px] text-[var(--brand)]"
      >
        {profile.initials}
        <span className="text-[var(--ink-faint)]">.</span>
      </button>

      {/* Desktop: inline links. Mobile: hamburger toggle. */}
      <div className="hidden md:flex md:gap-8">
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

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="-mr-2 flex h-11 w-11 cursor-pointer items-center justify-center text-[var(--ink-muted)] transition-colors hover:text-[var(--brand)] md:hidden"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              key="scrim"
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 top-16 -z-10 cursor-default md:hidden"
              style={{ background: "rgba(26,26,46,0.18)" }}
            />
            <motion.div
              key="drawer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 right-0 top-16 flex flex-col px-5 pt-2 pb-6 sm:px-6 md:hidden"
              style={surfaceStyle}
            >
              {NAV_SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => scrollTo(s)}
                  className="flex h-12 cursor-pointer items-center justify-between border-b border-[var(--glass-border)] text-left text-[15px] uppercase tracking-[1.5px] transition-colors last:border-b-0"
                  style={{
                    color: active === s ? "var(--brand)" : "var(--ink-muted)",
                    fontWeight: active === s ? 600 : 400,
                  }}
                >
                  <span>{s}</span>
                  {active === s && (
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--brand)" }}
                    />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
