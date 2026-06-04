import { supabase } from "@/lib/supabase/client";
import { FIXTURES, type FixtureMatch } from "@/lib/fixtures/matches";

interface Row {
  id: string;
  kickoff_at: string;
  stage: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { name: string; flag: string | null; grp: string | null } | null;
  away: { name: string; flag: string | null } | null;
}

// 读取比赛：优先从 Supabase（HTTPS/PostgREST）读；失败或为空则回退本地占位赛程。
export async function getMatches(): Promise<FixtureMatch[]> {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "id, kickoff_at, stage, status, home_score, away_score, home:home_team_id(name, flag, grp), away:away_team_id(name, flag)"
      )
      .order("kickoff_at")
      .returns<Row[]>();

    if (error || !data || data.length === 0) return fallback();

    return data.map((r) => ({
      id: r.id,
      stage: r.stage ?? "",
      group: r.home?.grp ?? undefined,
      kickoffAt: r.kickoff_at,
      home: { name: r.home?.name ?? "?", flag: r.home?.flag ?? "⚽" },
      away: { name: r.away?.name ?? "?", flag: r.away?.flag ?? "⚽" },
      status: r.status ?? "scheduled",
      homeScore: r.home_score,
      awayScore: r.away_score,
    }));
  } catch {
    return fallback();
  }
}

function fallback(): FixtureMatch[] {
  return [...FIXTURES].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}
