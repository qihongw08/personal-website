import { env } from "./env";
import type { LolPlatform, LolRegion } from "@/content/lol";

export type RiotAccount = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

export type LolSummoner = {
  puuid: string;
  summonerLevel: number;
  profileIconId: number;
};

export type RankEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

export type MasteryEntry = {
  championId: number;
  championLevel: number;
  championPoints: number;
};

export type ChampionInfo = {
  id: string; // e.g., "Ahri"
  name: string; // display name, e.g., "Ahri"
  title: string;
  image: string; // e.g., "Ahri.png"
};

export type EnrichedMastery = MasteryEntry & {
  champion: ChampionInfo | null;
  iconUrl: string | null;
};

export type LolProfile = {
  account: RiotAccount;
  summoner: LolSummoner;
  ranks: RankEntry[];
  masteries: EnrichedMastery[];
  dataDragonVersion: string;
};

async function riotFetch<T>(url: string): Promise<T | null> {
  if (!env.RIOT_API_KEY) return null;
  try {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": env.RIOT_API_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      if (process.env.NODE_ENV === "development") {
        console.error(`[riot] ${res.status} ${res.statusText} ${url}`);
      }
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[riot] fetch failed ${url}:`, err);
    }
    return null;
  }
}

async function getDataDragonVersion(): Promise<string> {
  try {
    const res = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
      { next: { revalidate: 86400 } }, // daily
    );
    if (!res.ok) return "14.1.1"; // last-known fallback
    const versions = (await res.json()) as string[];
    return versions[0] ?? "14.1.1";
  } catch {
    return "14.1.1";
  }
}

async function getChampionLookup(
  version: string,
): Promise<Map<number, ChampionInfo>> {
  const out = new Map<number, ChampionInfo>();
  try {
    const res = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return out;
    const json = (await res.json()) as {
      data: Record<
        string,
        {
          key: string; // numeric id as string
          id: string; // internal id, e.g., "MonkeyKing"
          name: string;
          title: string;
          image: { full: string };
        }
      >;
    };
    for (const entry of Object.values(json.data)) {
      out.set(Number(entry.key), {
        id: entry.id,
        name: entry.name,
        title: entry.title,
        image: entry.image.full,
      });
    }
  } catch {
    // return empty map; masteries will render with a placeholder
  }
  return out;
}

export async function getLolProfile(config: {
  gameName: string;
  tagLine: string;
  region: LolRegion;
  platform: LolPlatform;
}): Promise<LolProfile | null> {
  if (!env.RIOT_API_KEY) return null;

  const account = await riotFetch<RiotAccount>(
    `https://${config.region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(
      config.gameName,
    )}/${encodeURIComponent(config.tagLine)}`,
  );
  if (!account) return null;

  const summoner = await riotFetch<LolSummoner>(
    `https://${config.platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`,
  );
  if (!summoner) return null;

  const [ranks, masteriesRaw, version] = await Promise.all([
    riotFetch<RankEntry[]>(
      `https://${config.platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`,
    ),
    riotFetch<MasteryEntry[]>(
      `https://${config.platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${account.puuid}/top?count=3`,
    ),
    getDataDragonVersion(),
  ]);

  const championLookup = await getChampionLookup(version);

  const masteries: EnrichedMastery[] = (masteriesRaw ?? []).map((m) => {
    const champion = championLookup.get(m.championId) ?? null;
    const iconUrl = champion
      ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image}`
      : null;
    return { ...m, champion, iconUrl };
  });

  return {
    account,
    summoner,
    ranks: ranks ?? [],
    masteries,
    dataDragonVersion: version,
  };
}

const QUEUE_LABELS: Record<string, string> = {
  RANKED_SOLO_5x5: "Solo/Duo",
  RANKED_FLEX_SR: "Flex",
  RANKED_FLEX_TT: "Flex 3v3",
};

export function formatQueue(queueType: string): string {
  return QUEUE_LABELS[queueType] ?? queueType;
}

export function formatRank(entry: RankEntry): string {
  const tier =
    entry.tier.charAt(0).toUpperCase() + entry.tier.slice(1).toLowerCase();
  return `${tier} ${entry.rank} · ${entry.leaguePoints} LP`;
}

const TIER_COLORS: Record<string, string> = {
  IRON: "#5a5a5a",
  BRONZE: "#8b5a2b",
  SILVER: "#9aa0a6",
  GOLD: "#c79a3a",
  PLATINUM: "#4dc3a5",
  EMERALD: "#3fa868",
  DIAMOND: "#5a9cd6",
  MASTER: "#a855f7",
  GRANDMASTER: "#dc2626",
  CHALLENGER: "#22d3ee",
  UNRANKED: "#6b7280",
};

export function tierColor(tier: string): string {
  return TIER_COLORS[tier?.toUpperCase()] ?? TIER_COLORS.UNRANKED;
}

const OPGG_REGION: Record<string, string> = {
  na1: "na",
  br1: "br",
  la1: "lan",
  la2: "las",
  euw1: "euw",
  eun1: "eune",
  tr1: "tr",
  ru: "ru",
  kr: "kr",
  jp1: "jp",
  oc1: "oce",
  sg2: "sg",
  ph2: "ph",
  vn2: "vn",
  tw2: "tw",
  th2: "th",
};

/** Build a link to the op.gg summoner page. */
export function opggUrl(
  platform: string,
  gameName: string,
  tagLine: string,
): string {
  const region = OPGG_REGION[platform] ?? "na";
  return `https://op.gg/summoners/${region}/${encodeURIComponent(gameName)}-${encodeURIComponent(tagLine)}`;
}
