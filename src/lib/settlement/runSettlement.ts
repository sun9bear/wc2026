import type { SupabaseClient } from "@supabase/supabase-js";
import { settleMatch } from "./settleMatch";

export interface SettledItem {
  id: string;
  home: string; // DB 英文原名（调用方按需转中文）
  away: string;
  hs: number;
  as: number;
}

interface FdResponse {
  matches: {
    id: number;
    score?: { fullTime?: { home: number | null; away: number | null } };
  }[];
}

// football-data 拉取：加 8s 超时 + 最多 3 次重试（0.6s/1.2s 退避）。
// 修复根因：原来无超时/无重试，football-data 一次瞬时抖动（网络/429/5xx）就 throw →
// cron 路由返回 502 + 这一轮结算空窗 5 分钟。重试让瞬时故障在同次调用内自愈；
// 仅当持续失败（真故障）才抛出 → cron 路由仍 502 → 监控告警（该告的还告）。
// cache:"no-store" 确保读到最新已完赛比分（结算绝不能吃缓存）。
async function fetchFinishedMatches(footballKey: string): Promise<FdResponse> {
  const URL =
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED";
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(URL, {
        headers: { "X-Auth-Token": footballKey },
        signal: ctrl.signal,
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`football-data ${res.status}`);
      return (await res.json()) as FdResponse;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 600));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("football-data fetch failed");
}

// 拉取 football-data 已完赛比分 → 给押中的人结算积分。
// 幂等：status=settled 的比赛跳过；可被 cron 路由与流量自驱动结算共用。
// 单场结算失败（瞬时 DB 抖动等）只记日志、不阻断整批——下一轮 cron 幂等补结算。
export async function runSettlement(
  sb: SupabaseClient,
  footballKey: string
): Promise<SettledItem[]> {
  const { matches } = await fetchFinishedMatches(footballKey);

  const newlySettled: SettledItem[] = [];
  for (const m of matches) {
    const ft = m.score?.fullTime;
    if (ft?.home == null || ft?.away == null) continue;
    try {
      const { data: row } = await sb
        .from("matches")
        .select("id, status, home:home_team_id(name), away:away_team_id(name)")
        .eq("external_id", m.id)
        .maybeSingle();
      const match = row as {
        id: string;
        status: string;
        home: { name: string } | null;
        away: { name: string } | null;
      } | null;
      if (!match || match.status === "settled") continue;
      await settleMatch(sb, match.id, ft.home, ft.away);
      newlySettled.push({
        id: match.id,
        home: match.home?.name ?? "?",
        away: match.away?.name ?? "?",
        hs: ft.home,
        as: ft.away,
      });
    } catch (e) {
      // 单场失败不阻断整批；幂等，下轮补结算。
      console.error(`[settle] match external_id=${m.id} failed:`, e);
    }
  }
  return newlySettled;
}
