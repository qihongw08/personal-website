export type LolRankSnapshot = {
  season: string;
  queue?: "Solo/Duo" | "Flex";
  rank: string;
  /** Final LP for the season — optional. */
  lp?: number;
};

/** Regional routing for the account-v1 endpoint. */
export type LolRegion = "americas" | "europe" | "asia" | "sea";
/** Platform routing for summoner/league/mastery endpoints. */
export type LolPlatform =
  | "na1"
  | "br1"
  | "la1"
  | "la2"
  | "euw1"
  | "eun1"
  | "tr1"
  | "ru"
  | "kr"
  | "jp1"
  | "oc1"
  | "sg2"
  | "ph2"
  | "vn2"
  | "tw2"
  | "th2";

export type LolTeam = {
  name: string;
  /** e.g. "2023–24, 2024–25" */
  years: string;
  /** Path under `public/`, e.g. "/logos/northeastern-esports.png". */
  logo?: string;
};

type LolConfig = {
  gameName: string;
  tagLine: string;
  region: LolRegion;
  platform: LolPlatform;
  rankHistory: LolRankSnapshot[];
  teams: LolTeam[];
};

export const lol: LolConfig = {
  // Riot ID — the new-style summoner identifier. Format: GameName#TAG.
  gameName: "iGYing1",
  tagLine: "666",

  // Which region cluster you play on.
  region: "americas",
  platform: "na1",

  teams: [
    {
      name: "Northeastern Club Esports",
      years: "2023–24, 2024–25",
      logo: "/logos/northeastern-esports.png",
    },
  ],

  // Manual rank history — Riot's API only exposes current rank, not past
  // seasons. Fill this in yourself; it renders alongside live current rank.
  rankHistory: [
    { season: "S2025", rank: "Emerald III", lp: 45 },
    { season: "S2024 S3", rank: "Emerald IV", lp: 37 },
    { season: "S2024 S2", rank: "Emerald I", lp: 3 },
    { season: "S2024 S1", rank: "Diamond II", lp: 50 },
    { season: "S2023 S2", rank: "Diamond II", lp: 0 },
    { season: "S2023 S1", rank: "Diamond III", lp: 43 },
    { season: "S2022", rank: "Diamond IV", lp: 26 },
    { season: "S2021", rank: "Diamond IV", lp: 0 },
    { season: "S2020", rank: "Platinum IV", lp: 22 },
    { season: "S9", rank: "Gold I", lp: 7 },
    { season: "S8", rank: "Silver I", lp: 0 },
    { season: "S7", rank: "Silver IV", lp: 0 },
  ],
};
