import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePreviewEn, generateSentimentEn, generateRecapEn } from "@/lib/ai/content";
import { latestMatchProbs, upsertContent } from "@/lib/ai/store";
import { stageName } from "@/lib/football/teams";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 英文 AI 内容回填（任务 2，2026-06-13）：Gemini 只在 Vercel 端可调（本机 geo 拦截，勿写本地脚本）。
// 幂等：ai_content 已有该 type 则跳过；每次最多处理 8 场（cron-job.org 每小时触发或手动多 curl 即全量）。
// 覆盖：未开赛 → preview_en + sentiment_en；已结算缺英文小结 → recap_en 补录（settle 路由漏网的）。
const MATCH_CAP = 8;
const DEADLINE_MS = 40000;
const CALL_TIMEOUT_MS = 8000;

interface MatchRow {
  id: string;
  stage: string | null;
  kickoff_at: string;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home: { name: string } | null;
  away: { name: string } | null;
}

export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET 未配置" }, { status: 500 });
  const bearer = req.headers.get("authorization") === `Bearer ${secret}`;
  const plain =
    req.headers.get("cron_secret") === secret || req.headers.get("x-cron-secret") === secret;
  if (!bearer && !plain) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const force = req.nextUrl.searchParams.get("force") === "1"; // ?force=1 覆盖重生（修旧的错误文案）

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SECRET_KEY;
  if (!url || !sk || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  }
  const db = createClient(url, sk);

  const nowIso = new Date().toISOString();
  const SELECT =
    "id, stage, kickoff_at, status, home_score, away_score, home:home_team_id(name), away:away_team_id(name)";

  // 候选：最近的未开赛场次（按开球时间升序——先覆盖马上要踢的）+ 已结算缺 recap_en 的场次
  const { data: upRows } = await db
    .from("matches")
    .select(SELECT)
    .gt("kickoff_at", nowIso)
    .neq("status", "settled")
    .order("kickoff_at", { ascending: true })
    .limit(40);
  const { data: doneRows } = await db
    .from("matches")
    .select(SELECT)
    .eq("status", "settled")
    .order("kickoff_at", { ascending: false })
    .limit(40);
  const upcoming = (upRows as unknown as MatchRow[] | null) ?? [];
  const settled = (doneRows as unknown as MatchRow[] | null) ?? [];
  // 模型胜平负概率（喂给前瞻/冷热门，确保倾向与真实概率一致）。
  const probMap = await latestMatchProbs(db, upcoming.map((m) => m.id));

  const allIds = [...upcoming, ...settled].map((m) => m.id);
  const { data: acRows } = await db
    .from("ai_content")
    .select("match_id, type")
    .in("match_id", allIds.length ? allIds : ["00000000-0000-0000-0000-000000000000"])
    .in("type", ["preview_en", "sentiment_en", "recap_en"]);
  const have = new Set(
    ((acRows as { match_id: string; type: string }[] | null) ?? []).map(
      (r) => `${r.match_id}:${r.type}`
    )
  );

  let processed = 0;
  const generated = { preview_en: 0, sentiment_en: 0, recap_en: 0 };
  const overBudget = () => Date.now() - t0 > DEADLINE_MS;

  // 未开赛：preview_en + sentiment_en
  for (const m of upcoming) {
    if (processed >= MATCH_CAP || overBudget()) break;
    const home = m.home?.name;
    const away = m.away?.name;
    if (!home || !away) continue;
    const needPreview = force || !have.has(`${m.id}:preview_en`);
    const needSentiment = force || !have.has(`${m.id}:sentiment_en`);
    if (!needPreview && !needSentiment) continue;
    processed++;

    if (needPreview && !overBudget()) {
      try {
        const stage = stageName(m.stage ?? "Group Stage", "en");
        const body = await generatePreviewEn(home, away, stage, probMap.get(m.id));
        await upsertContent(db, m.id, "preview_en", body);
        generated.preview_en++;
      } catch {
        /* 单场失败不阻塞批次 */
      }
    }

    if (needSentiment && !overBudget()) {
      try {
        // 以模型概率为锚（替代社区 pooled_stake——生成时常为空/默认，会把热门冷门判反）。
        const probs = probMap.get(m.id);
        if (probs) {
          const body = await generateSentimentEn(home, away, probs);
          await upsertContent(db, m.id, "sentiment_en", body);
          generated.sentiment_en++;
        }
      } catch {
        /* 单场失败不阻塞批次 */
      }
    }
  }

  // 已结算：recap_en 补录（settle 路由预算内没排上的）
  for (const m of settled) {
    if (processed >= MATCH_CAP || overBudget()) break;
    const home = m.home?.name;
    const away = m.away?.name;
    if (!home || !away || m.home_score == null || m.away_score == null) continue;
    if (!force && have.has(`${m.id}:recap_en`)) continue;
    processed++;
    try {
      const body = await generateRecapEn(home, away, m.home_score, m.away_score, CALL_TIMEOUT_MS);
      await upsertContent(db, m.id, "recap_en", body);
      generated.recap_en++;
    } catch {
      /* 单场失败不阻塞批次 */
    }
  }

  // remaining = 本批没排上的候选数（粗略值，供运营判断还要 curl 几次）
  const remaining =
    upcoming.filter(
      (m) => !have.has(`${m.id}:preview_en`) || !have.has(`${m.id}:sentiment_en`)
    ).length +
    settled.filter((m) => !have.has(`${m.id}:recap_en`)).length -
    processed;

  return NextResponse.json({ ok: true, processed, generated, remaining: Math.max(0, remaining) });
}
