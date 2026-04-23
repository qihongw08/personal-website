"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { Media } from "@/lib/media";

type Variant = "wall" | "strip";

type Props = {
  media: Media[];
  variant: Variant;
  /** Optional cap on visible tiles before overflow badge shows. */
  maxVisible?: number;
};

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Accepts "YYYY-MM" or "YYYY-MM-DD" and renders "Sep 2025" / "Sep 14, 2025".
// Anything that doesn't match the shape passes through unchanged.
function formatDate(raw: string): string {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(raw.trim());
  if (!match) return raw;
  const [, year, monthStr, dayStr] = match;
  const monthIndex = parseInt(monthStr, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return raw;
  const month = MONTH_NAMES[monthIndex];
  if (dayStr) return `${month} ${parseInt(dayStr, 10)}, ${year}`;
  return `${month} ${year}`;
}

// Deterministic pseudo-random drawn from the filename — same media always
// gets the same tilt, so hydration matches and the look is stable.
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
function tiltFor(src: string): number {
  const h = hash(src);
  const mag = 1.2 + (h % 24) / 10; // 1.2–3.5
  return h % 2 === 0 ? -mag : mag;
}

type Size = { w: number; h: number };

/**
 * Pick tile dimensions from the actual media aspect ratio.
 *   - strip: constant height, width follows aspect (nice horizontal row).
 *   - wall:  landscape / portrait / square presets so the collage still
 *            varies in shape — featured (first) tile is a beat larger.
 * Aspect is width / height; a landscape 16:9 photo is ~1.78.
 */
function sizeFromAspect(
  aspect: number,
  variant: Variant,
  featured: boolean,
  scale: number,
): Size {
  if (variant === "strip") {
    const H = Math.round(140 * scale);
    return {
      w: Math.round(Math.max(90, Math.min(240, H * aspect))),
      h: H,
    };
  }
  const shortSide = Math.round((featured ? 200 : 140) * scale);
  const longSide = Math.round((featured ? 280 : 200) * scale);
  const squareSide = Math.round((featured ? 240 : 160) * scale);
  if (aspect >= 1.1) return { w: longSide, h: shortSide }; // landscape
  if (aspect <= 0.9) return { w: shortSide, h: longSide }; // portrait
  return { w: squareSide, h: squareSide };
}

// Assume landscape until the media reports its real dimensions. Keeps
// the first-paint layout close to the final one so there's no big jump.
const DEFAULT_ASPECT = 1.3;

const Polaroid = memo(function Polaroid({
  item,
  index,
  width,
  height,
  rotation,
  priority,
  onOpen,
  onAspect,
}: {
  item: Media;
  index: number;
  width: number;
  height: number;
  rotation: number;
  priority: boolean;
  onOpen: (index: number) => void;
  onAspect: (src: string, aspect: number) => void;
}) {
  const handleClick = useCallback(() => onOpen(index), [onOpen, index]);
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Open ${item.caption ?? item.label}`}
      className="group relative flex-shrink-0 outline-none transition-all duration-500 hover:z-10 focus-visible:z-10"
      style={{
        width,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "center center",
      }}
    >
      <div
        className="flex flex-col p-2 pb-0 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04] group-hover:rotate-0 group-focus-visible:rotate-0"
        style={{
          background: "#faf6ee",
          borderRadius: 3,
          boxShadow:
            "0 2px 6px rgba(26,26,46,0.10), 0 10px 24px rgba(26,26,46,0.08)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="relative overflow-hidden transition-[height] duration-500"
          style={{ height, background: "rgba(0,0,0,0.06)" }}
        >
          {item.type === "video" ? (
            // `#t=0.1` renders the frame at 0.1s as a poster-like thumbnail,
            // avoiding the black-frame default that preload="metadata" gives.
            <video
              src={`${item.src}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  onAspect(item.src, v.videoWidth / v.videoHeight);
                }
              }}
              className="pointer-events-none h-full w-full object-cover"
            />
          ) : (
            <Image
              src={item.src}
              alt={item.label}
              fill
              sizes={`${width}px`}
              loading={priority ? "eager" : "lazy"}
              priority={priority}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight) {
                  onAspect(item.src, img.naturalWidth / img.naturalHeight);
                }
              }}
              className="object-cover"
            />
          )}
          {item.type === "video" && (
            <div
              aria-hidden
              className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <Play size={9} fill="white" className="text-white" />
            </div>
          )}
        </div>
        <div
          className="flex min-h-[32px] items-center justify-center px-1 py-2 text-center"
          style={{
            fontFamily:
              "var(--font-handwritten), ui-rounded, 'Caveat', cursive",
          }}
        >
          <span
            className="line-clamp-2 text-[15px] leading-[1.1] text-[var(--ink)]"
            style={{ letterSpacing: "0.3px" }}
          >
            {item.caption ?? ""}
            {!item.caption && (
              <span className="text-[var(--ink-faint)]">—</span>
            )}
          </span>
        </div>
      </div>
    </button>
  );
});

export function MediaViewer({ media, variant, maxVisible }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  // Scale tile presets down on small screens. SSR uses 1; client adjusts on
  // mount + resize. The flash is cheap because tiles are flex-wrap / overflow-x.
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setScale(w < 480 ? 0.65 : w < 768 ? 0.8 : 1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  const onAspect = useCallback((src: string, aspect: number) => {
    setAspects((prev) =>
      Math.abs((prev[src] ?? 0) - aspect) < 0.001
        ? prev
        : { ...prev, [src]: aspect },
    );
  }, []);

  const openAt = useCallback((i: number) => setLightbox(i), []);
  const close = useCallback(() => setLightbox(null), []);
  const next = useCallback(() => {
    setLightbox((i) => (i === null ? null : (i + 1) % media.length));
  }, [media.length]);
  const prev = useCallback(() => {
    setLightbox((i) =>
      i === null ? null : (i - 1 + media.length) % media.length,
    );
  }, [media.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, close, next, prev]);

  if (media.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed text-center font-mono text-[10px] text-[var(--ink-faint)]"
        style={{
          height: 120,
          background: "rgba(0,0,0,0.02)",
          borderColor: "var(--glass-border)",
        }}
      >
        [ drop files into public folder ]
      </div>
    );
  }

  const cap = maxVisible ?? media.length;
  const visible = media.slice(0, cap);
  const overflow = media.length - visible.length;

  return (
    <>
      <div
        className={
          variant === "wall"
            ? "flex flex-wrap gap-3 py-2"
            : "flex gap-3 overflow-x-auto py-2"
        }
        style={{ paddingLeft: 6, paddingRight: 6 }}
      >
        {visible.map((m, i) => {
          const featured = i === 0 && variant === "wall";
          const aspect = aspects[m.src] ?? DEFAULT_ASPECT;
          const { w, h } = sizeFromAspect(aspect, variant, featured, scale);
          return (
            <Polaroid
              key={m.src}
              item={m}
              index={i}
              width={w}
              height={h}
              rotation={tiltFor(m.src)}
              priority={featured}
              onOpen={openAt}
              onAspect={onAspect}
            />
          );
        })}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setLightbox(cap)}
            className="flex flex-shrink-0 items-center justify-center rounded-md border font-mono text-[11px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            style={{
              width: Math.round(100 * scale),
              height: Math.round(130 * scale),
              background: "rgba(0,0,0,0.03)",
              borderColor: "var(--glass-border)",
              transform: "rotate(-1.5deg)",
            }}
          >
            +{overflow} more
          </button>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox
          media={media}
          index={lightbox}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  );
}

function Lightbox({
  media,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  media: Media[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = media[index];
  const multiple = media.length > 1;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close media viewer"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{
          background: "rgba(26,26,46,0.42)",
          backdropFilter: "blur(40px) saturate(1.25)",
          WebkitBackdropFilter: "blur(40px) saturate(1.25)",
        }}
      />

      <div
        className="glass-card relative z-10 flex max-h-[85vh] max-w-[92vw] flex-col rounded-2xl p-3"
        style={{ background: "rgba(248,247,244,0.82)" }}
      >
        <div className="overflow-hidden rounded-xl">
          {item.type === "video" ? (
            <video
              key={item.src}
              src={item.src}
              controls
              playsInline
              preload="metadata"
              className="block max-h-[70vh] max-w-[84vw] object-contain"
            />
          ) : (
            <Image
              key={item.src}
              src={item.src}
              alt={item.label}
              width={1600}
              height={1200}
              sizes="84vw"
              priority
              style={{ width: "auto", height: "auto" }}
              className="block max-h-[70vh] max-w-[84vw] object-contain"
            />
          )}
        </div>
        <div className="mt-3 flex items-end justify-between gap-4 px-1">
          <span
            className="text-[18px] leading-tight text-[var(--ink)]"
            style={{
              fontFamily:
                "var(--font-handwritten), ui-rounded, 'Caveat', cursive",
            }}
          >
            {item.caption ?? item.label}
          </span>
          {(item.date || multiple) && (
            <div className="flex flex-shrink-0 flex-col items-end gap-0.5 leading-tight">
              {item.date && (
                <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                  {formatDate(item.date)}
                </span>
              )}
              {multiple && (
                <span className="font-mono text-[11px] text-[var(--ink-faint)]">
                  {index + 1} / {media.length}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[rgba(255,255,255,0.6)] sm:right-6 sm:top-6 sm:h-10 sm:w-10"
        style={{
          background: "rgba(248,247,244,0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <X size={18} />
      </button>

      {multiple && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[rgba(255,255,255,0.6)] sm:left-6 sm:h-10 sm:w-10"
            style={{
              background: "rgba(248,247,244,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[rgba(255,255,255,0.6)] sm:right-6 sm:h-10 sm:w-10"
            style={{
              background: "rgba(248,247,244,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
}
