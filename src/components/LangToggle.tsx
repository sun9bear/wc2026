"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n";
import { localeHref, stripLocale } from "@/i18n";

// 语言切换：per-locale URL 下用【整页导航】到目标 locale 的 URL（window.location.assign）。
// 不用 router.push 软导航——中间件把 /zh 内部 rewrite 到无前缀路由，App Router 的路由缓存
// 会让软导航命中【旧 locale 的缓存段】，切换后要手动强刷才生效。整页导航必过中间件、
// 永远按 URL 渲染正确 locale，无缓存歧义。仍写 NEXT_LOCALE cookie 记偏好（API 路由兜底）。
export function LangToggle({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const next: Locale = locale === "zh" ? "en" : "zh";

  function switchTo() {
    setPending(true);
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.assign(localeHref(next, stripLocale(pathname)));
  }

  return (
    <button
      type="button"
      onClick={switchTo}
      disabled={pending}
      className="rounded-pill border border-border px-3 py-1 text-[11px] text-muted transition-colors hover:text-text disabled:opacity-50"
      aria-label="Switch language"
    >
      {label}
    </button>
  );
}
