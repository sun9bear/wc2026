import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { settleMatch } from "@/lib/settlement/settleMatch";
import { generateRecap } from "@/lib/ai/content";
import { upsertContent } from "@/lib/ai/store";
import { teamZh } from "@/lib/football/teams";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface FdMatch {
  id: number;
  score?: { fullTime?: { home: number | null; away: number | null } };
}

// 定时自动结算：拉取已结束比赛比分 → 给押中的人派分。
// 受 CRON_SECRET 保护：Vercel Cron 会自动带 Authorization: Bearer <CRON_SECRET>；
// 外部定时服务（cron-job.org 等）也用同一密钥调用即可。
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET 未配置" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = process.env.FOOTBALL_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SECRET_KEY;
  if (!key || !url || !sk) {
    return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  }

  const sb = createClient(url, sk);
  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED",
    { headers: { "X-Auth-Token": key } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: `football-data ${res.status}` }, { status: 502 });
  }
  const { matches } = (await res.json()) as { matches: FdMatch[] };

  let settled = 0;
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
    // 赛后小结：DeepSeek 生成 + 入库，尽力而为，失败不影响结算
    try {
      const body = await generateRecap(
        teamZh(match.home?.name ?? "?"),
        teamZh(match.away?.name ?? "?"),
        ft.home,
        ft.away
      );
      await upsertContent(sb, match.id, "recap", body);
    } catch {
      /* 忽略 AI 失败 */
    }
    settled++;
  }

  return NextResponse.json({ ok: true, settled });
}
