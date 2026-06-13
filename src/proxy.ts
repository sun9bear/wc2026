import { NextResponse, type NextRequest } from "next/server";

// 首访语言/区域检测（边缘执行，零延迟，不需要中转加载页）：
// - NEXT_LOCALE：无 cookie 时按 Accept-Language 写入（zh* → zh，其余 → en），
//   与 src/i18n/server.ts 的推断一致；用户用 LangToggle 切换后以 cookie 为准。
// - wc_country：记录 Vercel 边缘的 IP 国家码，为后续小语种（es/pt/ar…）与
//   分区内容做准备（语言判断永远以 Accept-Language 优先，国家码只做参考）。
export default function proxy(req: NextRequest) {
  const res = NextResponse.next();

  if (!req.cookies.get("NEXT_LOCALE")) {
    const accept = req.headers.get("accept-language") ?? "";
    const locale = /(^|[,;\s])zh\b|zh-/i.test(accept) ? "zh" : "en";
    res.cookies.set("NEXT_LOCALE", locale, {
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
  // 跳过静态资源与 API；只在页面请求上运行
  matcher: ["/((?!_next/|api/|favicon|og\\.png|robots|sitemap).*)"],
};
