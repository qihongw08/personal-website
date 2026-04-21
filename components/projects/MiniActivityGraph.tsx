"use client";

import { useRef, useState } from "react";
import type { ActivityBuckets } from "@/lib/github";

const W = 200;
const H = 50;
const PAD = 2;
const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;

function formatTick(ms: number, granularity: ActivityBuckets["granularity"]): string {
  const d = new Date(ms);
  if (granularity === "hour") {
    return d.toLocaleString("en-US", { hour: "numeric" });
  }
  if (granularity === "day") {
    return d.toLocaleString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function bucketLabel(activity: ActivityBuckets, i: number): string {
  const { fromMs, granularity } = activity;
  if (granularity === "hour") {
    const start = new Date(fromMs + i * HOUR_MS);
    return start.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
    });
  }
  if (granularity === "month") {
    const d = new Date(fromMs);
    d.setMonth(d.getMonth() + i);
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  }
  if (granularity === "week") {
    const start = new Date(fromMs + i * 7 * DAY_MS);
    return `Week of ${start.toLocaleString("en-US", { month: "short", day: "numeric" })}`;
  }
  const day = new Date(fromMs + i * DAY_MS);
  return day.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MiniActivityGraph({ activity }: { activity: ActivityBuckets }) {
  const { counts, fromMs, toMs, granularity } = activity;
  const max = Math.max(1, ...counts);
  const n = Math.max(1, counts.length);
  const step = n > 1 ? (W - PAD * 2) / (n - 1) : 0;

  const pts = counts.map((v, i) => ({
    x: PAD + i * step,
    y: H - PAD - (v / max) * (H - PAD * 2),
  }));

  const line =
    pts
      .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
      .join(" ") || `M${PAD},${H - PAD}`;
  const area = `${line} L${PAD + (n - 1) * step},${H} L${PAD},${H} Z`;

  const total = counts.reduce((a, b) => a + b, 0);
  const gradId = `grad-${fromMs}-${toMs}`;

  const tickCount = 4;
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const t = fromMs + ((toMs - fromMs) * i) / (tickCount - 1);
    return formatTick(t, granularity);
  });

  const [hover, setHover] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || n < 1) return;
    const xRatio = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(xRatio * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, idx)));
  };

  const hoverPt = hover !== null ? pts[hover] : null;
  const hoverPctX = hover !== null && n > 1 ? (hover / (n - 1)) * 100 : 50;

  return (
    <div className="mt-3">
      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="relative"
        style={{ height: 50 }}
      >
        {hover !== null && (
          <div
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-[var(--glass-border)] bg-white px-2 py-1 font-mono text-[10px] text-[var(--ink)] shadow-sm"
            style={{
              left: `${hoverPctX}%`,
              top: -34,
              transform: "translateX(-50%)",
            }}
          >
            <span className="font-semibold text-[var(--brand)]">
              {counts[hover]}
            </span>{" "}
            commit{counts[hover] === 1 ? "" : "s"} ·{" "}
            <span className="text-[var(--ink-muted)]">{bucketLabel(activity, hover)}</span>
          </div>
        )}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          style={{ height: 50 }}
          preserveAspectRatio="none"
          role="img"
          aria-label={`${total} commits across ${n} ${granularity}${n === 1 ? "" : "s"}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(8,145,178,0.18)" />
              <stop offset="100%" stopColor="rgba(8,145,178,0)" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke="rgba(8,145,178,0.45)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {hoverPt && (
            <>
              <line
                x1={hoverPt.x}
                y1={PAD}
                x2={hoverPt.x}
                y2={H - PAD}
                stroke="rgba(8,145,178,0.3)"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={hoverPt.x}
                cy={hoverPt.y}
                r={2.5}
                fill="rgba(8,145,178,1)"
                stroke="white"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </>
          )}
        </svg>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] text-[var(--ink-faint)]">
        {ticks.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  );
}
