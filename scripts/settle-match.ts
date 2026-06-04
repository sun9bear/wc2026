/**
 * 手动结算一场比赛（管理员工具 / 人工兜底）。
 * 用法：npx tsx scripts/settle-match.ts <matchId> <homeScore> <awayScore>
 * 将来 Plan 3 自动拉取真实比分后，可由定时任务调用同一 settleMatch 逻辑。
 */
import { createClient } from "@supabase/supabase-js";
import { settleMatch } from "../src/lib/settlement/settleMatch";

process.loadEnvFile(".env.local");

async function main(): Promise<void> {
  const [, , matchId, hs, as] = process.argv;
  if (!matchId || hs === undefined || as === undefined) {
    throw new Error("用法：npx tsx scripts/settle-match.ts <matchId> <homeScore> <awayScore>");
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const summary = await settleMatch(sb, matchId, Number(hs), Number(as));
  console.log("✓ 结算完成:", summary);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
