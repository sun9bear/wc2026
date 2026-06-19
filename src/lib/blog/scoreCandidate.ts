// P2.5 融合（= CodeX 建议的 scoreCandidate）：把"数据锚（prob_delta 材料性）"×"需求（赛程模板 + Trending 加权）"
// 拼成候选队列，并按 locale 产出 INPUT payload（严格遵 BLOG-PROMPTS §1）。
// 原则：material（有数据锚）才入队；prob_delta = 自动发硬门槛；候选 locale-中立，buildInputPayload(locale) 本地化。

import { teamName, stageName } from "@/lib/football/teams";
import { localeHref } from "@/i18n/locales";
import type { Locale } from "@/i18n/locales";
import { teamSlug } from "@/lib/prob/findTeam";
import { fixtureDemand } from "./fixtureDemand";
import type { MatchProbDelta, ProbDeltaClass, BlogEventType } from "./getProbDelta";

export interface BlogCandidate {
  matchId: string;
  eventType: BlogEventType | "market_swing";
  priority: number; // 越大越优先
  trendingHeat: number | null; // 来自 Trending（无则 null）
  delta: MatchProbDelta; // 数据锚原料
}

/** 优先级 = 材料强度（出线摆动 pp）+ 需求加权（trending 热度 log）。 */
function priorityOf(maxAdvanceSwing: number, trendingHeat: number | null): number {
  const material = Math.round(maxAdvanceSwing * 100); // 0–100 pp
  const demand = trendingHeat && trendingHeat > 0 ? Math.round(Math.log10(trendingHeat) * 10) : 0; // 1k→30, 100k→50
  return material + demand;
}

/** 赛后已结算比赛 → 候选（material 闸 + 优先级）；非 material 返回 null。 */
export function buildSettledCandidate(
  delta: MatchProbDelta,
  cls: ProbDeltaClass,
  trendingHeat: number | null = null
): BlogCandidate | null {
  if (!cls.material || !cls.eventType) return null;
  return {
    matchId: delta.matchId,
    eventType: cls.eventType,
    priority: priorityOf(cls.maxAdvanceSwing, trendingHeat),
    trendingHeat,
    delta,
  };
}

/** 候选 → 某 locale 的 INPUT payload（BLOG-PROMPTS §1）。news 为来自 Trending/GDELT 的上下文（可空）。 */
export function buildInputPayload(
  cand: BlogCandidate,
  locale: Locale,
  news: { title: string; source: string | null }[] | null = null
) {
  const d = cand.delta;
  const teamPaths: Record<string, string> = {};
  for (const t of d.teams) teamPaths[teamName(t.team, locale)] = localeHref(locale, `/team/${teamSlug(t.team)}`);
  const demand = fixtureDemand(d.match.home, d.match.away, cand.eventType, locale, cand.trendingHeat);
  return {
    match: {
      home: teamName(d.match.home, locale),
      away: teamName(d.match.away, locale),
      score: d.match.score,
      stage: d.match.stage ? stageName(d.match.stage, locale) : null,
      group: d.match.group,
      kickoffAtISO: d.kickoffAt,
    },
    prob_delta: {
      match_1x2: d.match1x2.before ? { before: d.match1x2.before, actual: d.match1x2.actual } : null,
      teams: d.teams.map((t) => ({ team: teamName(t.team, locale), side: t.side, pAdvance: t.pAdvance, pChampion: t.pChampion })),
    },
    event_type: cand.eventType,
    demand: { source: demand.source, query: demand.query, keywords: demand.keywords, heat: demand.heat },
    context: { note: null, news },
    links: {
      match: localeHref(locale, `/match/${d.matchId}`),
      teams: teamPaths,
      forecast: localeHref(locale, "/forecast"),
      calculator: d.match.group
        ? localeHref(locale, `/calculator/group/${d.match.group.toLowerCase()}`)
        : localeHref(locale, "/calculator"),
    },
  };
}
