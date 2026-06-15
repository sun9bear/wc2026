import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSupabase } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats/playerStats";
import { computeWinStreaks } from "@/lib/stats/winStreak";
import { rankTier } from "@/lib/ranks/rankTier";
import { computeStreak } from "@/lib/checkin/streak";
import { computeAchievements } from "@/lib/achievements/achievements";

// 已结算注单的嵌套行（bet → legs → selection → market → match）
interface SettledBetRow {
  id: string;
  status: string;
  payout: number | null;
  total_stake: number;
  total_multiplier: number;
  type: string;
  bet_selections: {
    selection: {
      code?: string | null;
      market: {
        match: {
          id: string;
          kickoff_at: string;
          settled_at: string | null;
          home_score: number | null;
          away_score: number | null;
          home: { name: string } | null;
          away: { name: string } | null;
        } | null;
      } | null;
    } | null;
  }[];
}

export interface RecentBet {
  won: boolean;
  status: string; // won / lost / pending
  picks: string[]; // 各腿所押选项 code（home/draw/away），供"押什么"展示
  matchId: string; // 代表场（最晚开球的一腿）——结算抽屉据此查爆冷摆动
  kickoff: string;
  settledAt: string | null;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  multiplier: number;
  payout: number;
  stake: number;
  legs: number;
}

// 返回当前用户的战绩（服务端用 secret key 读取，凭 access token 鉴别身份）。
export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "服务未配置" }, { status: 500 });

  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "");
  const { data: userData } = await createClient(url, anon).auth.getUser(token);
  const user = userData.user;
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const db = getServerSupabase();
  const { data: profRow } = await db
    .from("profiles")
    .select("points_balance, nickname")
    .eq("user_id", user.id)
    .maybeSingle();
  const prof = profRow as { points_balance: number; nickname: string | null } | null;
  const balance = prof?.points_balance ?? 1000;
  const nickname = prof?.nickname ?? null;

  const { data: betRows } = await db
    .from("bets")
    .select("status, payout")
    .eq("user_id", user.id);
  const bets = (betRows as { status: string; payout: number | null }[] | null) ?? [];
  const stats = computeStats(bets);
  const biggestPayout = bets.reduce((mx, b) => Math.max(mx, Number(b.payout ?? 0)), 0);

  const { data: dailyRows } = await db
    .from("points_ledger")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("reason", "daily")
    .order("created_at", { ascending: false })
    .limit(90);
  const dailyDates = ((dailyRows as { created_at: string }[] | null) ?? []).map((r) =>
    r.created_at.slice(0, 10)
  );
  const checkinStreak = computeStreak(dailyDates, new Date().toISOString().slice(0, 10));

  const achievements = computeAchievements({
    total: stats.total,
    won: stats.won,
    hitRate: stats.hitRate,
    biggestPayout,
    checkinStreak,
    balance,
  });

  // 任务 3：最近已结算注单 + 连胜（按 kickoff 排序——批量补结算时 settled_at 相同，不可作序）
  const { data: settledRaw } = await db
    .from("bets")
    .select(
      "id, status, payout, total_stake, total_multiplier, type, bet_selections(selection:selections(code, market:markets(match:matches(id, kickoff_at, settled_at, home_score, away_score, home:home_team_id(name), away:away_team_id(name)))))"
    )
    .eq("user_id", user.id)
    .in("status", ["won", "lost", "pending"]);
  const settledBets = (settledRaw as unknown as SettledBetRow[] | null) ?? [];

  const enriched = settledBets
    .map((b) => {
      const matchesOfBet = b.bet_selections
        .map((l) => l.selection?.market?.match ?? null)
        .filter((m): m is NonNullable<typeof m> => m !== null);
      if (matchesOfBet.length === 0) return null;
      // 串关：以最晚一腿的开球时间为该注单的"结果时刻"
      const last = matchesOfBet.reduce((a, m) => (m.kickoff_at > a.kickoff_at ? m : a));
      const settledAt = matchesOfBet.reduce<string | null>(
        (a, m) => (m.settled_at && (!a || m.settled_at > a) ? m.settled_at : a),
        null
      );
      return {
        won: b.status === "won",
        status: b.status,
        picks: b.bet_selections
          .map((l) => l.selection?.code ?? "")
          .filter((c): c is string => c.length > 0),
        matchId: last.id,
        kickoff: last.kickoff_at,
        settledAt,
        home: last.home?.name ?? "?",
        away: last.away?.name ?? "?",
        homeScore: last.home_score,
        awayScore: last.away_score,
        multiplier: Number(b.total_multiplier) || 0,
        payout: Number(b.payout ?? 0),
        stake: Number(b.total_stake) || 0,
        legs: matchesOfBet.length,
      } satisfies RecentBet;
    })
    .filter((x): x is RecentBet => x !== null)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));

  // 拆分：已结算（供连胜/分享卡/抽屉，行为不变）与待结算（新增展示用）。
  const settledEnriched = enriched.filter((b) => b.status !== "pending");
  const pendingEnriched = enriched
    .filter((b) => b.status === "pending")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff)); // 待结算按开球先后
  const { streak, bestStreak } = computeWinStreaks(settledEnriched.map((b) => b.won));
  const recent = settledEnriched.slice(-20);

  // 积分明细（最近 40 笔流水，倒序）：reason 类型 + delta 增减 + 时间。
  const { data: ledgerRows } = await db
    .from("points_ledger")
    .select("reason, delta, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(40);
  const ledger = (
    (ledgerRows as { reason: string; delta: number; created_at: string }[] | null) ?? []
  ).map((r) => ({ reason: r.reason, delta: Number(r.delta), at: r.created_at }));

  // emoji 战绩格"击败 N%"：仅全站结算样本 ≥50 时给值（按积分排名近似，两个 head count 查询）
  let beatPct: number | null = null;
  const { count: globalSettled } = await db
    .from("bets")
    .select("id", { count: "exact", head: true })
    .in("status", ["won", "lost"]);
  if ((globalSettled ?? 0) >= 50) {
    const { count: totalPlayers } = await db
      .from("profiles")
      .select("user_id", { count: "exact", head: true });
    const { count: below } = await db
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .lt("points_balance", balance);
    if (totalPlayers && totalPlayers > 1) {
      beatPct = Math.floor(((below ?? 0) / totalPlayers) * 100);
    }
  }

  const tier = rankTier(balance);
  // tierCode 供前端按语言渲染段位名（label 仅中文，保留兼容旧客户端）
  return NextResponse.json({
    balance,
    nickname,
    tier: tier.label,
    tierCode: tier.code,
    ...stats,
    achievements,
    recent,
    pendingPicks: pendingEnriched,
    ledger,
    streak,
    bestStreak,
    globalSettled: globalSettled ?? 0,
    beatPct,
  });
}
