import { createClient } from "@supabase/supabase-js";
import { runSettlement } from "./runSettlement";

// 流量自驱动结算：作为外部定时（cron-job.org 每 5 分钟打 /api/cron/settle）之外的兜底，
// 借页面流量补频——每个实例 5 分钟最多尝试一次，且仅当存在"开赛已近 2 小时仍未结算"的
// 比赛时才请求上游（football-data 免费档 10 req/min、升级档 20 req/min，均安全）。
// 经 next/server 的 after() 在响应后调用，绝不拖慢页面；失败静默（下一次流量再试）。
let lastAttempt = 0;
const THROTTLE_MS = 5 * 60 * 1000;
const MATCH_MIN_AGE_MS = 115 * 60 * 1000; // 常规时间+中场+补时 ≈ 110 分钟

export async function maybeAutoSettle(): Promise<void> {
  const now = Date.now();
  if (now - lastAttempt < THROTTLE_MS) return;
  lastAttempt = now;
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sk = process.env.SUPABASE_SECRET_KEY;
    const key = process.env.FOOTBALL_API_KEY;
    if (!url || !sk || !key) return;
    const sb = createClient(url, sk);
    const cutoff = new Date(now - MATCH_MIN_AGE_MS).toISOString();
    const { data } = await sb
      .from("matches")
      .select("id")
      .neq("status", "settled")
      .lt("kickoff_at", cutoff)
      .limit(1);
    if (!data || data.length === 0) return;
    await runSettlement(sb, key);
  } catch {
    /* 静默：自动结算失败不影响页面，等下次流量或每日 cron */
  }
}
