// 「爆冷瞬间」摆动数据（已结算比赛专用）：用真实快照算双队出线概率摆动，挑摆动最大者为主角。
// before = 开球前最后一张 prob_team_snapshots；after = 最新一张（赛果已被结算吸收）。
// 无需跑情景模拟（脚本 swing-bake.ts 是赛前预烘焙才需要）；快照不足/摆动不够大则返回 null。

import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";
import { teamZh, flagUrl } from "@/lib/football/teams";
import { teamSlug } from "./findTeam";

const UPSET_MIN = 0.1; // 至少一队出线概率摆动 ≥10pp 才算"爆冷瞬间"（否则不够震撼，不外显）

export interface SwingTeam {
  teamId: string;
  name: string; // 英文（OG slug / 分享文案 / 个性化匹配）
  zh: string;
  slug: string;
  flag: string | null;
  before: number; // 0-1
  after: number; // 0-1
  delta: number; // after - before（正=飙升，负=崩盘）
}
export interface MatchSwing {
  hero: SwingTeam; // 摆动幅度最大的一队（图卡主角）
  other: SwingTeam | null;
  homeName: string;
  awayName: string;
  homeZh: string;
  awayZh: string;
  homeScore: number;
  awayScore: number;
}

interface SnapRow {
  p_advance: number | string;
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

// 最新一张快照（可选只取某时刻之前）。
async function snapAdvance(teamId: string, beforeIso?: string): Promise<number | null> {
  let q = supabase
    .from("prob_team_snapshots")
    .select("p_advance")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (beforeIso) q = q.lt("created_at", beforeIso);
  const { data } = await q;
  const row = (data as SnapRow[] | null)?.[0];
  return row ? Number(row.p_advance) : null;
}

// 某时刻起的首张快照（用于"赛果进入模型后"的稳定 after 值）。
async function snapAdvanceFrom(teamId: string, fromIso: string): Promise<number | null> {
  const { data } = await supabase
    .from("prob_team_snapshots")
    .select("p_advance")
    .eq("team_id", teamId)
    .gte("created_at", fromIso)
    .order("created_at", { ascending: true })
    .limit(1);
  const row = (data as SnapRow[] | null)?.[0];
  return row ? Number(row.p_advance) : null;
}

async function buildTeam(
  t: { id: string; name: string },
  kickoff: string,
  settledAt: string | null
): Promise<SwingTeam | null> {
  // before：开球前最后一张快照（用户赛前看到的公开值）。
  // after：赛果进入模型后的首张快照（稳定且可归因到本场——避免被后续比赛拖着漂移，
  //        也让已分享出去的图卡数值不再变化）；无 settled_at/尚无赛后快照时回退最新一张。
  const before = await snapAdvance(t.id, kickoff);
  const after = (settledAt ? await snapAdvanceFrom(t.id, settledAt) : null) ?? (await snapAdvance(t.id));
  if (before == null || after == null || !Number.isFinite(before) || !Number.isFinite(after)) {
    return null;
  }
  return {
    teamId: t.id,
    name: t.name,
    zh: teamZh(t.name),
    slug: teamSlug(t.name),
    flag: flagUrl(t.name),
    before,
    after,
    delta: after - before,
  };
}

async function computeMatchSwing(matchId: string): Promise<MatchSwing | null> {
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

  const [h, a] = await Promise.all([
    buildTeam(m.home, m.kickoff_at, m.settled_at),
    buildTeam(m.away, m.kickoff_at, m.settled_at),
  ]);
  const teams = [h, a].filter((x): x is SwingTeam => x !== null);
  if (teams.length === 0) return null;

  teams.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  const hero = teams[0];
  if (Math.abs(hero.delta) < UPSET_MIN) return null; // 摆动不够大：不是"爆冷"，不外显

  return {
    hero,
    other: teams[1] ?? null,
    homeName: m.home.name,
    awayName: m.away.name,
    homeZh: teamZh(m.home.name),
    awayZh: teamZh(m.away.name),
    homeScore: m.home_score as number,
    awayScore: m.away_score as number,
  };
}

/** 已结算比赛的「爆冷瞬间」摆动；不够爆/快照不足返回 null。matchId 进缓存键，缓存 600s。 */
export const getMatchSwing = unstable_cache(computeMatchSwing, ["match-swing-v1"], {
  revalidate: 600,
});

/** 摆动 OG 图卡路径（metadata 与客户端分享共用，避免漂移）。比分作 result 文案（双语，雷词由 OG 路由再过滤）。 */
export function swingOgPath(swing: MatchSwing, locale: "zh" | "en"): string {
  const result =
    locale === "zh"
      ? `${swing.homeZh} ${swing.homeScore}-${swing.awayScore} ${swing.awayZh}`
      : `${swing.homeName} ${swing.homeScore}-${swing.awayScore} ${swing.awayName}`;
  const qs = new URLSearchParams({
    mode: "swing",
    team: swing.hero.slug,
    before: String(Math.round(swing.hero.before * 100)),
    after: String(Math.round(swing.hero.after * 100)),
    result,
    locale,
  });
  return `/api/og?${qs.toString()}`;
}
