import { NextResponse, type NextRequest } from "next/server";
import { PREFIXED_LOCALES, DEFAULT_LOCALE, localeFromAcceptLanguage } from "./i18n/locales";

// 首访语言/区域检测 + per-locale URL 路由（边缘执行，零延迟）：
// - x-locale 请求头：按 URL 注入（/zh、/zh/* → zh，其余 → en），供服务端 getLocale() 权威取用。
//   内容由 URL 唯一决定——根路径永远 en、/zh 永远 zh，不靠 cookie 切内容（杜绝 canonical/内容错配）。
// - /zh/* 内部 rewrite 到无前缀路由（/zh/forecast → /forecast），URL 栏保持 /zh/*
//   （是 rewrite 非 redirect → 已收录的根 EN URL 零 301）。
// - NEXT_LOCALE / wc_country cookie：保留（前者记偏好供无头的 API 路由兜底，后者为小语种扩展备）。
// 可 CDN 缓存的纯数据/只读路由（内部裸路径，已剥 locale 前缀；CDN 按 URL 分桶 → 各 locale 独立缓存）。
// 排除 /（home，autoSettle + force-dynamic）、/me、/leaderboard、/league、/combo（个性化/写动作页）。
function isCacheablePath(path: string): boolean {
  return /^\/(forecast|calculator|team|match|rules|watch|about|privacy|disclaimer|scorers)(\/|$)/.test(path);
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // 首段命中已知前缀 locale → 该 locale；否则 = DEFAULT_LOCALE（根，无前缀）。
  const seg = pathname.split("/")[1] ?? "";
  const prefix = (PREFIXED_LOCALES as readonly string[]).includes(seg) ? seg : null;
  const locale = prefix ?? DEFAULT_LOCALE;

  // 把 x-locale 注入“请求头”，使下游 Server Component 的 headers() 读得到。
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);

  let res: NextResponse;
  let internalPath: string;
  if (prefix) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === `/${prefix}` ? "/" : pathname.slice(prefix.length + 1); // 剥 "/<locale>" 前缀
    internalPath = url.pathname;
    res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    internalPath = pathname;
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Stage 1 边缘缓存：纯数据/只读页让 Vercel CDN 按 URL 缓存（爬虫/匿名访客拿毫秒级缓存 HTML，
  // 不再触发 SSR 重算 → 抬高爆量承载 + 加速抓取 + 省成本）。这些页无 per-user 服务端内容、
  // locale 由 URL 决定 → 跨用户共享安全。关键：此分支【不写 Set-Cookie】——带 Set-Cookie
  // 的响应 Vercel CDN 一律不缓存。s-maxage=300（数据本就每小时更新）+ swr 容错。
  if (isCacheablePath(internalPath)) {
    res.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
    return res;
  }

  // 个性化/写动作页：保持动态，写语言/地区偏好 cookie（供无头 API 路由兜底）。
  if (!req.cookies.get("NEXT_LOCALE")) {
    const cookieLocale = localeFromAcceptLanguage(req.headers.get("accept-language"));
    res.cookies.set("NEXT_LOCALE", cookieLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
  }

  const country = req.headers.get("x-vercel-ip-country");
  if (country && req.cookies.get("wc_country")?.value !== country) {
    res.cookies.set("wc_country", country, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }

  return res;
}

export const config = {
  // 跳过静态资源与 API（含各前缀形式：/zh/_next、/es/og.png 等）；只在页面请求上运行。
  // 注意：matcher 须为静态字面量（Next 构建期静态分析，读不到 PREFIXED_LOCALES 数组）——
  // 加/删前缀 locale 时手动同步这条正则的 (?:(?:zh|es|pt|de|fr)/)? 段。
  matcher: ["/((?!(?:(?:zh|es|pt|de|fr)/)?(?:_next/|api/|favicon|og\\.png|robots|sitemap)).*)"],
};
