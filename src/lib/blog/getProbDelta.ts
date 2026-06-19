// 事件概率影响（prob_delta）：blog 生成的"数据锚"——正文数字的唯一可信来源（见 BLOG-PROMPTS §1/§2）。
// before = 开球前最后一张快照（用户赛前看到的公开值）；after = 结算后首张（赛果已被引擎吸收），
//   无 settled_at/尚无赛后快照时回退最新一张。复用 getMatchSwing 的快照读法，扩出 p_champion + 单场 1x2 before。
// 读取走 anon 客户端（prob_*_snapshots / matches 均公开 RLS）；任何缺失都置 null，绝不抛给调用方。
// 输出保留 0-1 原始浮点（提示词按 §2 自行四舍五入为整数百分比）。

import { supabase } from "@/lib/supabase/client";

export interface ProbPair {
  before: number | null;
  after: number | null;
}
export interface TeamProbDelta {
  teamId: string;
  team: string; // DB 英文名（football-data 拼写）
  side: "home" | "away";
  pAdvance: ProbPair;
  pChampion: ProbPair;
}
export type Match1x2Outcome = "home_win" | "draw" | "away_win";
export interface MatchProbDelta {
  matchId: string;
  kickoffAt: string;
  settledAt: string | null;
  match: { home: string; away: string; score: string | null; stage: string | null; group: string | null };
  match1x2: { before: { home: number; draw: number; away: number } | null; actual: Match1x2Outcome | null };
  teams: TeamProbDelta[];
}

interface TeamSnap {
  pAdvance: number;
  pChampion: number;
}
type TeamSnapRow = { p_advance: number | string; p_champion: number | string };

async function teamSnapBefore(teamId: string, kickoffIso: string): Promise<TeamSnap | null> {
  const { data } = await supabase
    .from("prob_team_snapshots")
    .select("p_advance, p_champion")
    .eq("team_id", teamId)
    .lt("created_at", kickoffIso)
    .order("created_at", { ascending: false })
    .limit(1);
  const r = (data as TeamSnapRow[] | null)?.[0];
  return r ? { pAdvance: Number(r.p_advance), pChampion: Number(r.p_champion) } : null;
}

async function teamSnapFrom(teamId: string, fromIso: string): Promise<TeamSnap | null> {
  const { data } = await supabase
    .from("prob_team_snapshots")
    .select("p_advance, p_champion")
    .eq("team_id", teamId)
    .gte("created_at", fromIso)
    .order("created_at", { ascending: true })
    .limit(1);
  const r = (data as TeamSnapRow[] | null)?.[0];
  return r ? { pAdvance: Number(r.p_advance), pChampion: Number(r.p_champion) } : null;
}

async function teamSnapLatest(teamId: string): Promise<TeamSnap | null> {
  const { data } = await supabase
    .from("prob_team_snapshots")
    .select("p_advance, p_champion")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(1);
  const r = (data as TeamSnapRow[] | null)?.[0];
  return r ? { pAdvance: Number(r.p_advance), pChampion: Number(r.p_champion) } : null;
}

async function matchSnapBefore(
  matchId: string,
  kickoffIso: string
): Promise<{ home: number; draw: number; away: number } | null> {
  const { data } = await supabase
    .from("prob_match_snapshots")
    .select("p_home, p_draw, p_away")
    .eq("match_id", matchId)
    .lt("created_at", kickoffIso)
    .order("created_at", { ascending: false })
    .limit(1);
  const r = (data as { p_home: number | string; p_draw: number | string; p_away: number | string }[] | null)?.[0];
  return r ? { home: Number(r.p_home), draw: Number(r.p_draw), away: Number(r.p_away) } : null;
}

interface MatchRow {
  status: string | null;
  stage: string | null;
  kickoff_at: string;
  settled_at: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { id: string; name: string; grp: string | null } | null;
  away: { id: string; name: string; grp: string | null } | null;
}

async function buildTeam(
  t: { id: string; name: string },
  side: "home" | "away",
  kickoff: string,
  settledAt: string | null
): Promise<TeamProbDelta> {
  const before = await teamSnapBefore(t.id, kickoff);
  const after = (settledAt ? await teamSnapFrom(t.id, settledAt) : null) ?? (await teamSnapLatest(t.id));
  return {
    teamId: t.id,
    team: t.name,
    side,
    pAdvance: { before: before?.pAdvance ?? null, after: after?.pAdvance ?? null },
    pChampion: { before: before?.pChampion ?? null, after: after?.pChampion ?? null },
  };
}

/** 取某场的完整 prob_delta（数据锚）。无此场返回 null；缺快照则相应字段 null。 */
export async function getMatchProbDelta(matchId: string): Promise<MatchProbDelta | null> {
  const { data } = await supabase
    .from("matches")
    .select(
      "status, stage, kickoff_at, settled_at, home_score, away_score, home:home_team_id(id, name, grp), away:away_team_id(id, name, grp)"
    )
    .eq("id", matchId)
    .maybeSingle();
  const m = data as unknown as MatchRow | null;
  if (!m || !m.home || !m.away) return null;

  const settled = m.status === "settled" && m.home_score != null && m.away_score != null;
  const actual: Match1x2Outcome | null = settled
    ? m.home_score! > m.away_score!
      ? "home_win"
      : m.home_score! < m.away_score!
        ? "away_win"
        : "draw"
    : null;

  const [match1x2Before, home, away] = await Promise.all([
    matchSnapBefore(matchId, m.kickoff_at),
    buildTeam(m.home, "home", m.kickoff_at, m.settled_at),
    buildTeam(m.away, "away", m.kickoff_at, m.settled_at),
  ]);

  return {
    matchId,
    kickoffAt: m.kickoff_at,
    settledAt: m.settled_at,
    match: {
      home: m.home.name,
      away: m.away.name,
      score: settled ? `${m.home_score}-${m.away_score}` : null,
      stage: m.stage,
      group: m.home.grp?.match(/[A-L]/)?.[0] ?? null,
    },
    match1x2: { before: match1x2Before, actual },
    teams: [home, away],
  };
}

// ---- 事件分类（"材料性"判定：数据锚是否值得出稿，供 scoreCandidate / P2.5）----
// 实测校准（2026-06-19，8 场已结算）：旧规则误报"墨西哥 99%→100% 当 clinched(2pp)"、
// "英格兰 48% 按预期赢克罗地亚却判 upset"、且"胜率<50%"会把几乎每场平局都误判 upset。
// 修正：① clinch/elim 要求赛前还没接近锁定/出局（before ≤90% / ≥10%）；
//       ② upset = 实际结果 ≠ 赛前最可能结果（argmax）且引起显著摆动（≥10pp）。
const SWING_MIN = 0.1; // 出线概率摆动 ≥10pp 视为显著
const CLINCH = 0.99;
const ELIM = 0.01;
const CLINCH_FROM_MAX = 0.9; // 赛前已 ≥90%，从 99→100 不算新闻
const ELIM_FROM_MIN = 0.1; // 赛前已 ≤10%，出局非新闻

export type BlogEventType = "upset" | "clinched" | "eliminated" | "swing";
export interface ProbDeltaClass {
  eventType: BlogEventType | null;
  material: boolean; // 是否够"料"出稿（任一事件成立）
  maxAdvanceSwing: number; // 0-1，两队中最大的 |Δ出线率|
}

function argmaxOutcome(b: { home: number; draw: number; away: number }): Match1x2Outcome {
  if (b.home >= b.draw && b.home >= b.away) return "home_win";
  if (b.away >= b.draw && b.away >= b.home) return "away_win";
  return "draw";
}

/** 由 prob_delta 判事件类型与材料性（优先级 upset > clinched > eliminated > swing）。 */
export function classifyProbDelta(d: MatchProbDelta): ProbDeltaClass {
  let maxAdvanceSwing = 0;
  let clinched = false;
  let eliminated = false;
  for (const t of d.teams) {
    const { before, after } = t.pAdvance;
    if (before == null || after == null) continue;
    maxAdvanceSwing = Math.max(maxAdvanceSwing, Math.abs(after - before));
    if (before <= CLINCH_FROM_MAX && before < CLINCH && after >= CLINCH) clinched = true;
    if (before >= ELIM_FROM_MIN && before > ELIM && after <= ELIM) eliminated = true;
  }
  // 爆冷：实际结果不是赛前最可能的结果，且引起显著摆动。
  const b = d.match1x2.before;
  const upset = !!(b && d.match1x2.actual && d.match1x2.actual !== argmaxOutcome(b) && maxAdvanceSwing >= SWING_MIN);

  const eventType: BlogEventType | null = upset
    ? "upset"
    : clinched
      ? "clinched"
      : eliminated
        ? "eliminated"
        : maxAdvanceSwing >= SWING_MIN
          ? "swing"
          : null;
  return { eventType, material: eventType !== null, maxAdvanceSwing };
}

// ---- 赛前市场漂移（market_swing，第二类数据锚；见 §4.4）----
// 检测未开赛比赛"市场隐含 1x2"较早先快照的漂移。措辞红线：消费方只说"市场隐含概率"，绝不说"赔率"。
// 实测当前漂移多 ≤6pp，故 ≥8pp 为低频高值信号（无大新闻不响）。
const MARKET_SWING_MIN_PP = 8;

export interface MarketImplied {
  home: number;
  draw: number;
  away: number;
}
export interface MatchMarketSwing {
  matchId: string;
  kickoffAt: string;
  match: { home: string; away: string; stage: string | null; group: string | null };
  implied: { early: MarketImplied | null; now: MarketImplied | null };
  maxDriftPp: number; // 0-100
  material: boolean;
}

async function marketSnap(matchId: string, dir: "asc" | "desc", beforeIso: string): Promise<MarketImplied | null> {
  const { data } = await supabase
    .from("prob_match_snapshots")
    .select("market")
    .eq("match_id", matchId)
    .not("market", "is", null)
    .lt("created_at", beforeIso)
    .order("created_at", { ascending: dir === "asc" })
    .limit(1);
  const r = (data as { market: { home: number | string; draw: number | string; away: number | string } | null }[] | null)?.[0]?.market;
  return r ? { home: Number(r.home), draw: Number(r.draw), away: Number(r.away) } : null;
}

/** 未开赛比赛的市场隐含 1x2 漂移（early→now，均取开球前快照）。无场/无市场快照则相应 null。 */
export async function getMatchMarketSwing(matchId: string): Promise<MatchMarketSwing | null> {
  const { data } = await supabase
    .from("matches")
    .select("stage, kickoff_at, home:home_team_id(name, grp), away:away_team_id(name, grp)")
    .eq("id", matchId)
    .maybeSingle();
  const m = data as unknown as {
    stage: string | null;
    kickoff_at: string;
    home: { name: string; grp: string | null } | null;
    away: { name: string; grp: string | null } | null;
  } | null;
  if (!m || !m.home || !m.away) return null;
  const [early, now] = await Promise.all([
    marketSnap(matchId, "asc", m.kickoff_at),
    marketSnap(matchId, "desc", m.kickoff_at),
  ]);
  let maxDriftPp = 0;
  if (early && now) {
    maxDriftPp = Math.round(
      Math.max(Math.abs(now.home - early.home), Math.abs(now.draw - early.draw), Math.abs(now.away - early.away)) * 100
    );
  }
  return {
    matchId,
    kickoffAt: m.kickoff_at,
    match: { home: m.home.name, away: m.away.name, stage: m.stage, group: m.home.grp?.match(/[A-L]/)?.[0] ?? null },
    implied: { early, now },
    maxDriftPp,
    material: !!(early && now) && maxDriftPp >= MARKET_SWING_MIN_PP,
  };
}
