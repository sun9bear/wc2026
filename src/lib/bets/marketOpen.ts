import type { SupabaseClient } from "@supabase/supabase-js";

// 封盘判定（纯函数，可单测）：已结算的盘口、已结算/已开赛的比赛一律封盘。
export function isMarketClosed(params: {
  kickoffAt: string;
  matchStatus: string | null;
  marketStatus: string | null;
  now: number;
}): boolean {
  const { kickoffAt, matchStatus, marketStatus, now } = params;
  if (marketStatus === "settled") return true;
  if (matchStatus === "settled") return true;
  const t = new Date(kickoffAt).getTime();
  if (Number.isNaN(t)) return true; // 时间异常按封盘处理（fail-closed）
  return t <= now;
}

interface MarketRow {
  id: string;
  status: string | null;
  match: { kickoff_at: string; status: string | null } | null;
}

/**
 * 服务端校验给定盘口对应的比赛是否仍可下注。
 * 任一盘口不存在/已封盘/已开赛 → 返回中文错误信息；全部可下注 → 返回 null。
 * 这是下注的安全边界：前端隐藏不够，API 必须自行拦截（H3）。
 */
export async function marketsOpenError(
  db: SupabaseClient,
  marketIds: string[],
  now: number = Date.now()
): Promise<string | null> {
  const { data } = await db
    .from("markets")
    .select("id, status, match:match_id(kickoff_at, status)")
    .in("id", marketIds);
  const rows = (data as unknown as MarketRow[] | null) ?? [];
  if (rows.length !== marketIds.length) return "选项不存在";
  for (const r of rows) {
    if (!r.match) return "比赛信息缺失";
    if (
      isMarketClosed({
        kickoffAt: r.match.kickoff_at,
        matchStatus: r.match.status,
        marketStatus: r.status,
        now,
      })
    ) {
      return "该场已封盘（比赛已开赛或已结束）";
    }
  }
  return null;
}
