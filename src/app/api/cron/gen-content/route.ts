import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePreviewEn, generateSentimentEn, generateRecapEn } from "@/lib/ai/content";
import { latestMatchProbs, upsertContent } from "@/lib/ai/store";
import { stageName } from "@/lib/football/teams";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 英文 AI 内容回填（任务 2，2026-06-13）：Gemini 只在 Vercel 端可调（本机 geo 拦截，勿写本地脚本）。
// 限流（flash-lite 免费档 15 RPM / 500 RPD）：每次最多 6 场（≤12 次调用，留 RPM 余量）；
//   调用方两次间隔 ≥60s 即可全量刷新不撞 RPM。日额度 500 充裕。
// 覆盖：未开赛 → preview_en + sentiment_en；已结算缺英文小结 → recap_en。
// 重生：?force=1 全量覆盖（会卡在前 N 场）；?staleBefore=<ISO> 只重生该时刻前生成的旧文案
//   （重生后 updated_at 刷新→后续自动跳过，逐场推进、自然收敛，推荐用它做全量刷新）。
const MATCH_CAP = 6;
const DEADLINE_MS = 50000;
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
  const force = req.nextUrl.searchParams.get("force") === "1"; // ?force=1 覆盖重生（会卡在前 N 场）
  const debug = req.nextUrl.searchParams.get("debug") === "1"; // ?debug=1 在响应里回传被吞掉的错误
  const staleBeforeMs = (() => {
    const s = req.nextUrl.searchParams.get("staleBefore"); // 早于此 ISO 时刻生成的旧文案才重生
    const ms = s ? Date.parse(s) : NaN;
    return Number.isNaN(ms) ? 0 : ms;
  })();
  const errors: string[] = [];
  const noteErr = (where: string, e: unknown) => {
    const msg =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : String(e);
    console.error(`[gen-content] ${where} 失败:`, msg); // 此前 catch 静默——补上日志（可观测性）
    if (debug && errors.length < 6) errors.push(`${where}: ${msg}`);
  };

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
    .limit(120); // 覆盖全部未开赛场次（之前 40 截断，靠后的场次永远拿不到英文）
  const { data: doneRows } = await db
    .from("matches")
    .select(SELECT)
    .eq("status", "settled")
    .order("kickoff_at", { ascending: false })
    .limit(60);
  const upcoming = (upRows as unknown as MatchRow[] | null) ?? [];
  const settled = (doneRows as unknown as MatchRow[] | null) ?? [];
  // 模型胜平负概率（喂给前瞻/冷热门，确保倾向与真实概率一致）。
  const probMap = await latestMatchProbs(db, upcoming.map((m) => m.id));

  const allIds = [...upcoming, ...settled].map((m) => m.id);
  const { data: acRows } = await db
    .from("ai_content")
    .select("match_id, type, updated_at")
    .in("match_id", allIds.length ? allIds : ["00000000-0000-0000-0000-000000000000"])
    .in("type", ["preview_en", "sentiment_en", "recap_en"]);
  const have = new Map<string, number>(
    ((acRows as { match_id: string; type: string; updated_at: string }[] | null) ?? []).map(
      (r) => [`${r.match_id}:${r.type}`, Date.parse(r.updated_at) || 0]
    )
  );
  // 需要生成：缺失 / 强制 / 早于 staleBefore（旧文案重生；重生后 updated_at 刷新→后续跳过，逐场收敛）
  const needGen = (key: string) =>
    force || !have.has(key) || (staleBeforeMs > 0 && (have.get(key) ?? 0) < staleBeforeMs);

  let processed = 0;
  const generated = { preview_en: 0, sentiment_en: 0, recap_en: 0 };
  const overBudget = () => Date.now() - t0 > DEADLINE_MS;

  // 未开赛：preview_en + sentiment_en
  for (const m of upcoming) {
    if (processed >= MATCH_CAP || overBudget()) break;
    const home = m.home?.name;
    const away = m.away?.name;
    if (!home || !away) continue;
    const needPreview = needGen(`${m.id}:preview_en`);
    const needSentiment = needGen(`${m.id}:sentiment_en`);
    if (!needPreview && !needSentiment) continue;
    processed++;

    if (needPreview && !overBudget()) {
      try {
        const stage = stageName(m.stage ?? "Group Stage", "en");
        const body = await generatePreviewEn(home, away, stage, probMap.get(m.id));
        await upsertContent(db, m.id, "preview_en", body);
        generated.preview_en++;
      } catch (e) {
        noteErr(`preview ${m.id}`, e);
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
      } catch (e) {
        noteErr(`sentiment ${m.id}`, e);
      }
    }
  }

  // 已结算：recap_en 补录（settle 路由预算内没排上的）
  for (const m of settled) {
    if (processed >= MATCH_CAP || overBudget()) break;
    const home = m.home?.name;
    const away = m.away?.name;
    if (!home || !away || m.home_score == null || m.away_score == null) continue;
    if (!needGen(`${m.id}:recap_en`)) continue;
    processed++;
    try {
      const body = await generateRecapEn(home, away, m.home_score, m.away_score, CALL_TIMEOUT_MS);
      await upsertContent(db, m.id, "recap_en", body);
      generated.recap_en++;
    } catch (e) {
      noteErr(`recap ${m.id}`, e);
    }
  }

  // remaining = 本批没排上的候选数（粗略值，供运营判断还要 curl 几次）
  const remaining =
    upcoming.filter(
      (m) => !have.has(`${m.id}:preview_en`) || !have.has(`${m.id}:sentiment_en`)
    ).length +
    settled.filter((m) => !have.has(`${m.id}:recap_en`)).length -
    processed;

  return NextResponse.json({
    ok: true,
    processed,
    generated,
    remaining: Math.max(0, remaining),
    ...(debug ? { errors } : {}),
  });
}
