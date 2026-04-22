import type {
  FriendNode,
  GraphEdge,
  Layout,
  PlacedCluster,
  PlacedNode,
  TagDefinition,
  Vec,
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

const VIEWBOX = { width: 1600, height: 900 };
const ROOT_SIZE = { width: 160, height: 180 };
const TILE_SIZE = { width: 120, height: 140 };
const TILE_GAP = 16;
const CLUSTER_PADDING = 22;
const CLUSTER_LABEL_SPACE = 28;

function signatureOf<T extends string>(tags: T[]): string {
  return [...tags].sort().join("|");
}

function groupBySignature<T extends string>(
  friends: FriendNode<T>[],
): Map<string, FriendNode<T>[]> {
  const sorted = [...friends].sort((a, b) => a.id.localeCompare(b.id));
  const map = new Map<string, FriendNode<T>[]>();
  for (const f of sorted) {
    const key = signatureOf(f.tags);
    const bucket = map.get(key);
    if (bucket) bucket.push(f);
    else map.set(key, [f]);
  }
  return map;
}

function labelFor<T extends string>(
  tags: T[],
  registry: Partial<Record<T, TagDefinition>> | undefined,
): string {
  if (tags.length === 0) return "UNTAGGED";
  return tags
    .map((t) => (registry?.[t]?.label ?? t).toString().toUpperCase())
    .join(" · ");
}

function colorFor<T extends string>(
  tags: T[],
  registry: Partial<Record<T, TagDefinition>> | undefined,
  fallbackIndex: number,
): string {
  for (const t of tags) {
    const c = registry?.[t]?.color;
    if (c) return c;
  }
  return DEFAULT_PALETTE[fallbackIndex % DEFAULT_PALETTE.length];
}

// Tile-interior content-width constants used by the text-wrap estimator.
// Layout numbers here mirror the tile styling in FriendGraph.tsx — bumping
// padding there needs bumping here.
const TILE_PADDING = 12;
const AVATAR_SIZE = 52;
const TILE_INNER_GAP = 8;
// Average rendered char widths at the tile's fontSize — slightly generous so
// edge-case long words over-estimate rather than under-estimate.
const NAME_CHAR_WIDTH = 7.5; // Space Grotesk 12/600
const HEADLINE_CHAR_WIDTH = 8; // Geist Mono 9/600 uppercase + tracking
const NAME_LINE_HEIGHT = 15; // 12 * 1.25
const HEADLINE_LINE_HEIGHT = 12; // 9 * 1.3

function estimateTileHeight<T extends string>(friend: FriendNode<T>): number {
  const contentWidth = TILE_SIZE.width - TILE_PADDING * 2;
  const nameLines = Math.max(
    1,
    Math.ceil((friend.name.length * NAME_CHAR_WIDTH) / contentWidth),
  );
  const headlineLines = friend.headline
    ? Math.max(
        1,
        Math.ceil(
          (friend.headline.length * HEADLINE_CHAR_WIDTH) / contentWidth,
        ),
      )
    : 0;

  const base = TILE_PADDING * 2 + AVATAR_SIZE + TILE_INNER_GAP; // top/bot pad + avatar + gap to name
  const nameBlock = nameLines * NAME_LINE_HEIGHT;
  const headlineBlock = headlineLines
    ? TILE_INNER_GAP + headlineLines * HEADLINE_LINE_HEIGHT
    : 0;

  // Never shrink below the default TILE_SIZE so single-line tiles keep their
  // familiar shape.
  return Math.max(TILE_SIZE.height, Math.ceil(base + nameBlock + headlineBlock));
}

function layoutClusterMembers<T extends string>(
  members: FriendNode<T>[],
  center: Vec,
): PlacedNode<T>[] {
  const n = members.length;
  const cols = Math.min(n, n <= 3 ? n : n <= 6 ? 3 : 4);
  const rows = Math.ceil(n / cols);

  const tileHeights = members.map(estimateTileHeight);
  const rowHeights: number[] = [];
  for (let r = 0; r < rows; r++) {
    const slice = tileHeights.slice(r * cols, (r + 1) * cols);
    rowHeights.push(slice.length > 0 ? Math.max(...slice) : TILE_SIZE.height);
  }

  const totalWidth = cols * TILE_SIZE.width + (cols - 1) * TILE_GAP;
  const totalHeight =
    rowHeights.reduce((sum, h) => sum + h, 0) + (rows - 1) * TILE_GAP;

  const originX = center.x - totalWidth / 2;
  const originY = center.y - totalHeight / 2;

  return members.map((friend, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const yOffset =
      rowHeights.slice(0, row).reduce((sum, h) => sum + h, 0) + row * TILE_GAP;
    return {
      friend,
      width: TILE_SIZE.width,
      height: tileHeights[i],
      position: {
        x: originX + col * (TILE_SIZE.width + TILE_GAP),
        y: originY + yOffset,
      },
    };
  });
}

// Label is rendered at 11px Geist Mono with 1.5px letter-spacing. Monospace
// chars run ~6.6px wide at this size, plus the tracking → ~8.1px per char.
// Add a small fudge so emoji / punctuation don't clip.
const LABEL_CHAR_WIDTH = 8.1;
const LABEL_PADDING_X = 14;

function estimateLabelWidth(label: string): number {
  return label.length * LABEL_CHAR_WIDTH + LABEL_PADDING_X * 2;
}

function boxFromNodes<T extends string>(
  nodes: PlacedNode<T>[],
  minWidth: number,
): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + n.width);
    maxY = Math.max(maxY, n.position.y + n.height);
  }
  const contentWidth = maxX - minX + CLUSTER_PADDING * 2;
  const width = Math.max(contentWidth, minWidth);
  const centerX = (minX + maxX) / 2;
  return {
    x: centerX - width / 2,
    y: minY - CLUSTER_PADDING - CLUSTER_LABEL_SPACE,
    width,
    height: maxY - minY + CLUSTER_PADDING * 2 + CLUSTER_LABEL_SPACE,
  };
}

function clusterCircleCenter(
  index: number,
  total: number,
  rootCenter: Vec,
  Rx: number,
  Ry: number,
): Vec {
  // Start at π (left of root) and distribute clockwise. For small N, this
  // spreads clusters around the root horizontally first.
  const theta = Math.PI + (index / Math.max(total, 1)) * Math.PI * 2;
  return {
    x: rootCenter.x + Rx * Math.cos(theta),
    y: rootCenter.y + Ry * Math.sin(theta),
  };
}

function edgePointTowards(
  box: { x: number; y: number; width: number; height: number },
  target: Vec,
): Vec {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const hx = box.width / 2;
  const hy = box.height / 2;
  // Scale so the vector (dx, dy) lands on the box boundary.
  const scale = 1 / Math.max(Math.abs(dx) / hx, Math.abs(dy) / hy);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

export function computeLayout<T extends string>(
  friends: FriendNode<T>[],
  tags: Partial<Record<T, TagDefinition>> | undefined,
): Layout<T> {
  const rootCenter: Vec = { x: VIEWBOX.width / 2, y: VIEWBOX.height / 2 };
  const rootBox = {
    x: rootCenter.x - ROOT_SIZE.width / 2,
    y: rootCenter.y - ROOT_SIZE.height / 2,
    width: ROOT_SIZE.width,
    height: ROOT_SIZE.height,
  };

  const groups = groupBySignature(friends);
  const entries = [...groups.entries()];

  // Arrange clusters on an ellipse around root — wider than tall so we use
  // horizontal real estate.
  const Rx = entries.length <= 3 ? 360 : 460;
  const Ry = entries.length <= 3 ? 200 : 280;

  const clusters: PlacedCluster<T>[] = entries.map(
    ([signature, members], i) => {
      const center = clusterCircleCenter(i, entries.length, rootCenter, Rx, Ry);
      const placedNodes = layoutClusterMembers(members, center);
      const memberTags = members[0]?.tags ?? ([] as T[]);
      const label = labelFor(memberTags, tags);
      const box = boxFromNodes(placedNodes, estimateLabelWidth(label));
      return {
        id: `cluster-${i}`,
        signature,
        tags: memberTags,
        label,
        color: colorFor(memberTags, tags, i),
        nodes: placedNodes,
        box,
        center,
      };
    },
  );

  const edges: GraphEdge[] = [];

  // Root edges — cluster box edge → root box edge.
  for (const c of clusters) {
    const from = edgePointTowards(c.box, rootCenter);
    const to = edgePointTowards(rootBox, c.center);
    edges.push({ kind: "root", clusterId: c.id, from, to });
  }

  // Bridge edges — for each pair of clusters sharing any tag.
  for (let i = 0; i < clusters.length; i++) {
    for (let j = i + 1; j < clusters.length; j++) {
      const a = clusters[i];
      const b = clusters[j];
      const shared = a.tags.filter((t) =>
        (b.tags as string[]).includes(t as string),
      );
      if (shared.length === 0) continue;
      const from = edgePointTowards(a.box, b.center);
      const to = edgePointTowards(b.box, a.center);
      edges.push({
        kind: "bridge",
        fromClusterId: a.id,
        toClusterId: b.id,
        sharedTags: shared as string[],
        from,
        to,
      });
    }
  }

  return {
    viewBox: VIEWBOX,
    root: { position: { x: rootBox.x, y: rootBox.y }, ...ROOT_SIZE },
    clusters,
    edges,
  };
}
