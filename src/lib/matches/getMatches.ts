import { supabase } from "@/lib/supabase/client";
import { FIXTURES, type FixtureMatch } from "@/lib/fixtures/matches";

interface Row {
  id: string;
  kickoff_at: string;
  stage: string | null;
  home: { name: string; flag: string | null; grp: string | null } | null;
  away: { name: string; flag: string | null } | null;
}

// 读取比赛：优先从 Supabase（HTTPS/PostgREST）读；失败或为空则回退本地占位赛程，
// 保证无论数据库是否就绪，页面都能渲染。
export async function getMatches(): Promise<FixtureMatch[]> {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "id, kickoff_at, stage, home:home_team_id(name, flag, grp), away:away_team_id(name, flag)"
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
    }));
  } catch {
    return fallback();
  }
}

function fallback(): FixtureMatch[] {
  return [...FIXTURES].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}
