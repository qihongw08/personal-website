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

export type PlacedNode<T extends string = string> = {
  friend: FriendNode<T>;
  position: Vec;
  width: number;
  height: number;
};

export type PlacedCluster<T extends string = string> = {
  id: string;
  signature: string;
  tags: T[];
  label: string;
  color: string;
  nodes: PlacedNode<T>[];
  box: { x: number; y: number; width: number; height: number };
  center: Vec;
};

export type RootEdge = {
  kind: "root";
  clusterId: string;
  from: Vec;
  to: Vec;
};

export type BridgeEdge = {
  kind: "bridge";
  fromClusterId: string;
  toClusterId: string;
  sharedTags: string[];
  from: Vec;
  to: Vec;
};

export type GraphEdge = RootEdge | BridgeEdge;

export type Layout<T extends string = string> = {
  viewBox: { width: number; height: number };
  root: { position: Vec; width: number; height: number };
  clusters: PlacedCluster<T>[];
  edges: GraphEdge[];
};
