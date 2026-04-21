"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { friends, tagColors, type Friend } from "@/content/friends";

type Node = Friend & {
  idx: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

type Edge = { a: number; b: number; tags: string[] };

export function FriendsGraph() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const animRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);

  const allTags = useMemo(
    () => [...new Set(friends.flatMap((f) => f.tags))],
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    const cx = W / 2;
    const cy = H / 2;

    const nodes: Node[] = friends.map((f, i) => {
      const angle = (i / friends.length) * Math.PI * 2;
      const r = 120 + Math.random() * 60;
      return {
        ...f,
        idx: i,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        vx: 0,
        vy: 0,
        radius: 24,
      };
    });
    nodesRef.current = nodes;

    const edges: Edge[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].tags.filter((t) => nodes[j].tags.includes(t));
        if (shared.length > 0) edges.push({ a: i, b: j, tags: shared });
      }
    }

    let mouseX = -1;
    let mouseY = -1;
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      let found: number | null = null;
      for (const n of nodes) {
        const dx = n.x - mouseX;
        const dy = n.y - mouseY;
        if (Math.sqrt(dx * dx + dy * dy) < n.radius + 4) {
          found = n.idx;
          break;
        }
      }
      setHovered(found);
      canvas.style.cursor = found !== null ? "pointer" : "default";
    };
    canvas.addEventListener("mousemove", onMove);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      if (!reduceMotion) {
        for (const n of nodes) {
          n.vx += (cx - n.x) * 0.0003;
          n.vy += (cy - n.y) * 0.0003;
          for (const m of nodes) {
            if (m.idx === n.idx) continue;
            const dx = n.x - m.x;
            const dy = n.y - m.y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            const force = 800 / (dist * dist);
            n.vx += (dx / dist) * force;
            n.vy += (dy / dist) * force;
          }
        }
        for (const e of edges) {
          const a = nodes[e.a];
          const b = nodes[e.b];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = (dist - 130) * 0.003;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
          b.vx -= (dx / dist) * force;
          b.vy -= (dy / dist) * force;
        }
        for (const n of nodes) {
          n.vx *= 0.85;
          n.vy *= 0.85;
          n.x += n.vx;
          n.y += n.vy;
          n.x = Math.max(n.radius + 10, Math.min(W - n.radius - 10, n.x));
          n.y = Math.max(n.radius + 10, Math.min(H - n.radius - 10, n.y));
        }
      }

      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const isHighlight = selectedTag ? e.tags.includes(selectedTag) : true;
        const tagColor = e.tags[0] && tagColors[e.tags[0]]
          ? tagColors[e.tags[0]].text
          : "#0891b2";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHighlight ? `${tagColor}30` : "rgba(0,0,0,0.04)";
        ctx.lineWidth = isHighlight ? 1.5 : 0.5;
        ctx.stroke();
      }

      for (const n of nodes) {
        const isActive = selectedTag ? n.tags.includes(selectedTag) : true;
        const isHov = hovered === n.idx;
        const alpha = isActive ? 1 : 0.25;

        if (isActive) {
          const tc =
            n.tags[0] && tagColors[n.tags[0]]
              ? tagColors[n.tags[0]].text
              : "#0891b2";
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 8, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(
            n.x,
            n.y,
            n.radius,
            n.x,
            n.y,
            n.radius + 12,
          );
          grad.addColorStop(0, `${tc}15`);
          grad.addColorStop(1, "transparent");
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = isHov
          ? "rgba(0,0,0,0.06)"
          : `rgba(0,0,0,${0.025 * alpha})`;
        ctx.fill();
        ctx.strokeStyle = isActive ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.04)";
        ctx.lineWidth = isHov ? 2 : 1;
        ctx.stroke();

        ctx.font = `600 ${isHov ? 14 : 12}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(26,26,46,${0.7 * alpha})`;
        ctx.fillText(n.name[0], n.x, n.y);

        ctx.font = "500 10px system-ui";
        ctx.fillStyle = `rgba(26,26,46,${0.45 * alpha})`;
        ctx.fillText(n.name, n.x, n.y + n.radius + 14);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
      canvas.removeEventListener("mousemove", onMove);
    };
  }, [hovered, selectedTag]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTag(null)}
          className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all"
          style={{
            background: !selectedTag ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
            borderColor: !selectedTag
              ? "rgba(0,0,0,0.15)"
              : "var(--glass-border)",
            color: !selectedTag ? "var(--ink)" : "var(--ink-muted)",
            cursor: "pointer",
          }}
        >
          All
        </button>
        {allTags.map((tag) => {
          const tc = tagColors[tag] ?? tagColors.College;
          const selected = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(selected ? null : tag)}
              className="rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all"
              style={{
                background: selected ? tc.bg : "rgba(0,0,0,0.02)",
                borderColor: selected ? tc.border : "var(--glass-border)",
                color: selected ? tc.text : "var(--ink-muted)",
                cursor: "pointer",
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="glass-card overflow-hidden rounded-2xl">
        <canvas
          ref={canvasRef}
          className="block h-[420px] w-full"
          aria-label="Force-directed graph of friends and their shared interests"
        />
      </div>
      <p className="mt-3 text-center text-xs text-[var(--ink-faint)]">
        Hover over nodes to see names · Filter by tag to highlight connections
      </p>
    </div>
  );
}
