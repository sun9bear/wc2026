/**
 * 重置所有选项的池与倍率为初始（0 / 3.00），用于清理测试或重新开盘。
 * 运行：npx tsx scripts/reset-pools.ts
 */
import { createClient } from "@supabase/supabase-js";
import { computeMultipliers } from "../src/lib/odds/pooledOdds";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SECRET_KEY!;
  const sb = createClient(url, key);

  const init = computeMultipliers([0, 0, 0])[0]; // 3
  const { error } = await sb
    .from("selections")
    .update({ pooled_stake: 0, current_multiplier: init })
    .not("id", "is", null); // 匹配所有行
  if (error) throw error;
  console.log(`✓ 已重置所有选项：pooled_stake=0, 倍率=${init}`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
