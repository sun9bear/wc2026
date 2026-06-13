// 概率走势读取层（v2 历史曲线用）：从快照表读近期序列，分组 + 降采样为纯 JSON。
// 数据源：prob_team_snapshots / prob_match_snapshots（anon 只读，RLS 公开 select）。
// 容错：表未建 / 无数据 / 点数不足都安全降级（团队返回 []，单场返回 null），绝不抛给页面。

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";

const DAY_MS = 86_400_000;
const TARGET_POINTS = 24; // 迷你折线点数上限：再多视觉无增益，降采样省字节。

/** 一支球队近 4 天的出线概率走势。 */
export interface TeamTrend {
  teamId: string;
  series: number[]; // p_advance，时间升序，已降采样
  first: number;
  last: number;
  delta: number; // last - first（正=概率上升）
}

/** 单场胜平负概率走势（三线共用一套时间轴）。 */
export interface MatchTrend {
  home: number[];
  draw: number[];
  away: number[];
  points: number; // 原始快照点数（降采样前）
}

// 均匀降采样到 ≤max 点，始终保留首尾（最近一点必留）。n≤max 时原样返回。
function downsample(values: number[], max = TARGET_POINTS): number[] {
  const n = values.length;
  if (n <= max) return values;
  const out: number[] = [];
  for (let i = 0; i < max; i++) {
    out.push(values[Math.round((i * (n - 1)) / (max - 1))]);
  }
  return out;
}

interface TeamSnapRow {
  team_id: string;
  created_at: string;
  p_advance: number | string;
}

async function computeTeamAdvanceTrends(): Promise<TeamTrend[]> {
  const since = new Date(Date.now() - 4 * DAY_MS).toISOString();
  // 降序 + 上限：PostgREST 默认 1000 行硬顶；全队每小时各写一行，>1 天即超顶。
  // 若用升序会丢最新行（破坏 last/Δ）；故降序取最新，再按队反转回时间升序。
  const { data, error } = await supabase
    .from("prob_team_snapshots")
    .select("team_id, created_at, p_advance")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error || !data) return [];

  // 按队分组（降序：最新在前，下方反转回时间升序）。
  const byTeam = new Map<string, number[]>();
  for (const r of data as TeamSnapRow[]) {
    const p = Number(r.p_advance);
    if (!Number.isFinite(p)) continue;
    let arr = byTeam.get(r.team_id);
    if (!arr) byTeam.set(r.team_id, (arr = []));
    arr.push(p);
  }

  const trends: TeamTrend[] = [];
  for (const [teamId, descVals] of byTeam) {
    if (descVals.length < 2) continue; // 需 ≥2 点才有 Δ
    const series = downsample(descVals.slice().reverse()); // 反转 → 时间升序
    const first = series[0];
    const last = series[series.length - 1];
    trends.push({ teamId, series, first, last, delta: last - first });
  }
  trends.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)); // |Δ| 倒序：异动最大者在前
  return trends;
}

/** 近 4 天全部球队出线概率走势，按 |Δ| 倒序。缓存 600s。 */
export const getTeamAdvanceTrends = unstable_cache(
  computeTeamAdvanceTrends,
  ["team-advance-trends-v1"],
  { revalidate: 600 }
);

interface MatchSnapRow {
  created_at: string;
  p_home: number | string;
  p_draw: number | string;
  p_away: number | string;
}

async function computeMatchProbTrend(matchId: string): Promise<MatchTrend | null> {
  // 降序 + 上限取最新，避免单场快照超 PostgREST 行顶；再反转回时间升序。
  const { data, error } = await supabase
    .from("prob_match_snapshots")
    .select("created_at, p_home, p_draw, p_away")
    .eq("match_id", matchId)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error || !data || data.length < 3) return null; // <3 点不足以成线
  const rows = (data as MatchSnapRow[]).slice().reverse(); // 时间升序
  return {
    home: downsample(rows.map((r) => Number(r.p_home))),
    draw: downsample(rows.map((r) => Number(r.p_draw))),
    away: downsample(rows.map((r) => Number(r.p_away))),
    points: rows.length,
  };
}

/** 单场胜平负概率走势；快照 <3 点返回 null。matchId 进缓存键，缓存 600s。 */
export const getMatchProbTrend = unstable_cache(
  computeMatchProbTrend,
  ["match-prob-trend-v1"],
  { revalidate: 600 }
);
