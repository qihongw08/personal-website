"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  computeGraph,
  convexHull,
  nodeCenter,
  nodeEdgeTowards,
  splitHeadline,
} from "./layout";
import type {
  FriendGraphNode,
  FriendGraphProps,
  FriendNode,
  GraphNode,
  RootGraphNode,
  Vec,
} from "./types";

const TILE_RADIUS = 14;
const ROOT_RADIUS = 18;
// Prevent scale from collapsing to 0 / flipping / creating NaN; no practical
// upper bound — zoom as far in as you want.
const MIN_SCALE = 0.05;
const DRAG_THRESHOLD = 3; // px of screen movement before a pointerdown becomes a drag

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
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            pointerEvents: "none",
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
  hovered,
  engaged,
  onHover,
  onNodePointerDown,
  onSuppressClick,
}: {
  node: FriendGraphNode<T>;
  hovered: boolean;
  engaged: boolean;
  onHover: (id: string | null) => void;
  onNodePointerDown: (e: React.PointerEvent<HTMLElement>, id: string) => void;
  onSuppressClick: (id: string) => boolean;
}) {
  const { friend, position, width, height, color } = node;
  const accent = color;

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
    cursor: engaged ? "grab" : "pointer",
    transform: hovered ? "translateY(-3px)" : "translateY(0)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    // Until engaged, let touch gestures pan the page vertically; once engaged
    // the tile fully owns pointer gestures for drag-to-move.
    touchAction: engaged ? "none" : "pan-y",
    ...glassStyle,
    boxShadow: hovered
      ? `0 10px 28px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.55)`
      : glassStyle.boxShadow,
    borderColor: hovered ? `${accent}66` : (glassStyle.border as string),
  };

  const hoverHandlers = {
    onMouseEnter: () => onHover(friend.id),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(friend.id),
    onBlur: () => onHover(null),
  };

  const ariaLabel = `${friend.name}${friend.headline ? ` — ${friend.headline}` : ""}`;

  const nameText = (
    <span style={{ color: "inherit", textDecoration: "none" }}>
      {friend.name}
    </span>
  );

  return (
    <foreignObject
      x={position.x}
      y={position.y}
      width={width}
      height={height + 8}
      style={{ overflow: "visible" }}
    >
      <div
        role="group"
        data-node-id={friend.id}
        aria-label={ariaLabel}
        onPointerDown={(e) => onNodePointerDown(e, friend.id)}
        style={tileStyle}
        {...hoverHandlers}
      >
        <Avatar
          name={friend.name}
          photo={friend.photo}
          size={52}
          accent={accent}
        />
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
          {friend.link ? (
            <a
              href={friend.link}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              onClick={(e) => {
                if (onSuppressClick(friend.id)) e.preventDefault();
              }}
              style={{
                color: "inherit",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {nameText}
            </a>
          ) : (
            nameText
          )}
        </div>
        {friend.headline
          ? splitHeadline(friend.headline).map((segment, i) => (
              <div
                key={i}
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
                {segment}
              </div>
            ))
          : null}
      </div>
    </foreignObject>
  );
}

function RootTile<T extends string>({
  node,
  accent,
  engaged,
  onNodePointerDown,
  onSuppressClick,
}: {
  node: RootGraphNode;
  accent: string;
  engaged: boolean;
  onNodePointerDown: (e: React.PointerEvent<HTMLElement>, id: string) => void;
  onSuppressClick: (id: string) => boolean;
  _t?: T;
}) {
  const { root, position, width, height, id } = node;
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
    cursor: engaged ? "grab" : "pointer",
    touchAction: engaged ? "none" : "pan-y",
    ...glassStyle,
    boxShadow: `0 0 0 2px ${accent}55, 0 10px 32px ${accent}2e, inset 0 1px 0 rgba(255,255,255,0.55)`,
  };

  return (
    <foreignObject
      x={position.x}
      y={position.y}
      width={width}
      height={height + 8}
      style={{ overflow: "visible" }}
    >
      <div
        data-node-id={id}
        onPointerDown={(e) => onNodePointerDown(e, id)}
        style={rootStyle}
        aria-label={root.name}
      >
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
          {root.link ? (
            <a
              href={root.link}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              onClick={(e) => {
                if (onSuppressClick(id)) e.preventDefault();
              }}
              style={{
                color: "inherit",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              {root.name}
            </a>
          ) : (
            root.name
          )}
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
      </div>
    </foreignObject>
  );
}

type ViewState = { tx: number; ty: number; scale: number };
type DragState =
  | {
      kind: "node";
      id: string;
      pointerId: number;
      startClientX: number;
      startClientY: number;
      nodeStartX: number;
      nodeStartY: number;
      moved: boolean;
    }
  | {
      kind: "pan";
      pointerId: number;
      lastClientX: number;
      lastClientY: number;
      moved: boolean;
    };

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
  const [positions, setPositions] = useState<Record<string, Vec>>({});
  // Engagement gates wheel-zoom + touch capture so the graph doesn't steal
  // page scroll. User clicks/taps the canvas to engage; clicking outside or
  // pressing Escape disengages.
  const [engaged, setEngaged] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef<Set<string>>(new Set());
  // Flips true once the user manually zooms, so container resize doesn't
  // snap them back to the auto-fit scale.
  const userZoomedRef = useRef(false);

  const baseLayout = useMemo(
    () => computeGraph<T>(root, friends as FriendNode<T>[], tags),
    [root, friends, tags],
  );

  // Apply user-dragged position overrides.
  const nodes = useMemo<GraphNode<T>[]>(() => {
    return baseLayout.nodes.map((n) => {
      const override = positions[n.id];
      return override ? { ...n, position: override } : n;
    });
  }, [baseLayout.nodes, positions]);

  const nodesById = useMemo(() => {
    const m = new Map<string, GraphNode<T>>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const rootAccent = "var(--brand, #0891b2)";

  // Wheel zoom centered on cursor. Only active when the graph is engaged —
  // otherwise wheel events pass through to the page so the user can scroll
  // past the section without getting stuck in the graph. React's onWheel is
  // passive, so attach manually with passive:false to cancel page scroll
  // once engagement is confirmed.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      if (!engaged) return;
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const aspectScale = Math.min(
        rect.width / baseLayout.viewBox.width,
        rect.height / baseLayout.viewBox.height,
      );
      const offsetX = (rect.width - baseLayout.viewBox.width * aspectScale) / 2;
      const offsetY =
        (rect.height - baseLayout.viewBox.height * aspectScale) / 2;
      const cursorX =
        (e.clientX - rect.left - offsetX) / aspectScale + baseLayout.viewBox.x;
      const cursorY =
        (e.clientY - rect.top - offsetY) / aspectScale + baseLayout.viewBox.y;

      userZoomedRef.current = true;
      setView((v) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const newScale = Math.max(MIN_SCALE, v.scale * factor);
        const k = newScale / v.scale;
        return {
          tx: cursorX - (cursorX - v.tx) * k,
          ty: cursorY - (cursorY - v.ty) * k,
          scale: newScale,
        };
      });
    };

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [
    engaged,
    baseLayout.viewBox.x,
    baseLayout.viewBox.y,
    baseLayout.viewBox.width,
    baseLayout.viewBox.height,
  ]);

  // Disengage when user clicks outside the graph or presses Escape, so the
  // page can scroll freely again.
  useEffect(() => {
    if (!engaged) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = containerRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setEngaged(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEngaged(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [engaged]);

  // Auto-fit the content into narrow containers so tiles don't become
  // unreadably small on phones. We aim for an on-screen tile roughly
  // TARGET_TILE_PX wide; the viewBox-fit path alone shrinks tiles to illegible
  // sizes on phones because the viewBox is sized for the full graph. We re-fit
  // on container resize but only while the user hasn't manually zoomed.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const TARGET_TILE_PX = 96;
    const TILE_VIEWBOX_WIDTH = 120;
    const fit = () => {
      if (userZoomedRef.current) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return;
      // Only boost on narrow viewports. On desktop, the natural viewBox fit
      // already renders tiles at full size.
      if (rect.width >= 640) {
        setView((v) => (v.scale === 1 ? v : { ...v, scale: 1 }));
        return;
      }
      const aspectScale = Math.min(
        rect.width / baseLayout.viewBox.width,
        (rect.height || 1) / baseLayout.viewBox.height,
      );
      if (!isFinite(aspectScale) || aspectScale <= 0) return;
      const target = TARGET_TILE_PX / (TILE_VIEWBOX_WIDTH * aspectScale);
      const clamped = Math.max(1, Math.min(4, target));
      setView((v) => (v.scale === clamped ? v : { ...v, scale: clamped }));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [baseLayout.viewBox.width, baseLayout.viewBox.height]);

  const screenDeltaToViewBox = (dxScreen: number, dyScreen: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const aspectScale = Math.min(
      rect.width / baseLayout.viewBox.width,
      rect.height / baseLayout.viewBox.height,
    );
    return {
      x: dxScreen / aspectScale / view.scale,
      y: dyScreen / aspectScale / view.scale,
    };
  };

  const onNodePointerDown = (
    e: React.PointerEvent<HTMLElement>,
    id: string,
  ) => {
    const node = nodesById.get(id);
    if (!node) return;
    // Stop bubbling so the SVG's pointerdown doesn't start a pan at the
    // same time the user starts dragging a node.
    e.stopPropagation();
    // Before engagement on touch: don't capture — let the browser interpret
    // the gesture as a vertical scroll (via touch-action: pan-y). The link
    // tap still works because pointerup fires normally.
    if (!engaged && e.pointerType === "touch") return;
    dragRef.current = {
      kind: "node",
      id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      nodeStartX: node.position.x,
      nodeStartY: node.position.y,
      moved: false,
    };
    // Capture on the SVG so subsequent move/up events land there even if
    // the pointer leaves the tile.
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    const target = e.target as Element;
    if (target.closest("[data-node-id]")) return; // handled by node handler
    if (target.closest("a, button, input")) return;
    // Touch users can still use a vertical-swipe gesture to scroll past the
    // section because touch-action: pan-y is on the SVG when not engaged;
    // we only start panning for mouse or once engaged.
    if (!engaged && e.pointerType === "touch") return;
    dragRef.current = {
      kind: "pan",
      pointerId: e.pointerId,
      lastClientX: e.clientX,
      lastClientY: e.clientY,
      moved: false,
    };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    if (drag.kind === "node") {
      const dxScreen = e.clientX - drag.startClientX;
      const dyScreen = e.clientY - drag.startClientY;
      if (!drag.moved && Math.hypot(dxScreen, dyScreen) > DRAG_THRESHOLD) {
        drag.moved = true;
      }
      if (!drag.moved) return;
      const { x: dx, y: dy } = screenDeltaToViewBox(dxScreen, dyScreen);
      setPositions((prev) => ({
        ...prev,
        [drag.id]: {
          x: drag.nodeStartX + dx,
          y: drag.nodeStartY + dy,
        },
      }));
    } else {
      const dxScreen = e.clientX - drag.lastClientX;
      const dyScreen = e.clientY - drag.lastClientY;
      drag.lastClientX = e.clientX;
      drag.lastClientY = e.clientY;
      if (
        !drag.moved &&
        Math.abs(dxScreen) + Math.abs(dyScreen) > DRAG_THRESHOLD
      ) {
        drag.moved = true;
      }
      const { x: dx, y: dy } = screenDeltaToViewBox(dxScreen, dyScreen);
      setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }));
    }
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.kind === "node" && drag.moved) {
      suppressClickRef.current.add(drag.id);
    }
    dragRef.current = null;
    setPanning(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const consumeClickSuppression = (id: string): boolean => {
    if (suppressClickRef.current.has(id)) {
      suppressClickRef.current.delete(id);
      return true;
    }
    return false;
  };

  // Tag blobs — for each tag shared by 2+ friends, compute the convex hull
  // of their live positions and render a soft colored region behind the
  // graph. Multi-tag friends sit in overlapping blobs by construction.
  const BLOB_OPACITY = 0.16;
  const tagBlobs = (() => {
    // Track both the node centers (for hull shape) and the tile top edges
    // (for label placement so it never sits on top of a card).
    const byTag = new Map<
      string,
      { centers: { x: number; y: number }[]; tileTopY: number }
    >();
    for (const n of nodes) {
      if (n.kind !== "friend") continue;
      const c = nodeCenter(n);
      const top = n.position.y;
      for (const t of n.friend.tags as string[]) {
        const bucket = byTag.get(t);
        if (bucket) {
          bucket.centers.push(c);
          bucket.tileTopY = Math.min(bucket.tileTopY, top);
        } else {
          byTag.set(t, { centers: [c], tileTopY: top });
        }
      }
    }
    return [...byTag.entries()]
      .filter(([, b]) => b.centers.length >= 2)
      .map(([tag, b]) => {
        const raw =
          (tags?.[tag as T]?.color as string | undefined) ?? "#8b94a5";
        // Strip trailing alpha from 8-digit hex so SVG attrs stay well-formed.
        const color = /^#[0-9a-f]{8}$/i.test(raw) ? raw.slice(0, 7) : raw;
        return { tag, color, points: b.centers, tileTopY: b.tileTopY };
      });
  })();

  // Compute live edge endpoints from the current node positions.
  const renderedEdges = baseLayout.edges.map((edge, i) => {
    const a = nodesById.get(edge.a);
    const b = nodesById.get(edge.b);
    if (!a || !b) return null;
    const aCenter = nodeCenter(a);
    const bCenter = nodeCenter(b);
    const from = nodeEdgeTowards(a, bCenter);
    const to = nodeEdgeTowards(b, aCenter);
    const involvesRoot = a.kind === "root" || b.kind === "root";
    return {
      key: i,
      from,
      to,
      involvesRoot,
      color: edge.color,
      sharedTags: edge.sharedTags,
    };
  });

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={() => {
        if (!engaged) setEngaged(true);
      }}
      style={{
        width: "100%",
        position: "relative",
        // When not engaged, allow vertical page scroll to pass through touch
        // gestures on the graph. Once engaged, the graph claims the gesture.
        touchAction: engaged ? "none" : "pan-y",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`${baseLayout.viewBox.x} ${baseLayout.viewBox.y} ${baseLayout.viewBox.width} ${baseLayout.viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Friend network graph with ${friends.length} connections.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          width: "100%",
          height,
          display: "block",
          overflow: "hidden",
          cursor: panning ? "grabbing" : engaged ? "grab" : "pointer",
          userSelect: "none",
          touchAction: engaged ? "none" : "pan-y",
        }}
      >
        <rect
          x={baseLayout.viewBox.x}
          y={baseLayout.viewBox.y}
          width={baseLayout.viewBox.width}
          height={baseLayout.viewBox.height}
          fill="transparent"
        />

        <defs>
          {/* Gaussian blur used for the tag blobs — gives the hull edges
              a soft watercolor bleed instead of a sharp polygon outline,
              matching the guóhuà ink-wash aesthetic used site-wide. */}
          <filter
            id="ink-wash-blob"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          {/* Tag blob shapes — rendered inside a blur filter so the hull
              edges bleed like ink on rice paper. */}
          <g filter="url(#ink-wash-blob)">
            {tagBlobs.map((blob) => {
              if (blob.points.length === 2) {
                const [p1, p2] = blob.points;
                return (
                  <path
                    key={`blob-shape-${blob.tag}`}
                    d={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    fill="none"
                    stroke={blob.color}
                    strokeOpacity={BLOB_OPACITY}
                    strokeLinecap="round"
                  />
                );
              }
              const hull = convexHull(blob.points);
              if (hull.length < 3) return null;
              const d =
                hull
                  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                  .join(" ") + " Z";
              return (
                <path
                  key={`blob-shape-${blob.tag}`}
                  d={d}
                  fill={blob.color}
                  fillOpacity={BLOB_OPACITY}
                  stroke={blob.color}
                  strokeOpacity={BLOB_OPACITY}
                  strokeLinejoin="round"
                />
              );
            })}
          </g>

          {/* Water ripples pulsing outward from the root — three concentric
              rings on staggered loops evoke a dropped stone on still water. */}
          {!reduceMotion &&
            (() => {
              const rootN = nodes.find(
                (n): n is RootGraphNode => n.kind === "root",
              );
              if (!rootN) return null;
              const cx = rootN.position.x + rootN.width / 2;
              const cy = rootN.position.y + rootN.height / 2;
              const baseR = Math.max(rootN.width, rootN.height) / 2 + 14;
              return (
                <g style={{ pointerEvents: "none" }}>
                  {[0, 1.3, 2.6].map((delay) => (
                    <motion.circle
                      key={`ripple-${delay}`}
                      cx={cx}
                      cy={cy}
                      fill="none"
                      stroke={rootAccent}
                      strokeWidth={1.5}
                      initial={{ r: baseR, opacity: 0 }}
                      animate={{
                        r: [baseR, baseR + 140],
                        opacity: [0, 0.35, 0],
                      }}
                      transition={{
                        duration: 3.9,
                        delay,
                        repeat: Infinity,
                        ease: [0.22, 0.61, 0.36, 1],
                        times: [0, 0.2, 1],
                      }}
                    />
                  ))}
                </g>
              );
            })()}

          {/* Tag labels — rendered outside the blur filter so they stay
              crisp against the softened hull. */}
          {tagBlobs.map((blob) => {
            const label =
              (tags?.[blob.tag as T]?.label as string | undefined) ?? blob.tag;
            const xs = blob.points.map((p) => p.x);
            const labelX = xs.reduce((s, v) => s + v, 0) / xs.length;
            const labelY = blob.tileTopY - 12;
            return (
              <text
                key={`blob-label-${blob.tag}`}
                x={labelX}
                y={labelY}
                fontSize={13}
                fontFamily="var(--font-mono, ui-monospace), monospace"
                fill={blob.color}
                fillOpacity={0.9}
                textAnchor="middle"
                style={{
                  letterSpacing: "1.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                {label}
              </text>
            );
          })}

          {/* MST edges — drawn first so tiles sit above them. Root edges
              render as a dotted line whose dots flow toward the root, so
              the hub connection reads as "active"; friend↔friend edges
              are solid in their shared-tag color. */}
          {renderedEdges.map((e) => {
            if (!e) return null;
            if (e.involvesRoot) {
              const pattern = "2 10";
              const cycle = 12; // sum of dasharray for one loop
              return (
                <motion.line
                  key={`edge-${e.key}`}
                  x1={e.from.x}
                  y1={e.from.y}
                  x2={e.to.x}
                  y2={e.to.y}
                  stroke={rootAccent}
                  strokeOpacity={0.85}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={pattern}
                  initial={{ strokeDashoffset: 0 }}
                  animate={
                    reduceMotion
                      ? { strokeDashoffset: 0 }
                      : { strokeDashoffset: -cycle }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 1.2, repeat: Infinity, ease: "linear" }
                  }
                />
              );
            }
            return (
              <line
                key={`edge-${e.key}`}
                x1={e.from.x}
                y1={e.from.y}
                x2={e.to.x}
                y2={e.to.y}
                stroke={e.color ?? rootAccent}
                strokeOpacity={0.8}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          })}

          {/* Nodes. Reveal animation is one-shot on first mount; it does
              not replay when the user drags a node afterward. */}
          <motion.g
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
            }
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{
              duration: reduceMotion ? 0.3 : 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {nodes.map((n) =>
              n.kind === "root" ? (
                <RootTile
                  key={n.id}
                  node={n}
                  accent={rootAccent}
                  engaged={engaged}
                  onNodePointerDown={onNodePointerDown}
                  onSuppressClick={consumeClickSuppression}
                />
              ) : (
                <FriendTile
                  key={n.id}
                  node={n}
                  hovered={hoveredId === n.friend.id}
                  engaged={engaged}
                  onHover={setHoveredId}
                  onNodePointerDown={onNodePointerDown}
                  onSuppressClick={consumeClickSuppression}
                />
              ),
            )}
          </motion.g>
        </g>
      </svg>
      {!engaged ? (
        <div
          aria-hidden
          className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-[var(--glass-border,rgba(255,255,255,0.55))] bg-[var(--glass-bg,rgba(248,247,244,0.72))] px-3 py-1.5 font-mono text-[10px] tracking-[1.5px] text-[var(--ink-muted,rgba(26,26,46,0.64))] uppercase backdrop-blur-md"
        >
          Click to interact
        </div>
      ) : null}
    </div>
  );
}
