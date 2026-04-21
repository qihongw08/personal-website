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

// Wall layout sizing — featured first tile, varied rest.
function wallSize(i: number): Size {
  if (i === 0) return { w: 260, h: 200 };
  const cycle: Size[] = [
    { w: 120, h: 150 },
    { w: 150, h: 120 },
    { w: 140, h: 140 },
    { w: 130, h: 160 },
    { w: 160, h: 130 },
  ];
  return cycle[(i - 1) % cycle.length];
}

// Strip layout sizing — mixed widths for organic row feel.
function stripSize(i: number): Size {
  const cycle: Size[] = [
    { w: 170, h: 130 },
    { w: 140, h: 130 },
    { w: 200, h: 130 },
    { w: 150, h: 130 },
    { w: 180, h: 130 },
  ];
  return cycle[i % cycle.length];
}

const Polaroid = memo(function Polaroid({
  item,
  index,
  width,
  height,
  rotation,
  priority,
  onOpen,
}: {
  item: Media;
  index: number;
  width: number;
  height: number;
  rotation: number;
  priority: boolean;
  onOpen: (index: number) => void;
}) {
  const handleClick = useCallback(() => onOpen(index), [onOpen, index]);
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Open ${item.caption ?? item.label}`}
      className="group relative flex-shrink-0 outline-none transition-transform duration-500 hover:z-10 focus-visible:z-10"
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
          className="relative overflow-hidden"
          style={{ height, background: "rgba(0,0,0,0.06)" }}
        >
          {item.type === "video" ? (
            <video
              src={item.src}
              muted
              playsInline
              preload="none"
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

  const sizeFor = variant === "wall" ? wallSize : stripSize;

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
          const { w, h } = sizeFor(i);
          return (
            <Polaroid
              key={m.src}
              item={m}
              index={i}
              width={w}
              height={h}
              rotation={tiltFor(m.src)}
              priority={i === 0 && variant === "wall"}
              onOpen={openAt}
            />
          );
        })}
        {overflow > 0 && (
          <button
            type="button"
            onClick={() => setLightbox(cap)}
            className="flex flex-shrink-0 items-center justify-center rounded-md border font-mono text-[11px] text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
            style={{
              width: 100,
              height: 130,
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
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
          {multiple && (
            <span className="flex-shrink-0 font-mono text-[11px] text-[var(--ink-faint)]">
              {index + 1} / {media.length}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-6 top-6 z-20 flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[rgba(255,255,255,0.6)]"
        style={{
          background: "rgba(248,247,244,0.7)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--glass-border)",
        }}
      >
        <X size={16} />
      </button>

      {multiple && (
        <>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous"
            className="absolute left-6 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[rgba(255,255,255,0.6)]"
            style={{
              background: "rgba(248,247,244,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next"
            className="absolute right-6 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] transition-colors hover:bg-[rgba(255,255,255,0.6)]"
            style={{
              background: "rgba(248,247,244,0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--glass-border)",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
