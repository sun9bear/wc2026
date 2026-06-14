// 赛后「比分战报」数据（已结算比赛专用）：用该场**赛前最后一张快照**的 Top-5 比分分布，
// 算实际赛果赛前排第几、概率多少（不在 Top-5 内 = 冷门），外加该胜平负结果的赛前概率。
// 与 getMatchSwing（出线概率摆动，仅真爆冷）不同：战报卡每场都能出，触发频率远高，主打分享。
// 数据源 prob_match_snapshots（引擎每小时写入 top_scores + p_home/draw/away）；快照不足返回 null。

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";
import { teamZh, flagUrl } from "@/lib/football/teams";

export interface ScoreCell {
  h: number;
  a: number;
  p: number; // 0-1
}

export interface MatchReport {
  homeName: string;
  awayName: string;
  homeZh: string;
  awayZh: string;
  homeFlag: string | null;
  awayFlag: string | null;
  homeScore: number;
  awayScore: number;
  outcome: "home" | "draw" | "away";
  outcomeP: number | null; // 该胜平负结果的赛前概率（0-1）
  rank: number | null; // 实际比分赛前排第几（1-based）；不在 Top-5 内为 null（冷门）
  scoreP: number | null; // 实际比分的赛前概率（0-1）；不在 Top-5 内为 null
  top: ScoreCell[]; // 赛前 Top-5 比分分布（概率降序）
  updatedAt: string; // 赛前快照时间（ISO）
}

interface MatchRow {
  status: string | null;
  kickoff_at: string;
  settled_at: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { id: string; name: string } | null;
  away: { id: string; name: string } | null;
}
interface SnapRow {
  created_at: string;
  p_home: number | string;
  p_draw: number | string;
  p_away: number | string;
  top_scores: ScoreCell[] | null;
}

async function computeMatchReport(matchId: string): Promise<MatchReport | null> {
  const { data } = await supabase
    .from("matches")
    .select(
      "status, kickoff_at, settled_at, home_score, away_score, home:home_team_id(id, name), away:away_team_id(id, name)"
    )
    .eq("id", matchId)
    .maybeSingle();
  const m = data as unknown as MatchRow | null;
  if (!m || !m.home || !m.away) return null;
  const settled = m.status === "settled" && m.home_score != null && m.away_score != null;
  if (!settled) return null;
  const hs = m.home_score as number;
  const as = m.away_score as number;

  // 赛前最后一张快照（开球前）——用户赛前看到的公开分布，可稳定归因到本场。
  const { data: snapData } = await supabase
    .from("prob_match_snapshots")
    .select("created_at, p_home, p_draw, p_away, top_scores")
    .eq("match_id", matchId)
    .lt("created_at", m.kickoff_at)
    .order("created_at", { ascending: false })
    .limit(1);
  const snap = (snapData as SnapRow[] | null)?.[0];
  if (!snap) return null;

  const top = Array.isArray(snap.top_scores)
    ? snap.top_scores
        .filter((c) => Number.isFinite(c?.h) && Number.isFinite(c?.a) && Number.isFinite(c?.p))
        .map((c) => ({ h: c.h, a: c.a, p: Number(c.p) }))
        .sort((x, y) => y.p - x.p)
    : [];
  if (top.length === 0) return null;

  const idx = top.findIndex((c) => c.h === hs && c.a === as);
  const rank = idx >= 0 ? idx + 1 : null;
  const scoreP = idx >= 0 ? top[idx].p : null;

  const outcome: "home" | "draw" | "away" = hs > as ? "home" : hs < as ? "away" : "draw";
  const rawOutcomeP =
    outcome === "home" ? Number(snap.p_home) : outcome === "away" ? Number(snap.p_away) : Number(snap.p_draw);

  return {
    homeName: m.home.name,
    awayName: m.away.name,
    homeZh: teamZh(m.home.name),
    awayZh: teamZh(m.away.name),
    homeFlag: flagUrl(m.home.name),
    awayFlag: flagUrl(m.away.name),
    homeScore: hs,
    awayScore: as,
    outcome,
    outcomeP: Number.isFinite(rawOutcomeP) ? rawOutcomeP : null,
    rank,
    scoreP,
    top,
    updatedAt: snap.created_at,
  };
}

/** 已结算比赛的「比分战报」；快照不足返回 null。matchId 进缓存键，缓存 600s。 */
export const getMatchReport = unstable_cache(computeMatchReport, ["match-report-v1"], {
  revalidate: 600,
});

/** 战报 OG 图卡路径（metadata 与客户端分享共用）。所有字符串由 OG 路由再过雷词闸。 */
export function reportOgPath(r: MatchReport, locale: "zh" | "en"): string {
  const sl = r.top
    .slice(0, 5)
    .map((c) => `${c.h}-${c.a}:${Math.round(c.p * 100)}`)
    .filter((s) => !s.endsWith(":0"))
    .join(",");
  const qs = new URLSearchParams({
    mode: "report",
    h: locale === "zh" ? r.homeZh : r.homeName,
    a: locale === "zh" ? r.awayZh : r.awayName,
    hs: String(r.homeScore),
    as: String(r.awayScore),
    rk: String(r.rank ?? 0),
    sp: String(r.scoreP != null ? Math.round(r.scoreP * 100) : 0),
    op: String(r.outcomeP != null ? Math.round(r.outcomeP * 100) : 0),
    oc: r.outcome,
    locale,
  });
  if (r.homeFlag) qs.set("hf", r.homeFlag);
  if (r.awayFlag) qs.set("af", r.awayFlag);
  if (sl) qs.set("sl", sl);
  return `/api/og?${qs.toString()}`;
}
