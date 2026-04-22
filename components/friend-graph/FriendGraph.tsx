"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { computeLayout } from "./layout";
import type {
  FriendGraphProps,
  FriendNode,
  PlacedCluster,
  PlacedNode,
  RootNode,
} from "./types";

const TILE_RADIUS = 14;
const ROOT_RADIUS = 18;
const MIN_SCALE = 0.3;
const MAX_SCALE = 3;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const glassStyle: React.CSSProperties = {
  background: "var(--graph-tile-bg, var(--glass-bg, rgba(248,247,244,0.7)))",
  border:
    "1px solid var(--graph-tile-border, var(--glass-border, rgba(255,255,255,0.55)))",
  backdropFilter: "blur(20px) saturate(1.3)",
  WebkitBackdropFilter: "blur(20px) saturate(1.3)",
  boxShadow:
    "0 8px 24px rgba(26,26,46,0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
};

function Avatar({
  name,
  photo,
  size,
  accent,
}: {
  name: string;
  photo?: string;
  size: number;
  accent: string;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `${accent}1a`,
        border: `1px solid ${accent}33`,
        fontFamily: "var(--font-mono, ui-monospace), monospace",
        fontSize: size * 0.32,
        fontWeight: 600,
        color: accent,
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <span>{initialsOf(name)}</span>
      )}
    </div>
  );
}

function FriendTile<T extends string>({
  node,
  accent,
  hovered,
  onHover,
}: {
  node: PlacedNode<T>;
  accent: string;
  hovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const { friend, position, width, height } = node;
  const tileStyle: React.CSSProperties = {
    all: "unset",
    boxSizing: "border-box",
    width,
    minHeight: height,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 12,
    gap: 8,
    borderRadius: TILE_RADIUS,
    cursor: friend.link ? "pointer" : "default",
    transform: hovered ? "translateY(-3px)" : "translateY(0)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    ...glassStyle,
    boxShadow: hovered
      ? `0 10px 28px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.55)`
      : glassStyle.boxShadow,
    borderColor: hovered ? `${accent}66` : (glassStyle.border as string),
  };

  const content = (
    <>
      <Avatar name={friend.name} photo={friend.photo} size={52} accent={accent} />
      <div
        style={{
          fontFamily: "var(--font-display, var(--font-sans), ui-sans-serif)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--ink, #1a1a2e)",
          textAlign: "center",
          lineHeight: 1.25,
          width: "100%",
          wordBreak: "break-word",
        }}
      >
        {friend.name}
      </div>
      {friend.headline ? (
        <div
          style={{
            fontFamily: "var(--font-mono, ui-monospace), monospace",
            fontSize: 9,
            letterSpacing: "0.8px",
            color: "var(--ink-faint, rgba(26,26,46,0.52))",
            textTransform: "uppercase",
            textAlign: "center",
            lineHeight: 1.3,
            width: "100%",
            wordBreak: "break-word",
          }}
        >
          {friend.headline}
        </div>
      ) : null}
    </>
  );

  const hoverHandlers = {
    onMouseEnter: () => onHover(friend.id),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(friend.id),
    onBlur: () => onHover(null),
  };

  const ariaLabel = `${friend.name}${friend.headline ? ` — ${friend.headline}` : ""}`;

  return (
    <foreignObject
      x={position.x}
      y={position.y}
      width={width}
      height={height + 8}
      style={{ overflow: "visible" }}
    >
      {friend.link ? (
        <a
          href={friend.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ariaLabel}
          style={tileStyle}
          {...hoverHandlers}
        >
          {content}
        </a>
      ) : (
        <div role="group" aria-label={ariaLabel} style={tileStyle} {...hoverHandlers}>
          {content}
        </div>
      )}
    </foreignObject>
  );
}

function RootTile({
  root,
  position,
  width,
  height,
  accent,
}: {
  root: RootNode;
  position: { x: number; y: number };
  width: number;
  height: number;
  accent: string;
}) {
  const rootStyle: React.CSSProperties = {
    all: "unset",
    boxSizing: "border-box",
    width,
    minHeight: height,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 10,
    borderRadius: ROOT_RADIUS,
    cursor: root.link ? "pointer" : "default",
    ...glassStyle,
    boxShadow: `0 0 0 2px ${accent}55, 0 10px 32px ${accent}2e, inset 0 1px 0 rgba(255,255,255,0.55)`,
  };

  const content = (
    <>
      <Avatar name={root.name} photo={root.photo} size={72} accent={accent} />
      <div
        style={{
          fontFamily: "var(--font-display, var(--font-sans), ui-sans-serif)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--ink, #1a1a2e)",
          textAlign: "center",
          lineHeight: 1.25,
          wordBreak: "break-word",
        }}
      >
        {root.name}
      </div>
      {root.headline ? (
        <div
          style={{
            fontFamily: "var(--font-mono, ui-monospace), monospace",
            fontSize: 9,
            letterSpacing: "1.2px",
            color: accent,
            textTransform: "uppercase",
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {root.headline}
        </div>
      ) : null}
    </>
  );

  return (
    <foreignObject
      x={position.x}
      y={position.y}
      width={width}
      height={height + 40}
      style={{ overflow: "visible" }}
    >
      {root.link ? (
        <a
          href={root.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={root.name}
          style={rootStyle}
        >
          {content}
        </a>
      ) : (
        <div style={rootStyle}>{content}</div>
      )}
    </foreignObject>
  );
}

function ClusterFrame<T extends string>({
  cluster,
  hoveredId,
  onHover,
  index,
  reduceMotion,
}: {
  cluster: PlacedCluster<T>;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  index: number;
  reduceMotion: boolean;
}) {
  const { box, label, color, nodes } = cluster;
  const labelY = box.y + 20;

  return (
    <motion.g
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: reduceMotion ? 0.3 : 0.7,
        delay: reduceMotion ? 0 : index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{ transformOrigin: `${cluster.center.x}px ${cluster.center.y}px` }}
    >
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={16}
        ry={16}
        fill={`${color}0a`}
        stroke={`${color}55`}
        strokeDasharray="6 5"
        strokeWidth={1}
      />
      <text
        x={box.x + 14}
        y={labelY}
        fontSize={11}
        fontFamily="var(--font-mono, ui-monospace), monospace"
        fill={color}
        style={{ letterSpacing: "1.5px", fontWeight: 600 }}
      >
        {label}
      </text>
      {nodes.map((n) => (
        <FriendTile
          key={n.friend.id}
          node={n}
          accent={color}
          hovered={hoveredId === n.friend.id}
          onHover={onHover}
        />
      ))}
    </motion.g>
  );
}

type ViewState = { tx: number; ty: number; scale: number };

export function FriendGraph<T extends string = string>({
  root,
  friends,
  tags,
  height = 640,
  className,
}: FriendGraphProps<T>) {
  const reduceMotion = useReducedMotion() ?? false;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>({ tx: 0, ty: 0, scale: 1 });
  const [panning, setPanning] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ x: number; y: number; pointerId: number } | null>(
    null,
  );

  const layout = useMemo(
    () => computeLayout<T>(friends as FriendNode<T>[], tags),
    [friends, tags],
  );

  const rootAccent = "var(--brand, #0891b2)";

  // Wheel zoom centered on cursor. React's onWheel is passive, so attach
  // manually with passive:false to cancel page scroll.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const aspectScale = Math.min(
        rect.width / layout.viewBox.width,
        rect.height / layout.viewBox.height,
      );
      // Cursor in viewBox coordinates (pre-pan/zoom offset accounted).
      const offsetX = (rect.width - layout.viewBox.width * aspectScale) / 2;
      const offsetY = (rect.height - layout.viewBox.height * aspectScale) / 2;
      const cursorX = (e.clientX - rect.left - offsetX) / aspectScale;
      const cursorY = (e.clientY - rect.top - offsetY) / aspectScale;

      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
        const k = newScale / v.scale;
        // Keep the point under the cursor fixed.
        const newTx = cursorX - (cursorX - v.tx) * k;
        const newTy = cursorY - (cursorY - v.ty) * k;
        return { tx: newTx, ty: newTy, scale: newScale };
      });
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [layout.viewBox.width, layout.viewBox.height]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    // Don't start a pan if the user grabbed an interactive element.
    if (target.closest("button, a, input")) return;
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      pointerId: e.pointerId,
    };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragRef.current = { ...drag, x: e.clientX, y: e.clientY };

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const aspectScale = Math.min(
      rect.width / layout.viewBox.width,
      rect.height / layout.viewBox.height,
    );
    // Convert screen-space delta to viewBox-space delta, dividing out both
    // the rendered aspect scale and the current zoom scale.
    setView((v) => ({
      ...v,
      tx: v.tx + dx / aspectScale,
      ty: v.ty + dy / aspectScale,
    }));
  };

  const endPan = (e: React.PointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === e.pointerId) {
      dragRef.current = null;
      setPanning(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  return (
    <div
      className={className}
      style={{
        width: "100%",
        position: "relative",
        touchAction: "none",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Network graph showing ${friends.length} connections grouped into ${layout.clusters.length} clusters.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPan}
        onPointerCancel={endPan}
        style={{
          width: "100%",
          height,
          display: "block",
          overflow: "hidden",
          cursor: panning ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        {/* Transparent background captures pan gestures in empty space. */}
        <rect
          x={0}
          y={0}
          width={layout.viewBox.width}
          height={layout.viewBox.height}
          fill="transparent"
        />

        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          {/* Bridge edges — drawn behind clusters so they read as background lines */}
          {layout.edges
            .filter((e) => e.kind === "bridge")
            .map((e, i) => (
              <line
                key={`bridge-${i}`}
                x1={e.from.x}
                y1={e.from.y}
                x2={e.to.x}
                y2={e.to.y}
                stroke="var(--ink-faint, rgba(26,26,46,0.52))"
                strokeOpacity={0.35}
                strokeDasharray="3 6"
                strokeWidth={1}
              />
            ))}

          {/* Root edges — dashed cyan from cluster to root */}
          {layout.edges
            .filter((e) => e.kind === "root")
            .map((e, i) => (
              <line
                key={`root-${i}`}
                x1={e.from.x}
                y1={e.from.y}
                x2={e.to.x}
                y2={e.to.y}
                stroke={rootAccent}
                strokeOpacity={0.45}
                strokeDasharray="5 6"
                strokeWidth={1.2}
              />
            ))}

          {layout.clusters.map((c, i) => (
            <ClusterFrame
              key={c.id}
              cluster={c}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              index={i}
              reduceMotion={reduceMotion}
            />
          ))}

          <RootTile
            root={root}
            position={layout.root.position}
            width={layout.root.width}
            height={layout.root.height}
            accent={rootAccent}
          />
        </g>
      </svg>
    </div>
  );
}
