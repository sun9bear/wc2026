// 单场「技术统计」懒加载端点：仅当用户在直播看板点「展开技术统计」时调用一次。
// football-data 无技术统计 → 走 API-Football：先用 live=all(70s 缓存)把本场解析成 apisports
// fixture id，再取 /fixtures/statistics(90s 缓存)。任何不可用都返回 {stats:null}，前端隐藏面板。
// 合规：纯赛事统计（控球/射门/角球/犯规/越位），无任何盘口/赔率。

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { getLiveWcFixtures, matchLive } from "@/lib/prob/liveFeed";
import { getMatchStats, type TeamStat } from "@/lib/prob/getMatchStats";

export const dynamic = "force-dynamic";

const LIVE_WINDOW_MIN = 140; // 与 /api/live 一致：开球后 140 分钟内视为可能进行中

interface MatchRow {
  kickoff_at: string;
  status: string | null;
  home: { name: string } | null;
  away: { name: string } | null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const empty = NextResponse.json(
    { stats: null },
    { headers: { "Cache-Control": "no-store" } }
  );
  if (!id) return empty;

  const { data } = await supabase
    .from("matches")
    .select("kickoff_at, status, home:home_team_id(name), away:away_team_id(name)")
    .eq("id", id)
    .maybeSingle();
  const m = data as unknown as MatchRow | null;
  if (!m || !m.home || !m.away) return empty;

  const settled = m.status === "settled";
  const kickoffMs = new Date(m.kickoff_at).getTime();
  const now = Date.now();
  const inWindow = now >= kickoffMs && now <= kickoffMs + LIVE_WINDOW_MIN * 60_000;
  if (settled || !inWindow) return empty;

  // 解析 apisports fixture id（仅主源有技术统计；football-data 兜底无统计 → null）。
  const hit = matchLive(await getLiveWcFixtures(), m.home.name, m.away.name);
  if (!hit || !hit.fx.id) return empty;

  const pair = await getMatchStats(hit.fx.id);
  if (!pair) return empty;

  // apisports 顺序 [主,客] → 按 swapped 映射回库内主客。
  const home: TeamStat = hit.swapped ? pair[1] : pair[0];
  const away: TeamStat = hit.swapped ? pair[0] : pair[1];

  return NextResponse.json(
    { stats: { home, away } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
