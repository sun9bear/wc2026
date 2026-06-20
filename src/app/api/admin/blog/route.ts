import { NextRequest, NextResponse, after } from "next/server";
import {
  adminSecret,
  safeEqual,
  isAuthed,
  ADMIN_COOKIE,
  ADMIN_STATUSES,
  setStatus,
  deleteEntries,
  regenerateBySlug,
  composeManual,
  type AdminStatus,
} from "@/lib/blog/admin";
import type { ManualInput } from "@/lib/blog/manual";
import { rateLimit } from "@/lib/rateLimit";
import { pingBlogUrls } from "@/lib/seo/indexnow";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

// P6 管理后台变更端点：login 校验口令→种 httpOnly cookie；变更类（setStatus/delete）逐次校验 cookie。
// 路由在 /api/* 下（robots 已屏蔽、proxy matcher 已跳过），且每个写操作都先 isAuthed() 鉴权。
export async function POST(req: NextRequest) {
  const secret = adminSecret();
  if (!secret) return NextResponse.json({ error: "admin 未配置（缺 ADMIN_TOKEN/CRON_SECRET）" }, { status: 500 });

  let body: { action?: string; token?: string; slugs?: unknown; status?: string; input?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const action = body.action;

  // 登录：限流（防在线暴力猜口令；Hobby 无 WAF）→ 校验 token → 种 httpOnly+secure+strict cookie。
  if (action === "login") {
    if (!rateLimit(`admin_login:${getIp(req)}`, 5, 60_000)) {
      return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
    }
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token || !safeEqual(token, secret)) {
      return NextResponse.json({ error: "口令错误" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, secret, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }
  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
    return res;
  }

  // 变更类：必须已鉴权。
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 手动撰写：用 body.input（角度+素材），不需 slugs。~30-60s 同步生成双语草稿。
  if (action === "compose") {
    const inp = (body.input ?? {}) as { angle?: unknown; titleHint?: unknown; locales?: unknown; assets?: unknown };
    const angle = typeof inp.angle === "string" ? inp.angle : "";
    if (!angle.trim()) return NextResponse.json({ error: "缺 angle" }, { status: 400 });
    const locales = Array.isArray(inp.locales)
      ? (inp.locales.filter((l) => l === "en" || l === "zh") as ("en" | "zh")[])
      : [];
    const rawAssets = Array.isArray(inp.assets) ? (inp.assets as Record<string, unknown>[]) : [];
    const assets = rawAssets.filter(
      (a) => a && typeof a.url === "string" && (a.type === "embed" || a.type === "image")
    ) as unknown as ManualInput["assets"];
    try {
      const r = await composeManual({
        angle,
        titleHint: typeof inp.titleHint === "string" ? inp.titleHint : undefined,
        locales,
        assets,
      });
      if (!r.ok) return NextResponse.json({ error: r.error || "compose failed" }, { status: 500 });
      return NextResponse.json({ ok: true, slug: r.slug, reason: r.reason });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "compose error" }, { status: 500 });
    }
  }

  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s): s is string => typeof s === "string") : [];
  if (!slugs.length) return NextResponse.json({ error: "no slugs" }, { status: 400 });

  try {
    if (action === "delete") {
      const affected = await deleteEntries(slugs);
      return NextResponse.json({ ok: true, affected });
    }
    if (action === "setStatus") {
      const status = body.status;
      if (!status || !(ADMIN_STATUSES as readonly string[]).includes(status)) {
        return NextResponse.json({ error: "bad status" }, { status: 400 });
      }
      const affected = await setStatus(slugs, status as AdminStatus);
      if (status === "published") after(() => pingBlogUrls(slugs)); // 人工发布→通知 Bing/Yandex 抓取
      return NextResponse.json({ ok: true, affected });
    }
    if (action === "regenerate") {
      // 重生单篇（返回发给模型重写，~30s 同步）；落定 published 才 ping IndexNow。
      const r = await regenerateBySlug(slugs[0]);
      if (!r.ok) return NextResponse.json({ error: r.error || "重生失败" }, { status: 500 });
      if (r.status === "published") after(() => pingBlogUrls([slugs[0]]));
      return NextResponse.json({ ok: true, status: r.status, affected: 1 });
    }
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
