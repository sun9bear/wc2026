import { supabase } from "@/lib/supabase/client";

export interface SelectionView {
  id: string;
  code: string;
  label: string;
  multiplier: number;
}

export interface MatchDetail {
  id: string;
  stage: string | null;
  kickoffAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  home: { name: string; flag: string | null };
  away: { name: string; flag: string | null };
  market: { id: string; selections: SelectionView[] } | null;
  preview: string | null;
  recap: string | null;
  sentiment: string | null;
}

interface MatchRow {
  id: string;
  stage: string | null;
  kickoff_at: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { name: string; flag: string | null } | null;
  away: { name: string; flag: string | null } | null;
}
interface SelRow {
  id: string;
  code: string;
  label: string;
  current_multiplier: number;
}

const ORDER: Record<string, number> = { home: 0, draw: 1, away: 2 };

export async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  const { data: matchData } = await supabase
    .from("matches")
    .select(
      "id, stage, kickoff_at, status, home_score, away_score, home:home_team_id(name, flag), away:away_team_id(name, flag)"
    )
    .eq("id", matchId)
    .maybeSingle();

  const m = matchData as unknown as MatchRow | null;
  if (!m) return null;

  const { data: marketData } = await supabase
    .from("markets")
    .select("id")
    .eq("match_id", matchId)
    .eq("type", "1x2")
    .maybeSingle();

  let market: MatchDetail["market"] = null;
  const mk = marketData as { id: string } | null;
  if (mk) {
    const { data: selData } = await supabase
      .from("selections")
      .select("id, code, label, current_multiplier")
      .eq("market_id", mk.id);
    const sels = (selData as unknown as SelRow[] | null) ?? [];
    market = {
      id: mk.id,
      selections: sels
        .map((s) => ({
          id: s.id,
          code: s.code,
          label: s.label,
          multiplier: Number(s.current_multiplier),
        }))
        .sort((a, b) => (ORDER[a.code] ?? 9) - (ORDER[b.code] ?? 9)),
    };
  }

  const { data: acRows } = await supabase
    .from("ai_content")
    .select("type, body")
    .eq("match_id", matchId);
  const ac = (acRows as { type: string; body: string }[] | null) ?? [];
  const byType = (t: string) => ac.find((r) => r.type === t)?.body ?? null;

  return {
    id: m.id,
    stage: m.stage,
    kickoffAt: m.kickoff_at,
    status: m.status ?? "scheduled",
    homeScore: m.home_score,
    awayScore: m.away_score,
    home: { name: m.home?.name ?? "?", flag: m.home?.flag ?? "⚽" },
    away: { name: m.away?.name ?? "?", flag: m.away?.flag ?? "⚽" },
    market,
    preview: byType("preview"),
    recap: byType("recap"),
    sentiment: byType("sentiment"),
  };
}
