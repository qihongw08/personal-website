"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Terminal } from "./Terminal";

export function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollDown = () => {
    const el = document.getElementById("about");
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <section
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
          filter: "blur(60px)",
          animation: "floatOrb 8s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute h-[400px] w-[400px] rounded-full"
        style={{
          bottom: "20%",
          right: "10%",
          background: "radial-gradient(circle, rgba(124,58,237,0.06), transparent 70%)",
          filter: "blur(80px)",
          animation: "floatOrb 10s ease-in-out infinite reverse",
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
