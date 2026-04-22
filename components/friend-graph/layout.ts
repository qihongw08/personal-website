import type {
  FriendNode,
  GraphEdge,
  GraphLayout,
  GraphNode,
  RootNode,
  TagDefinition,
} from "./types";

const DEFAULT_PALETTE = [
  "#0891b2",
  "#7c3aed",
  "#d97706",
  "#16a34a",
  "#db2777",
  "#dc2626",
  "#0ea5e9",
  "#a855f7",
];

const ROOT_SIZE = { width: 160, height: 180 };
const TILE_SIZE = { width: 120, height: 140 };
const VIEWBOX_PADDING = 80;
const NODE_GAP = 48;

// Tile text-height estimator — mirrors FriendGraph.tsx tile styling.
const TILE_PADDING = 12;
const AVATAR_SIZE = 52;
const TILE_INNER_GAP = 8;
const NAME_CHAR_WIDTH = 7.5;
const HEADLINE_CHAR_WIDTH = 8;
const NAME_LINE_HEIGHT = 15;
const HEADLINE_LINE_HEIGHT = 12;

function normalizeColor(color: string): string {
  // Strip trailing alpha from #RRGGBBAA so callers can safely append alpha.
  if (/^#[0-9a-f]{8}$/i.test(color)) return color.slice(0, 7);
  return color;
}

function colorFor<T extends string>(
  tags: T[],
  registry: Partial<Record<T, TagDefinition>> | undefined,
  fallbackIndex: number,
): string {
  for (const t of tags) {
    const c = registry?.[t]?.color;
    if (c) return normalizeColor(c);
  }
  return DEFAULT_PALETTE[fallbackIndex % DEFAULT_PALETTE.length];
}

/**
 * Split a LinkedIn-style headline on `|` separators so each segment can
 * render on its own line. Whitespace around the pipes is eaten:
 *   "Incoming @ Google | CS & Finance @ NEU"
 *   → ["Incoming @ Google", "CS & Finance @ NEU"]
 */
export function splitHeadline(headline: string): string[] {
  return headline
    .split(/\s*\|\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function estimateFriendHeight<T extends string>(friend: FriendNode<T>): number {
  const contentWidth = TILE_SIZE.width - TILE_PADDING * 2;
  const nameLines = Math.max(
    1,
    Math.ceil((friend.name.length * NAME_CHAR_WIDTH) / contentWidth),
  );
  const segments = friend.headline ? splitHeadline(friend.headline) : [];
  let headlineLines = 0;
  for (const seg of segments) {
    headlineLines += Math.max(
      1,
      Math.ceil((seg.length * HEADLINE_CHAR_WIDTH) / contentWidth),
    );
  }
  const base = TILE_PADDING * 2 + AVATAR_SIZE + TILE_INNER_GAP;
  const nameBlock = nameLines * NAME_LINE_HEIGHT;
  const headlineBlock =
    segments.length > 0
      ? TILE_INNER_GAP + headlineLines * HEADLINE_LINE_HEIGHT
      : 0;
  return Math.max(
    TILE_SIZE.height,
    Math.ceil(base + nameBlock + headlineBlock),
  );
}

type Candidate = {
  a: string;
  b: string;
  weight: number;
  sharedTags: string[];
};

/**
 * Kruskal's algorithm — returns the minimum spanning tree over the given
 * node set using the supplied candidate edges. Uses union-find with path
 * compression.
 */
function kruskalMst(nodeIds: string[], candidates: Candidate[]): GraphEdge[] {
  const parent = new Map<string, string>();
  for (const id of nodeIds) parent.set(id, id);
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };

  const sorted = [...candidates].sort((a, b) => a.weight - b.weight);
  const mst: GraphEdge[] = [];
  for (const e of sorted) {
    const ra = find(e.a);
    const rb = find(e.b);
    if (ra === rb) continue;
    parent.set(ra, rb);
    mst.push({ a: e.a, b: e.b, sharedTags: e.sharedTags });
    if (mst.length === nodeIds.length - 1) break;
  }
  return mst;
}

type Spring = { a: string; b: string; weight: number };

/**
 * Fruchterman–Reingold force layout.
 *
 *   - Every pair of nodes repels (quadratic).
 *   - Every spring edge attracts (inverse quadratic), scaled by weight so
 *     strongly-connected pairs pull closer.
 *   - Temperature cools linearly so motion settles over time.
 *   - Root is pinned at the origin (it's the conceptual "me" hub).
 *
 * Deterministic: same input → same output, so SSR hydration is safe.
 */
function forceLayout(
  nodeIds: string[],
  springs: Spring[],
  seedCenters: Map<string, { x: number; y: number }>,
  opts: {
    iterations: number;
    idealDistance: number;
    rootId: string;
    canvasExtent: number;
    /** Per-iteration pull toward origin, applied to non-root nodes. */
    gravity: number;
    /** If provided, gravity is only applied to these node ids (typically
        the root's direct MST neighbors). Indirectly-connected friends
        still drift inward via their springs to those neighbors, but
        hold their relative position to them instead of being pulled
        uniformly toward the center. */
    gravityTargets?: Set<string>;
  },
): Map<string, { x: number; y: number }> {
  const {
    iterations,
    idealDistance: k,
    rootId,
    canvasExtent,
    gravity,
    gravityTargets,
  } = opts;
  const positions = new Map<string, { x: number; y: number }>();
  for (const id of nodeIds) {
    const seed = seedCenters.get(id) ?? { x: 0, y: 0 };
    positions.set(id, { x: seed.x, y: seed.y });
  }

  for (let iter = 0; iter < iterations; iter++) {
    // Linear cooling: early iterations move a lot, later ones micro-adjust.
    const t = (1 - iter / iterations) * (canvasExtent / 10);
    const disp = new Map<string, { x: number; y: number }>();
    for (const id of nodeIds) disp.set(id, { x: 0, y: 0 });

    // Repulsion (every pair).
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const ia = nodeIds[i];
        const ib = nodeIds[j];
        const pa = positions.get(ia)!;
        const pb = positions.get(ib)!;
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let d = Math.hypot(dx, dy);
        if (d < 0.01) {
          // Deterministic jitter based on id order to break overlaps.
          dx = i - j + 0.01;
          dy = j - i + 0.01;
          d = Math.hypot(dx, dy);
        }
        const force = (k * k) / d;
        const da = disp.get(ia)!;
        const db = disp.get(ib)!;
        da.x += (dx / d) * force;
        da.y += (dy / d) * force;
        db.x -= (dx / d) * force;
        db.y -= (dy / d) * force;
      }
    }

    // Attraction (springs).
    for (const s of springs) {
      const pa = positions.get(s.a)!;
      const pb = positions.get(s.b)!;
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.01) continue;
      const force = ((d * d) / k) * s.weight;
      const da = disp.get(s.a)!;
      const db = disp.get(s.b)!;
      da.x -= (dx / d) * force;
      da.y -= (dy / d) * force;
      db.x += (dx / d) * force;
      db.y += (dy / d) * force;
    }

    // Gravity — gentle pull toward the origin. When `gravityTargets` is
    // supplied, only those nodes feel the pull (typically the root's
    // direct MST neighbors); indirectly-connected friends follow them
    // through the springs and keep their relative positioning.
    if (gravity > 0) {
      for (const id of nodeIds) {
        if (id === rootId) continue;
        if (gravityTargets && !gravityTargets.has(id)) continue;
        const p = positions.get(id)!;
        const d = disp.get(id)!;
        d.x -= p.x * gravity;
        d.y -= p.y * gravity;
      }
    }

    // Apply displacements, limited by temperature; pin root at origin.
    for (const id of nodeIds) {
      if (id === rootId) {
        positions.set(id, { x: 0, y: 0 });
        continue;
      }
      const d = disp.get(id)!;
      const mag = Math.hypot(d.x, d.y);
      if (mag < 1e-6) continue;
      const limit = Math.min(mag, t);
      const p = positions.get(id)!;
      p.x += (d.x / mag) * limit;
      p.y += (d.y / mag) * limit;
    }
  }

  return positions;
}

/**
 * Build a flat friend graph:
 *
 *   - Nodes: root + one friend each.
 *   - Topology: every pair of friends sharing a tag contributes a weighted
 *     spring (stronger springs for more shared tags). Root is tied softly
 *     to everyone so it never drifts off. Kruskal's MST over the same
 *     weighted candidates selects which edges to actually render.
 *   - Positions: a force-directed simulation layered on the springs —
 *     connected friends cluster, and friends bridging multiple tag groups
 *     naturally fall between those groups in space.
 */
export function computeGraph<T extends string>(
  root: RootNode,
  friends: FriendNode<T>[],
  tags: Partial<Record<T, TagDefinition>> | undefined,
): GraphLayout<T> {
  const ROOT_ID = "__root__";
  const sortedFriends = [...friends].sort((a, b) => a.id.localeCompare(b.id));
  const N = sortedFriends.length;

  const heights = sortedFriends.map(estimateFriendHeight);
  const maxNodeExtent = Math.max(TILE_SIZE.width, ...heights);
  // Ideal spring length scales with tile size so tiles don't overlap when
  // the sim converges.
  const idealDistance = maxNodeExtent + NODE_GAP;
  const canvasExtent = Math.max(1, idealDistance * Math.sqrt(N + 1) * 1.5);

  // --- Candidate edges: shared-tag pairs + root-to-everyone fallback -----
  const candidates: Candidate[] = [];
  for (let i = 0; i < sortedFriends.length; i++) {
    for (let j = i + 1; j < sortedFriends.length; j++) {
      const a = sortedFriends[i];
      const b = sortedFriends[j];
      const shared = (a.tags as string[]).filter((t) =>
        (b.tags as string[]).includes(t),
      );
      if (shared.length === 0) continue;
      candidates.push({
        a: a.id,
        b: b.id,
        sharedTags: shared,
        weight: 1 / shared.length,
      });
    }
  }
  for (const f of sortedFriends) {
    candidates.push({ a: ROOT_ID, b: f.id, sharedTags: [], weight: 10 });
  }

  const nodeIds = [ROOT_ID, ...sortedFriends.map((f) => f.id)];
  // Tint each friend↔friend edge with the color of the first shared tag
  // so the line encodes WHY the two friends are connected.
  const edges: GraphEdge[] = kruskalMst(nodeIds, candidates).map((e, i) => {
    if (e.sharedTags.length === 0) return e;
    return {
      ...e,
      color: colorFor(e.sharedTags as T[], tags, i),
    };
  });

  // --- Force-directed positioning --------------------------------------
  // Springs pull tightly-connected friends together. Root is pulled weakly
  // toward every friend so the whole graph stays centered on it.
  const springs: Spring[] = [];
  for (let i = 0; i < sortedFriends.length; i++) {
    for (let j = i + 1; j < sortedFriends.length; j++) {
      const a = sortedFriends[i];
      const b = sortedFriends[j];
      const shared = (a.tags as string[]).filter((t) =>
        (b.tags as string[]).includes(t),
      );
      if (shared.length === 0) continue;
      springs.push({ a: a.id, b: b.id, weight: shared.length });
    }
  }
  for (const f of sortedFriends) {
    springs.push({ a: ROOT_ID, b: f.id, weight: 0.12 });
  }

  // Deterministic seed positions: friends on a circle, root at origin.
  const seedCenters = new Map<string, { x: number; y: number }>();
  seedCenters.set(ROOT_ID, { x: 0, y: 0 });
  sortedFriends.forEach((f, i) => {
    const theta = N === 0 ? 0 : (i / N) * Math.PI * 2 - Math.PI / 2;
    seedCenters.set(f.id, {
      x: idealDistance * 1.5 * Math.cos(theta),
      y: idealDistance * 1.5 * Math.sin(theta),
    });
  });

  // Only root-adjacent MST neighbors feel gravity. Everyone else is
  // carried inward by the springs to their neighbors, preserving the
  // relative tree structure past the first level.
  const rootAdjacent = new Set<string>();
  for (const e of edges) {
    if (e.a === ROOT_ID) rootAdjacent.add(e.b);
    else if (e.b === ROOT_ID) rootAdjacent.add(e.a);
  }

  const centers = forceLayout(nodeIds, springs, seedCenters, {
    iterations: 320,
    idealDistance,
    rootId: ROOT_ID,
    canvasExtent,
    gravity: 6.7,
    gravityTargets: rootAdjacent,
  });

  // --- Materialize nodes from simulated centers ------------------------
  const rootCenter = centers.get(ROOT_ID)!;
  const rootNode: GraphNode<T> = {
    id: ROOT_ID,
    kind: "root",
    root,
    position: {
      x: rootCenter.x - ROOT_SIZE.width / 2,
      y: rootCenter.y - ROOT_SIZE.height / 2,
    },
    width: ROOT_SIZE.width,
    height: ROOT_SIZE.height,
  };

  const friendNodes: GraphNode<T>[] = sortedFriends.map((friend, i) => {
    const height = heights[i];
    const c = centers.get(friend.id)!;
    return {
      id: friend.id,
      kind: "friend",
      friend,
      position: {
        x: c.x - TILE_SIZE.width / 2,
        y: c.y - height / 2,
      },
      width: TILE_SIZE.width,
      height,
      color: colorFor(friend.tags, tags, i),
    };
  });

  const nodes: GraphNode<T>[] = [rootNode, ...friendNodes];

  // --- ViewBox from the simulated footprint ----------------------------
  let minX = rootNode.position.x;
  let minY = rootNode.position.y;
  let maxX = rootNode.position.x + rootNode.width;
  let maxY = rootNode.position.y + rootNode.height;
  for (const n of friendNodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + n.width);
    maxY = Math.max(maxY, n.position.y + n.height);
  }

  const viewBox = {
    x: minX - VIEWBOX_PADDING,
    y: minY - VIEWBOX_PADDING,
    width: maxX - minX + VIEWBOX_PADDING * 2,
    height: maxY - minY + VIEWBOX_PADDING * 2,
  };

  return { viewBox, nodes, edges };
}

/**
 * Andrew's monotone-chain convex hull. Returns the hull in counter-
 * clockwise order. Caller handles degenerate cases (<3 points).
 */
export function convexHull(points: { x: number; y: number }[]): {
  x: number;
  y: number;
}[] {
  if (points.length < 3) return [...points];
  const sorted = [...points].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
  );
  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

export function nodeCenter<T extends string>(
  node: GraphNode<T>,
): { x: number; y: number } {
  return {
    x: node.position.x + node.width / 2,
    y: node.position.y + node.height / 2,
  };
}

/**
 * Project a line from a node center toward `target` onto the node's axis-
 * aligned rect boundary so edges visually tuck under the tile edge.
 */
export function nodeEdgeTowards<T extends string>(
  node: GraphNode<T>,
  target: { x: number; y: number },
): { x: number; y: number } {
  const cx = node.position.x + node.width / 2;
  const cy = node.position.y + node.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hx = node.width / 2;
  const hy = node.height / 2;
  const scale = 1 / Math.max(Math.abs(dx) / hx, Math.abs(dy) / hy);
  return { x: cx + dx * scale, y: cy + dy * scale };
}
