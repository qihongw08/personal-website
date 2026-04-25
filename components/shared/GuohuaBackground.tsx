"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Guóhuà (国画) ink-wash background.
 *
 * Uses a public-domain high-res image — Huang Gongwang, "Dwelling in the
 * Fuchun Mountains" (first half, 1350). Fixed full-viewport behind every
 * section.
 *
 * The water feel comes from an SVG turbulence + displacement filter applied
 * to the image: fractal noise drives per-pixel displacement so the mountain
 * silhouettes waver like they're reflected on a slow pond. The turbulence
 * `baseFrequency` gently animates over 40s so the surface "breathes" without
 * ever feeling like an obvious loop.
 *
 * On mobile / touch devices the filter is dropped entirely — per-pixel
 * displacement on a full-viewport image every frame is a scroll killer,
 * and `position: fixed` additionally jitters during iOS URL-bar transitions.
 * Mobile gets a plain blurred image anchored to the scroll container.
 *
 * Source: https://en.wikipedia.org/wiki/Dwelling_in_the_Fuchun_Mountains
 * License: Public domain (creator died 1354).
 */
export function GuohuaBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(
      "(max-width: 768px), (hover: none) and (pointer: coarse)",
    );
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none inset-0 z-0 overflow-hidden ${
        isMobile ? "absolute" : "fixed"
      }`}
    >
      {!isMobile && (
        <svg
          aria-hidden
          focusable="false"
          width="0"
          height="0"
          className="absolute"
          style={{ position: "absolute", width: 0, height: 0 }}
        >
          <defs>
            <filter
              id="guohua-water"
              x="-10%"
              y="-10%"
              width="120%"
              height="120%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.011 0.008"
                numOctaves="2"
                seed="7"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="40s"
                  values="0.011 0.008;0.014 0.011;0.011 0.008"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="22"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}

      <Image
        src="/backgrounds/background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{
          opacity: 0.55,
          filter: isMobile
            ? "blur(2px) saturate(1.05)"
            : "url(#guohua-water) blur(1px) saturate(1.05)",
          willChange: isMobile ? undefined : "filter",
        }}
      />
      {/* Cream wash — lifts overall luminance so body text reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(248,247,244,0.55) 0%, rgba(248,247,244,0.35) 40%, rgba(248,247,244,0.55) 100%)",
        }}
      />
      {/* Vignette edges — stronger wash at top/bottom so headers & footer read cleanly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(248,247,244,0.35) 100%)",
        }}
      />
    </div>
  );
}
