/**
 * 集成验证结算：造一个测试预测 → 结算 → 校验派分/余额 → 清理。
 * 运行：npx tsx scripts/test-settle.ts
 */
import { createClient } from "@supabase/supabase-js";
import { settleMatch } from "../src/lib/settlement/settleMatch";

process.loadEnvFile(".env.local");

const TEST_USER = "00000000-0000-0000-0000-0000000000aa";

async function main(): Promise<void> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { data: market } = await sb
    .from("markets")
    .select("id, match_id")
    .eq("type", "1x2")
    .limit(1)
    .single();
  const m = market as { id: string; match_id: string };
  const { data: sels } = await sb.from("selections").select("id, code").eq("market_id", m.id);
  const home = (sels as { id: string; code: string }[]).find((s) => s.code === "home")!;

  // 造测试预测：押主胜，投入 100，锁定倍率 3（余额从 1000 扣到 900）
  await sb.from("profiles").upsert({ user_id: TEST_USER, points_balance: 900 });
  const { data: bet } = await sb
    .from("bets")
    .insert({ user_id: TEST_USER, type: "single", total_stake: 100, total_multiplier: 3, status: "pending" })
    .select("id")
    .single();
  const betId = (bet as { id: string }).id;
  await sb.from("bet_selections").insert({ bet_id: betId, selection_id: home.id, multiplier_at_bet: 3 });
  console.log("已造测试预测：押主胜 100，余额 900");

  // 结算：主队 2:1 胜 → 押中
  const summary = await settleMatch(sb, m.match_id, 2, 1);
  console.log("结算结果:", summary);

  const { data: prof } = await sb
    .from("profiles")
    .select("points_balance")
    .eq("user_id", TEST_USER)
    .single();
  const { data: betAfter } = await sb.from("bets").select("status, payout").eq("id", betId).single();
  console.log("结算后 → 余额:", (prof as { points_balance: number }).points_balance, "预测:", betAfter);
  console.log("预期：余额 1200（900+300），预测 won，派分 300");

  // 清理
  await sb.from("bet_selections").delete().eq("bet_id", betId);
  await sb.from("bets").delete().eq("id", betId);
  await sb.from("points_ledger").delete().eq("user_id", TEST_USER);
  await sb.from("profiles").delete().eq("user_id", TEST_USER);
  await sb.from("markets").update({ status: "open" }).eq("id", m.id);
  await sb
    .from("matches")
    .update({ status: "scheduled", home_score: null, away_score: null, settled_at: null })
    .eq("id", m.match_id);
  console.log("✓ 已清理测试数据");
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
