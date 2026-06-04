/**
 * 集成验证串关：造一个 2 串注单 → 分别结算两场 → 校验"全中才赢、连乘派分"→ 清理。
 * 运行：npx tsx scripts/test-parlay.ts
 */
import { createClient } from "@supabase/supabase-js";
import { settleMatch } from "../src/lib/settlement/settleMatch";

process.loadEnvFile(".env.local");

const TEST_USER = "00000000-0000-0000-0000-0000000000bb";

async function main(): Promise<void> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  const { data: markets } = await sb.from("markets").select("id, match_id").eq("type", "1x2").limit(2);
  const ms = markets as { id: string; match_id: string }[];
  if (ms.length < 2) throw new Error("盘口不足 2 个");
  const homeSel: { id: string; market_id: string }[] = [];
  for (const m of ms) {
    const { data: sels } = await sb.from("selections").select("id, code").eq("market_id", m.id);
    const home = (sels as { id: string; code: string }[]).find((s) => s.code === "home")!;
    homeSel.push({ id: home.id, market_id: m.id });
  }

  // 造 2 串：押两场主胜，投入 100，连乘 3×3=9（余额 1000→900）
  await sb.from("profiles").upsert({ user_id: TEST_USER, points_balance: 900 });
  const { data: bet } = await sb
    .from("bets")
    .insert({ user_id: TEST_USER, type: "parlay", total_stake: 100, total_multiplier: 9, status: "pending" })
    .select("id")
    .single();
  const betId = (bet as { id: string }).id;
  await sb.from("bet_selections").insert(
    homeSel.map((s) => ({ bet_id: betId, selection_id: s.id, multiplier_at_bet: 3 }))
  );
  console.log("已造 2 串注单：两场主胜，投入 100，连乘 9");

  // 结算第一场（主胜）→ 注单应仍挂起
  await settleMatch(sb, ms[0].match_id, 2, 1);
  let { data: after1 } = await sb.from("bets").select("status, payout").eq("id", betId).single();
  console.log("结算第 1 场后：", after1, "（应 pending）");

  // 结算第二场（主胜）→ 全中 → 赢，派分 100×9=900，余额 900→1800
  await settleMatch(sb, ms[1].match_id, 3, 0);
  const { data: after2 } = await sb.from("bets").select("status, payout").eq("id", betId).single();
  const { data: prof } = await sb.from("profiles").select("points_balance").eq("user_id", TEST_USER).single();
  console.log("结算第 2 场后：", after2, "余额：", (prof as { points_balance: number }).points_balance);
  console.log("预期：status=won, payout=900, 余额=1800");

  // 清理
  await sb.from("bet_selections").delete().eq("bet_id", betId);
  await sb.from("bets").delete().eq("id", betId);
  await sb.from("points_ledger").delete().eq("user_id", TEST_USER);
  await sb.from("profiles").delete().eq("user_id", TEST_USER);
  for (const m of ms) {
    await sb.from("markets").update({ status: "open" }).eq("id", m.id);
    await sb
      .from("matches")
      .update({ status: "scheduled", home_score: null, away_score: null, settled_at: null })
      .eq("id", m.match_id);
  }
  console.log("✓ 已清理测试数据");
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
