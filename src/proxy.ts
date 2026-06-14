import { NextResponse, type NextRequest } from "next/server";

// 首访语言/区域检测 + per-locale URL 路由（边缘执行，零延迟）：
// - x-locale 请求头：按 URL 注入（/zh、/zh/* → zh，其余 → en），供服务端 getLocale() 权威取用。
//   内容由 URL 唯一决定——根路径永远 en、/zh 永远 zh，不靠 cookie 切内容（杜绝 canonical/内容错配）。
// - /zh/* 内部 rewrite 到无前缀路由（/zh/forecast → /forecast），URL 栏保持 /zh/*
//   （是 rewrite 非 redirect → 已收录的根 EN URL 零 301）。
// - NEXT_LOCALE / wc_country cookie：保留（前者记偏好供无头的 API 路由兜底，后者为小语种扩展备）。
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isZh = pathname === "/zh" || pathname.startsWith("/zh/");
  const locale = isZh ? "zh" : "en";

  // 把 x-locale 注入“请求头”，使下游 Server Component 的 headers() 读得到。
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-locale", locale);

  let res: NextResponse;
  if (isZh) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/zh" ? "/" : pathname.slice(3); // 剥 "/zh" 前缀
    res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    res = NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (!req.cookies.get("NEXT_LOCALE")) {
    const accept = req.headers.get("accept-language") ?? "";
    const cookieLocale = /(^|[,;\s])zh\b|zh-/i.test(accept) ? "zh" : "en";
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
  // 跳过静态资源与 API（含 /zh 前缀形式：/zh/_next、/zh/og.png 等）；只在页面请求上运行。
  matcher: ["/((?!(?:zh/)?(?:_next/|api/|favicon|og\\.png|robots|sitemap)).*)"],
};
