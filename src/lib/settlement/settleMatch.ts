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
interface BetSelRow {
  id: string;
  bet_id: string;
  selection_id: string;
  multiplier_at_bet: number;
}
interface BetRow {
  id: string;
  user_id: string;
  total_stake: number;
  status: string;
}

/**
 * 结算一场比赛的 1x2 盘口（服务端，service_role）。
 * 命中派分 = 投入 × 锁定倍率；更新 bets/积分流水/余额，并标记盘口与比赛已结算。
 * 注：当前只处理单场预测；串关(parlay)后续支持。MVP 顺序写入，非单事务。
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

  const { data: selData } = await db
    .from("selections")
    .select("id, code")
    .eq("market_id", market.id);
  const selections = (selData as SelRow[] | null) ?? [];
  const winningSelId = selections.find((s) => s.code === winningCode)?.id ?? null;
  const selIds = selections.map((s) => s.id);

  const { data: bsData } = await db
    .from("bet_selections")
    .select("id, bet_id, selection_id, multiplier_at_bet")
    .in("selection_id", selIds);
  const betSelections = (bsData as BetSelRow[] | null) ?? [];

  let betsSettled = 0;
  let winners = 0;
  let totalPaid = 0;

  for (const bs of betSelections) {
    const { data: betData } = await db
      .from("bets")
      .select("id, user_id, total_stake, status")
      .eq("id", bs.bet_id)
      .maybeSingle();
    const bet = betData as BetRow | null;
    if (!bet || bet.status !== "pending") continue;

    const won = bs.selection_id === winningSelId;
    const payout = won ? Math.round(Number(bet.total_stake) * Number(bs.multiplier_at_bet)) : 0;

    await db.from("bets").update({ status: won ? "won" : "lost", payout }).eq("id", bet.id);
    await db.from("bet_selections").update({ leg_status: won ? "won" : "lost" }).eq("id", bs.id);

    if (won && payout > 0) {
      await db
        .from("points_ledger")
        .insert({ user_id: bet.user_id, delta: payout, reason: "bet_payout", ref_id: bet.id });
      const { data: profRow } = await db
        .from("profiles")
        .select("points_balance")
        .eq("user_id", bet.user_id)
        .maybeSingle();
      const bal = (profRow as { points_balance: number } | null)?.points_balance ?? 0;
      await db.from("profiles").update({ points_balance: bal + payout }).eq("user_id", bet.user_id);
      winners++;
      totalPaid += payout;
    }
    betsSettled++;
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
