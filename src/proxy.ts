import { NextResponse, type NextRequest } from "next/server";
import { PREFIXED_LOCALES, DEFAULT_LOCALE } from "./i18n/locales";

// 首访语言/区域检测 + per-locale URL 路由（边缘执行，零延迟）：
// - x-locale 请求头：按 URL 注入（/zh、/zh/* → zh，其余 → en），供服务端 getLocale() 权威取用。
//   内容由 URL 唯一决定——根路径永远 en、/zh 永远 zh，不靠 cookie 切内容（杜绝 canonical/内容错配）。
// - /zh/* 内部 rewrite 到无前缀路由（/zh/forecast → /forecast），URL 栏保持 /zh/*
//   （是 rewrite 非 redirect → 已收录的根 EN URL 零 301）。
// 注：不再写 NEXT_LOCALE / wc_country 响应 cookie——Set-Cookie 会硬阻断 Vercel 边缘/CDN 缓存
//   （任务 B / 见 docs/LOCALE-SEGMENT-REFACTOR-PLAN.md）。服务端 locale 经 x-locale 头、客户端经
//   LocaleProvider 下发；NEXT_LOCALE 仅由 LangToggle 客户端 document.cookie 写（手动偏好），不进响应头。
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
  if (prefix) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === `/${prefix}` ? "/" : pathname.slice(prefix.length + 1); // 剥 "/<locale>" 前缀
    res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }

  return res;
}

export const config = {
  // 跳过静态资源与 API（含各前缀形式：/zh/_next、/es/og.png 等）；只在页面请求上运行。
  // 注意：matcher 须为静态字面量（Next 构建期静态分析，读不到 PREFIXED_LOCALES 数组）——
  // 加/删前缀 locale 时手动同步这条正则的 (?:(?:zh|es|pt|de|fr)/)? 段。
  // ads.txt / llms.txt 是根静态文件（AdSense 发布商 ID / LLM 索引）——显式排除，让中间件
  // 完全不碰它们（防御性：杜绝任何理论上的改写/缓存干扰，确保 AdSense 抓取永远拿到原文）。
  matcher: ["/((?!(?:(?:zh|es|pt|de|fr)/)?(?:_next/|api/|favicon|og\\.png|robots|sitemap|ads\\.txt|llms\\.txt)).*)"],
};
