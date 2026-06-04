/**
 * 拉取已结束的比赛比分并自动结算（幂等：已结算的跳过）。
 * 运行：npx tsx scripts/sync-results.ts
 * 将来部署后由定时任务（如 Vercel Cron）周期调用。
 */
import { createClient } from "@supabase/supabase-js";
import { settleMatch } from "../src/lib/settlement/settleMatch";

process.loadEnvFile(".env.local");

interface FdMatch {
  id: number;
  homeTeam?: { name: string | null };
  awayTeam?: { name: string | null };
  score?: { fullTime?: { home: number | null; away: number | null } };
}

async function main(): Promise<void> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const key = process.env.FOOTBALL_API_KEY!;

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": key } }
  );
  if (!res.ok) throw new Error(`API ${res.status}`);
  const { matches } = (await res.json()) as { matches: FdMatch[] };

  let settled = 0;
  for (const m of matches) {
    const ft = m.score?.fullTime;
    if (ft?.home == null || ft?.away == null) continue;
    const { data: row } = await sb
      .from("matches")
      .select("id, status")
      .eq("external_id", m.id)
      .maybeSingle();
    const match = row as { id: string; status: string } | null;
    if (!match || match.status === "settled") continue;

    const summary = await settleMatch(sb, match.id, ft.home, ft.away);
    console.log(
      `结算 ${m.homeTeam?.name} ${ft.home}:${ft.away} ${m.awayTeam?.name} →`,
      summary
    );
    settled++;
  }
  console.log(`✓ 本次自动结算 ${settled} 场`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
