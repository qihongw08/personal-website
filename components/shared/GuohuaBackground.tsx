import Image from "next/image";

/**
 * Gu\u00f3hu\u00e0 (\u56fd\u753b) ink-wash background.
 *
 * Uses a public-domain high-res image — Huang Gongwang, "Dwelling in the
 * Fuchun Mountains" (first half, 1350). Fixed full-viewport behind every
 * section, softened by a cream tinted overlay so it reads as atmosphere,
 * not a photograph.
 *
 * Source: https://en.wikipedia.org/wiki/Dwelling_in_the_Fuchun_Mountains
 * License: Public domain (creator died 1354).
 */
export function GuohuaBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Image
        src="/backgrounds/background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ opacity: 0.5, filter: "blur(2px) saturate(1.05)" }}
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
