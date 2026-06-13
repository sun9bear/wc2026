import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rateLimit";

// 最小埋点落库（任务 4）。防滥用（对抗审查加固）：
//   ① 同源校验——Origin 的 host 必须等于请求 host（裸 curl 默认不带 Origin 即被挡；
//      浏览器 fetch/sendBeacon 同源 POST 一定带 Origin）。
//   ② 尽力而为内存限流——按 IP 每分钟封顶，挡住单实例洪流（Serverless 跨实例不共享，故为辅助层）。
// 仅服务端可写 events（service_role 绕过 RLS，见 0003_events.sql）；写失败静默，绝不抛 5xx 噪声。
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60; // 正常用户每分钟远低于此；超额直接丢弃（埋点丢点无所谓）

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false; // 浏览器同源 POST 必带 Origin；缺失 → 视为非浏览器调用，拒
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!sameOrigin(req)) return NextResponse.json({ ok: false }, { status: 403 });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimit(`track:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }

    const body = (await req.json()) as {
      name?: unknown;
      props?: unknown;
      anonId?: unknown;
    };
    const name = typeof body.name === "string" ? body.name : "";
    if (!/^[a-z0-9_]{1,64}$/.test(name)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const anonId =
      typeof body.anonId === "string" && body.anonId.length <= 64 ? body.anonId : null;
    let props: Record<string, unknown> | null = null;
    if (body.props && typeof body.props === "object" && !Array.isArray(body.props)) {
      const s = JSON.stringify(body.props);
      if (s.length <= 2048) props = body.props as Record<string, unknown>;
    }

    const db = getServerSupabase();
    await db.from("events").insert({ name, anon_id: anonId, props });
    return NextResponse.json({ ok: true });
  } catch {
    // 埋点路径绝不向客户端抛 5xx 噪声
    return NextResponse.json({ ok: false });
  }
}
