import type { SupabaseClient } from "@supabase/supabase-js";
import { settleMatch } from "./settleMatch";

export interface SettledItem {
  id: string;
  home: string; // DB 英文原名（调用方按需转中文）
  away: string;
  hs: number;
  as: number;
}

// 拉取 football-data 已完赛比分 → 给押中的人结算积分。
// 幂等：status=settled 的比赛跳过；可被 cron 路由与流量自驱动结算共用。
export async function runSettlement(
  sb: SupabaseClient,
  footballKey: string
): Promise<SettledItem[]> {
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": footballKey } }
  );
  if (!res.ok) throw new Error(`football-data ${res.status}`);
  const { matches } = (await res.json()) as {
    matches: {
      id: number;
      score?: { fullTime?: { home: number | null; away: number | null } };
    }[];
  };

  const newlySettled: SettledItem[] = [];
  for (const m of matches) {
    const ft = m.score?.fullTime;
    if (ft?.home == null || ft?.away == null) continue;
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
  }
  return newlySettled;
}
