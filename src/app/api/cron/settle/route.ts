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
  const t0 = Date.now();
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

  // 阶段一：先把所有比赛结算完（纯数据库、快、幂等）——结算绝不依赖任何 LLM 调用。
  const newlySettled: { id: string; home: string; away: string; hs: number; as: number }[] = [];
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
      home: teamZh(match.home?.name ?? "?"),
      away: teamZh(match.away?.name ?? "?"),
      hs: ft.home,
      as: ft.away,
    });
  }
  const settled = newlySettled.length;

  // 阶段二：结算已全部落库后，再尽力而为生成赛后小结。
  // 用「整体时间预算(相对 t0) + 更短单次超时」严格约束在 maxDuration(60s) 内返回：
  //   最坏 = 预算 40s 内停止启动新调用，最后一次 ≤ 8s×2(可能重试) → ≈56s < 60s。
  //   未完成的（被预算/上限/失败卡住）一律留给 `scripts/gen-recaps.ts` 补录，绝不影响已落库的结算。
  const RECAP_CAP = 8;
  const RECAP_DEADLINE_MS = 40000;
  const RECAP_CALL_TIMEOUT_MS = 8000;
  let recaps = 0;
  for (const s of newlySettled.slice(0, RECAP_CAP)) {
    if (Date.now() - t0 > RECAP_DEADLINE_MS) break;
    try {
      const body = await generateRecap(s.home, s.away, s.hs, s.as, RECAP_CALL_TIMEOUT_MS);
      await upsertContent(sb, s.id, "recap", body);
      recaps++;
    } catch {
      /* 忽略 AI 失败/超时 */
    }
  }

  return NextResponse.json({
    ok: true,
    settled,
    recaps,
    recapsDeferred: Math.max(0, settled - recaps),
  });
}
