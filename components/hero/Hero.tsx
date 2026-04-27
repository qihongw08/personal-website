"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Terminal } from "./Terminal";

export function Hero() {
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [orbsActive, setOrbsActive] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px), (hover: none) and (pointer: coarse)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause the floating-orb keyframe animations whenever the hero is offscreen.
  // `filter: blur(40-50px)` on an animated element keeps a backing buffer hot
  // even when the section is no longer visible, so this saves continuous GPU
  // work after the user scrolls past.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOrbsActive(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollDown = () => {
    const el = document.getElementById("about");
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y });
  };

  return (
    <section
      ref={sectionRef}
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 sm:px-6 md:px-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute h-[300px] w-[300px] rounded-full"
        style={{
          top: "15%",
          left: "10%",
          background: "radial-gradient(circle, rgba(8,145,178,0.08), transparent 70%)",
          filter: isMobile ? "blur(20px)" : "blur(40px)",
          animationName: isMobile ? "none" : "floatOrb",
          animationDuration: "8s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationPlayState: orbsActive ? "running" : "paused",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute h-[400px] w-[400px] rounded-full"
        style={{
          bottom: "20%",
          right: "10%",
          background: "radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)",
          filter: isMobile ? "blur(24px)" : "blur(50px)",
          animationName: isMobile ? "none" : "floatOrb",
          animationDuration: "10s",
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDirection: "reverse",
          animationPlayState: orbsActive ? "running" : "paused",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={loaded ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full"
      >
        <Terminal />
      </motion.div>

      <motion.button
        onClick={scrollDown}
        initial={{ opacity: 0 }}
        animate={loaded ? { opacity: 0.55 } : {}}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute bottom-6 flex cursor-pointer flex-col items-center gap-2 px-6 py-3 sm:bottom-10"
        aria-label="Scroll to about section"
      >
        <span className="text-[11px] uppercase tracking-[3px] text-[var(--ink-faint)]">
          Scroll
        </span>
        <div
          className="h-[30px] w-[2px]"
          style={{
            background:
              "linear-gradient(to bottom, var(--ink-faint), transparent)",
          }}
        />
      </motion.button>
    </section>
  );
}
