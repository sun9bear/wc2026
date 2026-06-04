/**
 * 从 football-data.org 同步真实赛程到数据库（幂等，非破坏性：先查后插/更新）。
 * 运行：npx tsx scripts/sync-fixtures.ts
 * 前提：已跑 supabase/setup-3-fixtures.sql（matches.external_id）。
 */
import { createClient } from "@supabase/supabase-js";
import { countryFlag } from "../src/lib/football/flag";

process.loadEnvFile(".env.local");

const STAGE: Record<string, string> = {
  GROUP_STAGE: "小组赛",
  LEAGUE_STAGE: "小组赛",
  LAST_32: "32强",
  LAST_16: "16强",
  ROUND_OF_16: "16强",
  QUARTER_FINALS: "8强",
  SEMI_FINALS: "半决赛",
  THIRD_PLACE: "季军赛",
  FINAL: "决赛",
};
function mapStage(s?: string): string {
  return (s && STAGE[s]) || "小组赛";
}
function mapGroup(g?: string | null): string | null {
  if (!g) return null;
  const m = /group[_\s]?([a-l])/i.exec(g);
  return m ? `${m[1].toUpperCase()} 组` : g;
}

interface FdMatch {
  id: number;
  utcDate: string;
  stage?: string;
  group?: string | null;
  homeTeam?: { name: string | null };
  awayTeam?: { name: string | null };
}

async function main(): Promise<void> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
  const key = process.env.FOOTBALL_API_KEY!;

  const { data: tRow } = await sb
    .from("tournaments")
    .select("id")
    .eq("name", "2026 年世界足球大赛")
    .maybeSingle();
  let tid = (tRow as { id: string } | null)?.id;
  if (!tid) {
    const { data } = await sb
      .from("tournaments")
      .insert({ name: "2026 年世界足球大赛", season: "2026", status: "upcoming" })
      .select("id")
      .single();
    tid = (data as { id: string }).id;
  }

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": key },
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const { matches } = (await res.json()) as { matches: FdMatch[] };

  const teamCache = new Map<string, string>();
  async function ensureTeam(name: string, grp: string | null): Promise<string> {
    if (teamCache.has(name)) return teamCache.get(name)!;
    const { data: found } = await sb
      .from("teams")
      .select("id")
      .eq("tournament_id", tid)
      .eq("name", name)
      .maybeSingle();
    let id = (found as { id: string } | null)?.id;
    if (!id) {
      const { data: ins, error } = await sb
        .from("teams")
        .insert({ tournament_id: tid, name, grp, flag: countryFlag(name) })
        .select("id")
        .single();
      if (error) throw error;
      id = (ins as { id: string }).id;
    }
    teamCache.set(name, id);
    return id;
  }

  let n = 0;
  for (const m of matches) {
    if (!m.homeTeam?.name || !m.awayTeam?.name) continue; // 淘汰赛未定队伍，跳过
    const grp = mapGroup(m.group);
    const h = await ensureTeam(m.homeTeam.name, grp);
    const a = await ensureTeam(m.awayTeam.name, grp);
    const row = {
      external_id: m.id,
      tournament_id: tid,
      home_team_id: h,
      away_team_id: a,
      kickoff_at: m.utcDate,
      stage: mapStage(m.stage),
      status: "scheduled",
    };
    const { data: ex } = await sb
      .from("matches")
      .select("id")
      .eq("external_id", m.id)
      .maybeSingle();
    if (ex) {
      const { error } = await sb.from("matches").update(row).eq("id", (ex as { id: string }).id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("matches").insert(row);
      if (error) throw error;
    }
    n++;
  }

  // 清理孤立球队（不被任何比赛引用，例如占位数据残留）
  const { data: ms } = await sb.from("matches").select("home_team_id, away_team_id");
  const used = new Set<string>();
  for (const r of (ms as { home_team_id: string; away_team_id: string }[] | null) ?? []) {
    used.add(r.home_team_id);
    used.add(r.away_team_id);
  }
  const { data: allTeams } = await sb.from("teams").select("id");
  const orphans = ((allTeams as { id: string }[] | null) ?? [])
    .map((t) => t.id)
    .filter((id) => !used.has(id));
  for (const id of orphans) await sb.from("teams").delete().eq("id", id);

  console.log(`✓ 已同步 ${n} 场真实赛程；清理孤立球队 ${orphans.length} 支`);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
