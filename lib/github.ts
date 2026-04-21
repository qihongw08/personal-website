import { env } from "./env";

export type RepoStats = {
  owner: string;
  repo: string;
  stars: number;
  commits: number;
  recentCommitDatesISO: string[]; // last ~100 in the past year
  lastPushISO: string | null;
  htmlUrl: string;
  description: string | null;
};

export type AggregateStats = {
  stars: number;
  commits: number;
  recentCommitDatesISO: string[];
  lastPushISO: string | null;
  repoCount: number;
};

type RepoGql = {
  stargazerCount: number;
  pushedAt: string | null;
  url: string;
  description: string | null;
  defaultBranchRef: {
    target: {
      history: {
        totalCount: number;
        nodes: Array<{ committedDate: string }>;
      };
    } | null;
  } | null;
} | null;

function aliasFor(owner: string, repo: string) {
  return `r_${(owner + "_" + repo).replace(/[^a-zA-Z0-9_]/g, "_")}`;
}

/**
 * Single GraphQL request that fetches stats for every repo in one round-trip.
 * Uses Next.js `fetch` so responses are cached per-request-key and share the
 * data cache across the page. Dedupes identical calls within a render and
 * honors `revalidate` at the page level.
 */
export async function getBatchedRepoStats(
  repos: Array<{ owner: string; repo: string }>,
): Promise<Map<string, RepoStats | null>> {
  const out = new Map<string, RepoStats | null>();
  if (repos.length === 0) return out;

  // Deduplicate
  const unique = Array.from(
    new Map(repos.map((r) => [`${r.owner}/${r.repo}`, r])).values(),
  );

  if (!env.GITHUB_TOKEN) {
    unique.forEach((r) => out.set(`${r.owner}/${r.repo}`, null));
    return out;
  }

  const fragments = unique
    .map(
      (r, i) => `
    ${aliasFor(r.owner, r.repo)}: repository(owner: $o${i}, name: $n${i}) {
      stargazerCount
      pushedAt
      url
      description
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 100) {
              totalCount
              nodes { committedDate }
            }
          }
        }
      }
    }`,
    )
    .join("\n");

  const varDecls = unique
    .map((_, i) => `$o${i}: String!, $n${i}: String!`)
    .join(", ");
  const variables: Record<string, string> = {};
  unique.forEach((r, i) => {
    variables[`o${i}`] = r.owner;
    variables[`n${i}`] = r.repo;
  });

  const query = `query Repos(${varDecls}) {\n${fragments}\n}`;

  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const json = (await res.json()) as {
      data?: Record<string, RepoGql>;
      errors?: unknown;
    };
    if (json.errors && process.env.NODE_ENV === "development") {
      console.error("[github] GraphQL errors:", json.errors);
    }
    const data = json.data ?? {};
    for (const r of unique) {
      const key = `${r.owner}/${r.repo}`;
      const node = data[aliasFor(r.owner, r.repo)];
      if (!node) {
        out.set(key, null);
        continue;
      }
      const history = node.defaultBranchRef?.target?.history;
      out.set(key, {
        owner: r.owner,
        repo: r.repo,
        stars: node.stargazerCount,
        commits: history?.totalCount ?? 0,
        recentCommitDatesISO: history?.nodes.map((n) => n.committedDate) ?? [],
        lastPushISO: node.pushedAt,
        htmlUrl: node.url,
        description: node.description,
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[github] getBatchedRepoStats failed:", err);
    }
    unique.forEach((r) => out.set(`${r.owner}/${r.repo}`, null));
  }

  // Paginate any repos where the first 100 didn't cover all commits.
  // Cap at MAX_COMMIT_PAGES to bound the API cost for huge repos.
  const needsMore = unique
    .map((r) => ({ r, stat: out.get(`${r.owner}/${r.repo}`) }))
    .filter(
      ({ stat }) =>
        stat &&
        stat.recentCommitDatesISO.length === 100 &&
        stat.commits > 100,
    );

  await Promise.all(
    needsMore.map(async ({ r, stat }) => {
      if (!stat) return;
      const more = await fetchAllCommitDates(r.owner, r.repo, stat.commits);
      out.set(`${r.owner}/${r.repo}`, { ...stat, recentCommitDatesISO: more });
    }),
  );

  return out;
}

const MAX_COMMIT_PAGES = 10; // 1000 commits per repo cap

async function fetchAllCommitDates(
  owner: string,
  repo: string,
  totalCount: number,
): Promise<string[]> {
  if (!env.GITHUB_TOKEN) return [];

  const target = Math.min(totalCount, MAX_COMMIT_PAGES * 100);
  const dates: string[] = [];
  let cursor: string | null = null;

  const query = `
    query CommitsPage($owner: String!, $name: String!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, after: $cursor) {
                pageInfo { hasNextPage endCursor }
                nodes { committedDate }
              }
            }
          }
        }
      }
    }
  `;

  type PageResp = {
    data?: {
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              pageInfo: { hasNextPage: boolean; endCursor: string | null };
              nodes: Array<{ committedDate: string }>;
            } | null;
          } | null;
        } | null;
      } | null;
    };
  };

  for (let page = 0; page < MAX_COMMIT_PAGES && dates.length < target; page++) {
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          query,
          variables: { owner, name: repo, cursor },
        }),
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const json = (await res.json()) as PageResp;
      const history = json.data?.repository?.defaultBranchRef?.target?.history;
      if (!history) break;
      dates.push(...history.nodes.map((n) => n.committedDate));
      if (!history.pageInfo.hasNextPage) break;
      cursor = history.pageInfo.endCursor;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[github] pagination failed at ${owner}/${repo}:`, err);
      }
      break;
    }
  }

  return dates;
}

export function aggregateFrom(
  stats: Map<string, RepoStats | null>,
  repos: Array<{ owner: string; repo: string }>,
): AggregateStats {
  const hits = repos
    .map((r) => stats.get(`${r.owner}/${r.repo}`))
    .filter((r): r is RepoStats => r != null);
  const stars = hits.reduce((acc, r) => acc + r.stars, 0);
  const commits = hits.reduce((acc, r) => acc + r.commits, 0);
  const recentCommitDatesISO = hits.flatMap((r) => r.recentCommitDatesISO);
  const lastPushISO =
    hits
      .map((r) => r.lastPushISO)
      .filter((v): v is string => v !== null)
      .sort()
      .at(-1) ?? null;
  return {
    stars,
    commits,
    recentCommitDatesISO,
    lastPushISO,
    repoCount: hits.length,
  };
}

const HOUR_MS = 3600 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

export type Granularity = "hour" | "day" | "week" | "month";

export type ActivityBuckets = {
  counts: number[];
  fromMs: number;
  toMs: number;
  granularity: Granularity;
};

/**
 * Parse an activity range. Accepts either:
 *   "YYYY/MM-YYYY/MM"          → start of from-month → end of to-month
 *   "YYYY/MM/DD-YYYY/MM/DD"    → start of from-day → end of to-day
 * `/` and `-` are interchangeable in date components.
 * Returns null if neither format matches.
 */
export function parseActivityRange(
  range: string,
): { fromMs: number; toMs: number } | null {
  const dayMatch = range.match(
    /^\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*-\s*(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s*$/,
  );
  if (dayMatch) {
    const [, y1, mo1, d1, y2, mo2, d2] = dayMatch;
    const fromMs = new Date(
      Number(y1),
      Number(mo1) - 1,
      Number(d1),
      0,
      0,
      0,
      0,
    ).getTime();
    const toMs = new Date(
      Number(y2),
      Number(mo2) - 1,
      Number(d2),
      23,
      59,
      59,
      999,
    ).getTime();
    if (toMs <= fromMs) return null;
    return { fromMs, toMs };
  }

  const monthMatch = range.match(
    /^\s*(\d{4})[\/-](\d{1,2})\s*-\s*(\d{4})[\/-](\d{1,2})\s*$/,
  );
  if (monthMatch) {
    const [, y1, mo1, y2, mo2] = monthMatch;
    const fromMs = new Date(Number(y1), Number(mo1) - 1, 1).getTime();
    const toMs = new Date(
      Number(y2),
      Number(mo2),
      0,
      23,
      59,
      59,
      999,
    ).getTime();
    if (toMs <= fromMs) return null;
    return { fromMs, toMs };
  }

  return null;
}

function monthDelta(aMs: number, bMs: number): number {
  const a = new Date(aMs);
  const b = new Date(bMs);
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
  );
}

/**
 * Compute activity buckets for a sparkline. Derives the time range from
 * `rangeMs` if provided, otherwise from the min/max of commit dates.
 * Picks bucket granularity (day/week/month) based on span length so the
 * sparkline looks sensible at any scale.
 */
export function computeActivity(
  datesISO: string[],
  rangeMs?: { fromMs: number; toMs: number },
): ActivityBuckets {
  const timestamps = datesISO
    .map((iso) => Date.parse(iso))
    .filter((t) => !Number.isNaN(t));

  let fromMs: number;
  let toMs: number;
  if (rangeMs) {
    fromMs = rangeMs.fromMs;
    toMs = rangeMs.toMs;
  } else if (timestamps.length === 0) {
    toMs = Date.now();
    fromMs = toMs - 24 * WEEK_MS;
  } else {
    fromMs = Math.min(...timestamps);
    toMs = Math.max(...timestamps);
    if (toMs - fromMs < WEEK_MS) toMs = fromMs + WEEK_MS;
  }

  const spanHours = (toMs - fromMs) / HOUR_MS;
  const spanDays = spanHours / 24;
  const granularity: Granularity =
    spanHours <= 48
      ? "hour"
      : spanDays <= 60
        ? "day"
        : spanDays <= 365
          ? "week"
          : "month";

  let counts: number[];
  if (granularity === "month") {
    const n = monthDelta(fromMs, toMs) + 1;
    counts = new Array(n).fill(0);
    for (const t of timestamps) {
      if (t < fromMs || t > toMs) continue;
      const idx = monthDelta(fromMs, t);
      if (idx >= 0 && idx < n) counts[idx]++;
    }
  } else {
    const bucketMs =
      granularity === "hour" ? HOUR_MS : granularity === "day" ? DAY_MS : WEEK_MS;
    const n = Math.max(1, Math.ceil((toMs - fromMs) / bucketMs));
    counts = new Array(n).fill(0);
    for (const t of timestamps) {
      if (t < fromMs || t > toMs) continue;
      const idx = Math.min(n - 1, Math.floor((t - fromMs) / bucketMs));
      counts[idx]++;
    }
  }

  return { counts, fromMs, toMs, granularity };
}
