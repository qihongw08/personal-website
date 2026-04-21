import Image from "next/image";
import { Trophy } from "lucide-react";
import { lol } from "@/content/lol";
import { formatQueue, getLolProfile, opggUrl, tierColor } from "@/lib/riot";
import { RankHistoryTable } from "./RankHistoryTable";
import { TierEmblem } from "./TierEmblem";

function formatTier(tier: string): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

export async function LeagueCard() {
  const profile = await getLolProfile(lol);

  return (
    <div className="glass-card relative overflow-hidden rounded-xl md:col-span-2 md:row-span-2">
      <div className="flex h-full flex-col px-6 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-[1px] text-[var(--ink-faint)]">
              LEAGUE_OF_LEGENDS
            </div>
            <h3 className="m-0 font-display text-[22px] font-bold text-[var(--ink)]">
              <a
                href={opggUrl(
                  lol.platform,
                  profile?.account.gameName ?? lol.gameName,
                  profile?.account.tagLine ?? lol.tagLine,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-[var(--brand)]"
                title="View on op.gg"
              >
                {profile?.account.gameName ?? lol.gameName}
                <span className="ml-1 text-[var(--ink-faint)]">
                  #{profile?.account.tagLine ?? lol.tagLine}
                </span>
              </a>
            </h3>
            {profile?.summoner.summonerLevel && (
              <div className="mt-0.5 font-mono text-[10px] tracking-[1px] text-[var(--ink-muted)]">
                LEVEL {profile.summoner.summonerLevel}
              </div>
            )}
            {lol.teams.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {lol.teams.map((t) => (
                  <div
                    key={t.name}
                    className="inline-flex items-center gap-1.5 self-start rounded-full border py-0.5 pl-0.5 pr-2 text-[11px] text-[var(--ink)]"
                    style={{
                      background: "rgba(255,255,255,0.35)",
                      borderColor: "var(--ink)",
                    }}
                  >
                    {t.logo ? (
                      <span
                        className="relative h-5 w-5 flex-shrink-0 overflow-hidden rounded-full"
                        style={{ background: "#000" }}
                      >
                        <Image
                          src={t.logo}
                          alt={t.name}
                          fill
                          sizes="20px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <Trophy size={11} className="ml-1.5" />
                    )}
                    <span className="font-medium">{t.name}</span>
                    <span className="font-mono text-[10px] text-[var(--ink-muted)]">
                      {t.years}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {profile === null && (
            <span
              className="font-mono text-[9px] tracking-[1px] text-[var(--ink-faint)]"
              title="Set RIOT_API_KEY in .env.local to enable live data"
            >
              OFFLINE
            </span>
          )}
        </div>

        {/* Current rank */}
        <div className="mt-4">
          <div className="mb-1.5 font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
            CURRENT RANK
          </div>
          {profile && profile.ranks.length > 0 ? (
            <div className="flex flex-col gap-2">
              {profile.ranks.map((r) => {
                const color = tierColor(r.tier);
                const games = r.wins + r.losses;
                const winRate =
                  games > 0 ? Math.round((r.wins / games) * 100) : 0;
                return (
                  <div
                    key={r.queueType}
                    className="flex items-center gap-3 rounded-md px-3 py-2"
                    style={{
                      background: "rgba(255,255,255,0.35)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    {/* Emblem in circular tier-tinted disc */}
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `${color}1a`,
                        border: `1px solid ${color}55`,
                      }}
                    >
                      <TierEmblem color={color} size={26} />
                    </div>

                    {/* Rank + LP */}
                    <div className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="font-mono text-[9px] tracking-[1px] text-[var(--ink-faint)]">
                        {formatQueue(r.queueType).toUpperCase()}
                      </span>
                      <span className="text-[14px] font-bold" style={{ color }}>
                        {formatTier(r.tier)} {r.rank}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                        {r.leaguePoints} LP
                      </span>
                    </div>

                    {/* W/L + Win rate */}
                    {games > 0 && (
                      <div className="flex flex-col items-end leading-tight">
                        <span className="font-mono text-[12px] text-[var(--ink)]">
                          <span className="font-semibold">{r.wins}W</span>{" "}
                          <span className="text-[var(--ink-muted)]">
                            {r.losses}L
                          </span>
                        </span>
                        <span className="font-mono text-[11px] text-[var(--ink-faint)]">
                          Win rate {winRate}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-[12px] text-[var(--ink-faint)]">
              {profile === null ? "API key required" : "Unranked"}
            </div>
          )}
        </div>

        <RankHistoryTable history={lol.rankHistory} />

        {/* Top 3 masteries */}
        <div className="mt-auto pt-4">
          <div className="mb-2 font-mono text-[9px] tracking-[1.5px] text-[var(--ink-faint)]">
            TOP MASTERIES
          </div>
          <div className="grid grid-cols-3 gap-2">
            {profile && profile.masteries.length > 0
              ? profile.masteries.map((m) => (
                  <div
                    key={m.championId}
                    className="flex flex-col items-center rounded-md p-2"
                    style={{
                      background: "rgba(255,255,255,0.35)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div className="relative h-12 w-12 overflow-hidden rounded-md">
                      {m.iconUrl ? (
                        <Image
                          src={m.iconUrl}
                          alt={m.champion?.name ?? `Champion ${m.championId}`}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center font-mono text-[9px] text-[var(--ink-faint)]"
                          style={{ background: "rgba(0,0,0,0.04)" }}
                        >
                          ?
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 text-center text-[11px] font-semibold text-[var(--ink)]">
                      {m.champion?.name ?? `#${m.championId}`}
                    </div>
                    <div className="font-mono text-[9px] text-[var(--ink-faint)]">
                      M{m.championLevel} · {m.championPoints.toLocaleString()}
                    </div>
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center rounded-md p-2 opacity-40"
                    style={{
                      background: "rgba(255,255,255,0.35)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    <div
                      className="h-12 w-12 rounded-md"
                      style={{ background: "rgba(0,0,0,0.04)" }}
                    />
                    <div className="mt-1.5 h-2.5 w-12 rounded-sm bg-[rgba(0,0,0,0.04)]" />
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
