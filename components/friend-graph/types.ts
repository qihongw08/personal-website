export type FriendNode<T extends string = string> = {
  id: string;
  name: string;
  headline?: string;
  photo?: string;
  link?: string;
  tags: T[];
};

export type RootNode = {
  name: string;
  headline?: string;
  link?: string;
  photo?: string;
};

export type TagDefinition = {
  label?: string;
  color?: string;
};

export type FriendGraphProps<T extends string = string> = {
  root: RootNode;
  friends: FriendNode<T>[];
  tags?: Partial<Record<T, TagDefinition>>;
  height?: number;
  className?: string;
};

export type Vec = { x: number; y: number };

export type RootGraphNode = {
  id: string;
  kind: "root";
  root: RootNode;
  position: Vec;
  width: number;
  height: number;
};

export type FriendGraphNode<T extends string = string> = {
  id: string;
  kind: "friend";
  friend: FriendNode<T>;
  position: Vec;
  width: number;
  height: number;
  color: string;
};

export type GraphNode<T extends string = string> =
  | RootGraphNode
  | FriendGraphNode<T>;

export type GraphEdge = {
  a: string;
  b: string;
  sharedTags: string[];
  /** Stroke color for the edge. Absent for root-fallback edges, which
      let the renderer choose (typically the brand accent). */
  color?: string;
};

export type GraphLayout<T extends string = string> = {
  viewBox: { x: number; y: number; width: number; height: number };
  nodes: GraphNode<T>[];
  edges: GraphEdge[];
};
