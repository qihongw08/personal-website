"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { experience } from "@/content/experience";
import { SectionHeader } from "@/components/shared/SectionHeader";

export function Career() {
  const reduceMotion = useReducedMotion();
  const timelineRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 70%", "end 60%"],
  });
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Reveal only when the card reaches mid-screen. Negative top/bottom margins
  // shrink the effective viewport to a ~40% band centered vertically.
  const revealViewport = {
    once: true,
    margin: "-30% 0px -30% 0px",
  } as const;

  return (
    <section
      id="career"
      className="relative mx-auto max-w-[1100px] overflow-hidden px-5 pt-20 pb-16 sm:px-6 md:px-10 md:pt-[140px] md:pb-[100px]"
    >
      <SectionHeader title="Career" />

      <div ref={timelineRef} className="relative" style={{ position: "relative" }}>
        {/* Faint static track — always fully rendered so the line has a shape before scroll.
            On <lg viewports the spine sits 14px from the left so cards stack to its right;
            at lg+ it returns to the centerline for the alternating layout. */}
        <div
          aria-hidden
          className="absolute left-[14px] top-0 bottom-0 z-[1] w-px lg:left-1/2 lg:-translate-x-1/2"
          style={{ background: "rgba(26,26,46,0.08)" }}
        />
        {/* Scroll-linked progressed gradient — fills top→down as the user scrolls */}
        <motion.div
          aria-hidden
          className="absolute left-[14px] top-0 bottom-0 z-[1] w-px origin-top lg:left-1/2 lg:-translate-x-1/2"
          style={{
            background:
              "linear-gradient(to bottom, var(--brand), rgba(124,58,237,0.35), transparent)",
            scaleY: reduceMotion ? 1 : lineScale,
          }}
        />

        {experience.map((exp, i) => {
          const isLeft = i % 2 === 0;
          // On <lg we use flex-col-reverse so the (DOM-order) meta column ends up
          // visually ABOVE the card — role/period reads as a header on mobile.
          // At lg+ we restore the alternating row layout.
          const rowDir = isLeft ? "lg:flex-row" : "lg:flex-row-reverse";

          return (
            <div
              key={i}
              className={`relative mb-10 flex flex-col-reverse pl-10 md:mb-14 lg:pl-0 ${rowDir}`}
              style={{ perspective: 1200 }}
            >
              <div
                className={`flex flex-1 justify-start ${
                  isLeft
                    ? "lg:justify-end lg:pr-9"
                    : "lg:justify-start lg:pl-9"
                }`}
              >
                <div className="relative max-w-[460px]">
                  {/* Water droplet — impact glow plus concentric ripples on reveal */}
                  {!reduceMotion && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
                    >
                      {/* Impact splash — blur-free soft gradient is cheaper than filter:blur */}
                      <motion.div
                        className="absolute -inset-12"
                        style={{
                          background:
                            "radial-gradient(circle at center, rgba(8,145,178,0.55), rgba(8,145,178,0.2) 35%, transparent 70%)",
                          willChange: "transform, opacity",
                        }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        whileInView={{
                          opacity: [0, 0.8, 0],
                          scale: [0.6, 1.05, 1.15],
                        }}
                        viewport={revealViewport}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                      {/* Ripple rings — two staggered concentric waves */}
                      {[
                        { delay: 0, dur: 1.2, stroke: 1.5, max: 2.2 },
                        { delay: 0.22, dur: 1.4, stroke: 1, max: 2.8 },
                      ].map((r, k) => (
                        <motion.span
                          key={k}
                          className="absolute aspect-square rounded-full"
                          style={{
                            width: "58%",
                            border: `${r.stroke}px solid rgba(8,145,178,0.7)`,
                          }}
                          initial={{ scale: 0.35, opacity: 0 }}
                          whileInView={{
                            scale: [0.35, r.max],
                            opacity: [0, 0.75, 0],
                          }}
                          viewport={revealViewport}
                          transition={{
                            duration: r.dur,
                            delay: r.delay,
                            ease: [0.16, 1, 0.3, 1],
                            times: [0, 0.15, 1],
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <motion.div
                    className="glass-card relative z-[2] rounded-xl px-7 py-6"
                    style={{
                      transformOrigin: isLeft ? "right center" : "left center",
                    }}
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, scale: 0.7, rotateX: 12, y: 40 }
                    }
                    whileInView={
                      reduceMotion
                        ? { opacity: 1 }
                        : { opacity: 1, scale: 1, rotateX: 0, y: 0 }
                    }
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    viewport={revealViewport}
                    transition={{
                      duration: reduceMotion ? 0.3 : 0.9,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className="rounded font-mono text-[10px] tracking-[1px]"
                        style={{
                          padding: "2px 8px",
                          background:
                            exp.status === "Active"
                              ? "rgba(10,133,98,0.1)"
                              : "rgba(0,0,0,0.03)",
                          border: `1px solid ${
                            exp.status === "Active"
                              ? "rgba(10,133,98,0.3)"
                              : "var(--glass-border)"
                          }`,
                          color:
                            exp.status === "Active"
                              ? "#0a8562"
                              : "var(--ink-faint)",
                        }}
                      >
                        {exp.status}
                      </span>
                    </div>
                    <h3 className="m-0 mb-1 font-display text-lg font-bold text-[var(--ink)]">
                      {exp.company}
                    </h3>
                    <p className="my-3.5 text-[13px] leading-[1.7] text-[var(--ink-muted)]">
                      {exp.description}
                    </p>
                    {exp.bullets.map((b, j) => (
                      <div
                        key={j}
                        className="mb-0.5 text-xs leading-[1.7] text-[var(--ink-faint)]"
                      >
                        {b}
                      </div>
                    ))}
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {exp.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded border font-mono text-[10px] text-[var(--ink-muted)]"
                          style={{
                            padding: "3px 8px",
                            background: "rgba(0,0,0,0.03)",
                            borderColor: "var(--glass-border)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>

              <div
                aria-hidden
                className="absolute left-[14px] top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 lg:left-1/2"
              >
                {/* Pulsing ring — signals Active roles are still in progress */}
                {exp.status === "Active" && !reduceMotion && (
                  <motion.span
                    className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ background: "#1cb389" }}
                    animate={{ scale: [1, 2.2], opacity: [0.45, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
                <motion.span
                  className="relative block h-[11px] w-[11px] rounded-full"
                  style={{
                    background:
                      exp.status === "Active"
                        ? "#1cb389"
                        : "var(--ink-faint)",
                    boxShadow:
                      exp.status === "Active"
                        ? "0 0 12px rgba(28,179,137,0.45)"
                        : "none",
                    border: "2px solid var(--surface)",
                  }}
                  initial={
                    reduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }
                  }
                  whileInView={
                    reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }
                  }
                  viewport={revealViewport}
                  transition={{
                    duration: reduceMotion ? 0.3 : 0.6,
                    delay: reduceMotion ? 0 : 0.3,
                    ease: "easeOut",
                  }}
                />
              </div>

              <motion.div
                className={`z-[2] mb-2 flex flex-1 flex-col justify-center text-left lg:mb-0 ${
                  isLeft
                    ? "lg:pl-9 lg:text-left"
                    : "lg:pr-9 lg:text-right"
                }`}
                initial={
                  reduceMotion
                    ? { opacity: 0 }
                    : { opacity: 0, x: isLeft ? 20 : -20 }
                }
                whileInView={
                  reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }
                }
                viewport={revealViewport}
                transition={{
                  duration: reduceMotion ? 0.3 : 0.7,
                  delay: reduceMotion ? 0 : 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div className="text-sm font-medium text-[var(--brand)]">
                  {exp.role}
                </div>
                <div className="mt-1 font-mono text-[13px] text-[var(--ink-faint)]">
                  {exp.period}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
