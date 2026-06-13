import { NextResponse } from "next/server";
import { getForecast } from "@/lib/prob/pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 概率缓存预热（每小时）：替代直接 GET /forecast 整页。
// cron-job.org 拉 /forecast 大 HTML 会报 "output too large" 判失败（误判 + 触发自动禁用），
// 而预热同时承担 prob_*_snapshots 历史快照累积（任务 6 摆动卡基线靠它），不能让它被停。
// 本路由跑同一 getForecast()（1h 缓存 + 快照写入逻辑都在里面），只回极小 JSON，无大 body。
// 无需鉴权：getForecast 有 1h unstable_cache，无法被高频强制重算（与公开的 /forecast 页同等暴露）。
export async function GET() {
  try {
    const data = await getForecast();
    return NextResponse.json({ ok: true, updatedAt: data.updatedAt, simOk: data.simOk });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "warm failed" },
      { status: 500 }
    );
  }
}
