export type ProjectSource =
  | { kind: "single"; owner: string; repo: string }
  | {
      kind: "aggregate";
      repos: Array<{ owner: string; repo: string }>;
      linkUrl: string;
    };

export type ProjectStatus = "Deployed" | "Active" | "Archived";

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  Deployed: "#16a34a", // green
  Active: "#ca8a04", // amber/yellow
  Archived: "#6b7280", // grey
};

const STATUS_ORDER: Record<ProjectStatus, number> = {
  Deployed: 0,
  Active: 1,
  Archived: 2,
};

export function sortByStatus<T extends { status: ProjectStatus }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
}

export type Project = {
  name: string;
  status: ProjectStatus;
  description: string;
  tags: string[];
  source: ProjectSource;
  /**
   * Live deployment URL — surfaces a "Visit live" button on the card.
   * Recommended for `Deployed` projects.
   */
  liveUrl?: string;
  /**
   * Date range for the activity sparkline.
   * Accepts "YYYY/MM-YYYY/MM" or "YYYY/MM/DD-YYYY/MM/DD".
   * When omitted, the sparkline spans the oldest → newest commit we fetched.
   */
  activityRange?: string;
};

export const projects: Project[] = [
  {
    name: "EyeCraft",
    status: "Archived",
    description:
      "Hands-free Minecraft for players with mobility impairments. A Python CV pipeline reads facial expressions and head movement, streaming them to a Java mod in real time.",
    tags: ["Java", "Python", "OpenCV", "ML"],
    source: { kind: "single", owner: "qihongw08", repo: "eyecraft-mod" },
    activityRange: "2025/09/13-2025/09/15",
  },
  {
    name: "Shuttleverse",
    status: "Archived",
    description:
      "A crowdsourced directory of badminton courts and coaches. Microservices architecture with API Gateway, Service Discovery, Websockets, and centralized authentication.",
    tags: ["Spring Boot", "Redis", "K8s", "Microservices"],
    source: {
      kind: "aggregate",
      linkUrl: "https://github.com/shuttleverse",
      repos: [
        { owner: "shuttleverse", repo: "shuttleverse-ui" },
        { owner: "shuttleverse", repo: "shuttleverse-gateway" },
        { owner: "shuttleverse", repo: "shuttleverse-connect" },
        { owner: "shuttleverse", repo: "shuttleverse-community" },
        { owner: "shuttleverse", repo: "shuttleverse-aggregator" },
        { owner: "shuttleverse", repo: "shuttleverse-service-discovery" },
      ],
    },
  },
  {
    name: "Restaumap",
    status: "Deployed",
    description:
      "Paste a Xiaohongshu or Instagram link and Restaumap extracts the restaurant info into your collection. Interactive map showing extracted restaurants and logs. Create groups so friends can save and log places together.",
    tags: ["TypeScript", "Next.js", "Mapbox"],
    source: { kind: "single", owner: "qihongw08", repo: "restaumap" },
    liveUrl: "https://restaumap.us",
  },
  {
    name: "Karp",
    status: "Archived",
    description:
      "Incentivizes volunteers with in-app currency they can exchange for real rewards. Shipped with Generate Product Studio in a 13-person cross-functional team.",
    tags: ["FastAPI", "React Native", "MongoDB"],
    source: {
      kind: "aggregate",
      linkUrl: "https://github.com/GenerateNU",
      repos: [
        { owner: "GenerateNU", repo: "karp-backend" },
        { owner: "GenerateNU", repo: "karp-frontend-react" },
        { owner: "GenerateNU", repo: "karp-frontend-react-native" },
      ],
    },
  },
];
