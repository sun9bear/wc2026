import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runSettlement } from "@/lib/settlement/runSettlement";
import { generateRecap, generateRecapEn } from "@/lib/ai/content";
import { upsertContent } from "@/lib/ai/store";
import { teamZh } from "@/lib/football/teams";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 定时自动结算：拉取已结束比赛比分 → 给押中的人派分。
// 受 CRON_SECRET 保护：Vercel Cron 会自动带 Authorization: Bearer <CRON_SECRET>；
// 外部定时服务（cron-job.org 等）也用同一密钥调用即可。
// 结算核心在 src/lib/settlement/runSettlement.ts（与流量自驱动结算 autoSettle 共用）。
export async function GET(req: NextRequest) {
  const t0 = Date.now();
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET 未配置" }, { status: 500 });
  }
  // 接受三种等价写法（cron-job.org 等外部服务配哪种都行）：
  //   Authorization: Bearer <secret> ｜ CRON_SECRET: <secret> ｜ x-cron-secret: <secret>
  // 注意：部分代理会丢弃带下划线的头，外部服务优先配 Authorization 或 x-cron-secret。
  const bearer = req.headers.get("authorization") === `Bearer ${secret}`;
  const plain =
    req.headers.get("cron_secret") === secret ||
    req.headers.get("x-cron-secret") === secret;
  if (!bearer && !plain) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = process.env.FOOTBALL_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SECRET_KEY;
  if (!key || !url || !sk) {
    return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  }

  const sb = createClient(url, sk);

  // 阶段一：结算（纯数据库、快、幂等）——绝不依赖任何 LLM 调用。
  let newlySettled;
  try {
    newlySettled = await runSettlement(sb, key);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "结算失败" },
      { status: 502 }
    );
  }
  const settled = newlySettled.length;

  // 阶段二：结算已全部落库后，再尽力而为生成赛后小结（中文 DeepSeek + 英文 Gemini 各一份）。
  // 用「整体时间预算(相对 t0) + 更短单次超时」严格约束在 maxDuration(60s) 内返回：
  //   每场最多 2 次生成调用（zh+en，各自可重试一次）——CAP 从 8 降到 4 保持最坏耗时不超预算。
  //   未完成的（被预算/上限/失败卡住）由 /api/cron/gen-content 与 scripts/gen-recaps.ts 补录，
  //   绝不影响已落库的结算。
  const RECAP_CAP = 4;
  const RECAP_DEADLINE_MS = 40000;
  const RECAP_CALL_TIMEOUT_MS = 8000;
  let recaps = 0;
  let recapsEn = 0;
  for (const s of newlySettled.slice(0, RECAP_CAP)) {
    if (Date.now() - t0 > RECAP_DEADLINE_MS) break;
    try {
      const body = await generateRecap(teamZh(s.home), teamZh(s.away), s.hs, s.as, RECAP_CALL_TIMEOUT_MS);
      await upsertContent(sb, s.id, "recap", body);
      recaps++;
    } catch {
      /* 忽略 AI 失败/超时 */
    }
    if (Date.now() - t0 > RECAP_DEADLINE_MS) break;
    try {
      const bodyEn = await generateRecapEn(s.home, s.away, s.hs, s.as, RECAP_CALL_TIMEOUT_MS);
      await upsertContent(sb, s.id, "recap_en", bodyEn);
      recapsEn++;
    } catch {
      /* 忽略 AI 失败/超时（GEMINI_API_KEY 缺失同样静默，结算不受影响） */
    }
  }

  return NextResponse.json({
    ok: true,
    settled,
    recaps,
    recapsEn,
    recapsDeferred: Math.max(0, settled - recaps),
  });
}
