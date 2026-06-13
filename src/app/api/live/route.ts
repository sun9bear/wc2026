// 单场实时比分概率端点：客户端 ~30s 轮询。
// 仅当比赛在直播窗口内且 API-Football live=all 命中本场时返回实时最终比分分布；
// 否则 {live:false}，前端回退赛前分布。λ 由最新赛前快照 1X2 反推（无需新增字段）。

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { lambdasFrom1x2, liveScoreline } from "@/lib/prob/poisson";
import { getLiveWcFixtures, matchLive } from "@/lib/prob/liveFeed";

export const dynamic = "force-dynamic";

const LIVE_WINDOW_MIN = 140; // 开球后 140 分钟内视为可能进行中（含加时/补时余量）

interface MatchRow {
  kickoff_at: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { name: string } | null;
  away: { name: string } | null;
}
interface SnapRow {
  p_home: number | string;
  p_draw: number | string;
  p_away: number | string;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const off = NextResponse.json({ live: false }, { headers: { "Cache-Control": "no-store" } });
  if (!id) return off;

  // 1) 比赛基本信息 + 直播窗口判断
  const { data } = await supabase
    .from("matches")
    .select(
      "kickoff_at, status, home_score, away_score, home:home_team_id(name), away:away_team_id(name)"
    )
    .eq("id", id)
    .maybeSingle();
  const m = data as unknown as MatchRow | null;
  if (!m || !m.home || !m.away) return off;

  const settled = m.status === "settled" && m.home_score != null && m.away_score != null;
  const kickoffMs = new Date(m.kickoff_at).getTime();
  const now = Date.now();
  const inWindow = now >= kickoffMs && now <= kickoffMs + LIVE_WINDOW_MIN * 60_000;
  if (settled || !inWindow) return off;

  // 2) 当前直播命中？
  const fixtures = await getLiveWcFixtures();
  const hit = matchLive(fixtures, m.home.name, m.away.name);
  if (!hit) return off;
  const hNow = hit.swapped ? hit.fx.aNow : hit.fx.hNow;
  const aNow = hit.swapped ? hit.fx.hNow : hit.fx.aNow;
  const minute = hit.fx.minute;

  // 3) 最新赛前快照 1X2 → 反推 λ → in-play 最终比分分布
  const { data: snap } = await supabase
    .from("prob_match_snapshots")
    .select("p_home, p_draw, p_away")
    .eq("match_id", id)
    .order("created_at", { ascending: false })
    .limit(1);
  const s = (snap as SnapRow[] | null)?.[0];
  if (!s) return off;
  const target = { home: Number(s.p_home), draw: Number(s.p_draw), away: Number(s.p_away) };
  const lam = lambdasFrom1x2(target);
  const live = liveScoreline(lam.home, lam.away, hNow, aNow, minute);

  return NextResponse.json(
    { live: true, score: { h: hNow, a: aNow }, minute, short: hit.fx.short, top: live.top, p: live.p },
    { headers: { "Cache-Control": "no-store" } }
  );
}
