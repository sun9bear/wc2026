/**
 * 全量重置游戏状态（清空所有预测/积分/档案，市场与赛程恢复初始）。
 * ⚠️ 会删除所有用户数据——仅在没有真实用户（测试阶段）时使用。
 * 运行：npx tsx scripts/reset-all.ts
 */
import { createClient } from "@supabase/supabase-js";
import { computeMultipliers } from "../src/lib/odds/pooledOdds";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

  await sb.from("bet_selections").delete().not("id", "is", null);
  await sb.from("bets").delete().not("id", "is", null);
  await sb.from("points_ledger").delete().not("id", "is", null);
  await sb.from("profiles").delete().not("user_id", "is", null);

  const m3 = computeMultipliers([0, 0, 0])[0];
  await sb.from("selections").update({ pooled_stake: 0, current_multiplier: m3 }).not("id", "is", null);
  await sb.from("markets").update({ status: "open" }).not("id", "is", null);
  await sb
    .from("matches")
    .update({ status: "scheduled", home_score: null, away_score: null, settled_at: null })
    .not("id", "is", null);

  console.log("✓ 全量重置完成：预测/积分/档案已清空，市场与赛程恢复初始（倍率 3.00）");
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
