"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { LolRankSnapshot } from "@/content/lol";
import { tierColor } from "@/lib/riot";
import { TierEmblem } from "./TierEmblem";

const DEFAULT_VISIBLE = 5;

export function RankHistoryTable({
  history,
}: {
  history: LolRankSnapshot[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (history.length === 0) return null;

  const visible = expanded ? history : history.slice(0, DEFAULT_VISIBLE);
  const canToggle = history.length > DEFAULT_VISIBLE;

  return (
    <div className="mt-4">
      <div className="mb-2 font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
        PREVIOUS SEASONS
      </div>
      <div
        className="grid items-center gap-3 border-b pb-1.5"
        style={{
          borderColor: "var(--glass-border)",
          gridTemplateColumns: "96px 1fr auto",
        }}
      >
        <span className="font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
          SEASON
        </span>
        <span className="font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
          TIER
        </span>
        <span className="text-right font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
          LP
        </span>
      </div>
      <div>
        {visible.map((h, i) => {
          const tier = h.rank.split(" ")[0]?.toUpperCase() ?? "UNRANKED";
          const color = tierColor(tier);
          const isLast = i === visible.length - 1;
          return (
            <div
              key={i}
              className="grid items-center gap-3 py-1.5"
              style={{
                gridTemplateColumns: "96px 1fr auto",
                borderBottom: isLast
                  ? "none"
                  : "1px solid var(--glass-border)",
              }}
            >
              <span
                className="justify-self-start rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-[var(--ink-muted)]"
                style={{ background: "rgba(26,26,46,0.08)" }}
              >
                {h.season}
              </span>
              <div className="flex items-center gap-2">
                <TierEmblem color={color} size={18} />
                <span className="text-[12px] text-[var(--ink)]">{h.rank}</span>
                {h.queue && (
                  <span className="ml-1 font-mono text-[9px] text-[var(--ink-faint)]">
                    {h.queue}
                  </span>
                )}
              </div>
              <span className="text-right font-mono text-[11px] text-[var(--ink-muted)]">
                {h.lp ?? ""}
              </span>
            </div>
          );
        })}
      </div>
      {canToggle && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 flex w-full items-center justify-center gap-1 rounded-md py-1.5 font-mono text-[10px] tracking-[1px] text-[var(--ink-muted)] transition-colors hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--ink)]"
        >
          {expanded ? (
            <>
              Show less <ChevronUp size={12} />
            </>
          ) : (
            <>
              Show all {history.length} seasons <ChevronDown size={12} />
            </>
          )}
        </button>
      )}
    </div>
  );
}
