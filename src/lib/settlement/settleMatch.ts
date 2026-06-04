import type { SupabaseClient } from "@supabase/supabase-js";
import { result1x2 } from "./result";

export interface SettleSummary {
  winningCode: string;
  betsSettled: number;
  winners: number;
  totalPaid: number;
}

interface SelRow {
  id: string;
  code: string;
}
interface LegRow {
  id: string;
  bet_id: string;
  selection_id: string;
}
interface AllLegRow {
  multiplier_at_bet: number;
  leg_status: string;
}
interface BetRow {
  id: string;
  user_id: string;
  total_stake: number;
  status: string;
}

/**
 * 结算一场比赛的 1x2 盘口（服务端，service_role）。按"腿"判定，单关/串关通用：
 *  - 先把本场涉及的每条腿标记 won/lost；
 *  - 再重评每个受影响注单：任一腿负→输；全部腿胜→赢（派分 = 投入 × 各腿锁定倍率连乘）；
 *    仍有未决腿（串关里别的比赛没结束）→ 保持挂起。
 * MVP 顺序写入，非单事务；幂等（已结算注单跳过）。
 */
export async function settleMatch(
  db: SupabaseClient,
  matchId: string,
  homeScore: number,
  awayScore: number
): Promise<SettleSummary> {
  const winningCode = result1x2(homeScore, awayScore);

  const { data: marketRow } = await db
    .from("markets")
    .select("id")
    .eq("match_id", matchId)
    .eq("type", "1x2")
    .maybeSingle();
  const market = marketRow as { id: string } | null;
  if (!market) throw new Error("该场无 1x2 盘口");

  const { data: selData } = await db.from("selections").select("id, code").eq("market_id", market.id);
  const selections = (selData as SelRow[] | null) ?? [];
  const winningSelId = selections.find((s) => s.code === winningCode)?.id ?? null;
  const selIds = selections.map((s) => s.id);

  const { data: legData } = await db
    .from("bet_selections")
    .select("id, bet_id, selection_id")
    .in("selection_id", selIds);
  const legs = (legData as LegRow[] | null) ?? [];

  // 1) 标记本场每条腿
  for (const leg of legs) {
    await db
      .from("bet_selections")
      .update({ leg_status: leg.selection_id === winningSelId ? "won" : "lost" })
      .eq("id", leg.id);
  }

  // 2) 重评受影响注单
  const betIds = [...new Set(legs.map((l) => l.bet_id))];
  let betsSettled = 0;
  let winners = 0;
  let totalPaid = 0;

  for (const betId of betIds) {
    const { data: betRow } = await db
      .from("bets")
      .select("id, user_id, total_stake, status")
      .eq("id", betId)
      .maybeSingle();
    const bet = betRow as BetRow | null;
    if (!bet || bet.status !== "pending") continue;

    const { data: allLegData } = await db
      .from("bet_selections")
      .select("multiplier_at_bet, leg_status")
      .eq("bet_id", betId);
    const allLegs = (allLegData as AllLegRow[] | null) ?? [];

    if (allLegs.some((l) => l.leg_status === "lost")) {
      await db.from("bets").update({ status: "lost", payout: 0 }).eq("id", betId);
      betsSettled++;
    } else if (allLegs.length > 0 && allLegs.every((l) => l.leg_status === "won")) {
      const combined = allLegs.reduce((p, l) => p * Number(l.multiplier_at_bet), 1);
      const payout = Math.round(Number(bet.total_stake) * combined);
      await db.from("bets").update({ status: "won", payout }).eq("id", betId);
      const { data: prof } = await db
        .from("profiles")
        .select("points_balance")
        .eq("user_id", bet.user_id)
        .maybeSingle();
      const bal = (prof as { points_balance: number } | null)?.points_balance ?? 0;
      await db
        .from("points_ledger")
        .insert({ user_id: bet.user_id, delta: payout, reason: "bet_payout", ref_id: betId });
      await db.from("profiles").update({ points_balance: bal + payout }).eq("user_id", bet.user_id);
      winners++;
      totalPaid += payout;
      betsSettled++;
    }
    // else: 仍有未决腿 → 保持挂起
  }

  await db.from("markets").update({ status: "settled" }).eq("id", market.id);
  await db
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "settled",
      settled_at: new Date().toISOString(),
    })
    .eq("id", matchId);

  return { winningCode, betsSettled, winners, totalPaid };
}
