"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { LOCALES, NATIVE_LABEL, type Locale, localeHref, stripLocale } from "@/i18n";

// 语言切换：per-locale URL 下用【整页导航】到目标 locale 的 URL（window.location.assign）。
// 不用 router.push 软导航——中间件把 /zh、/es… 内部 rewrite 到无前缀路由，App Router 的路由缓存
// 会让软导航命中【旧 locale 的缓存段】，切换后要手动强刷才生效。整页导航必过中间件、
// 永远按 URL 渲染正确 locale，无缓存歧义。仍写 NEXT_LOCALE cookie 记偏好（API 路由兜底）。
// 多语下拉：遍历 LOCALES 渲染各语母语自称（中文/English/Español/Português/Deutsch/Français）。
// label 形参保留（Footer 仍传 t.langLabel），但选项标签统一由 NATIVE_LABEL 驱动。
export function LangToggle({ locale }: { locale: Locale; label?: string }) {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const bare = stripLocale(pathname);

  function switchTo(next: Locale) {
    if (next === locale || pending) return;
    setPending(true);
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.assign(localeHref(next, bare));
  }

  return (
    <span className="relative inline-flex items-center">
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => switchTo(e.target.value as Locale)}
        aria-label="Switch language"
        className="appearance-none rounded-pill border border-border bg-surface px-3 py-1 pr-7 text-[11px] text-muted transition-colors hover:text-text disabled:opacity-50"
      >
        {LOCALES.map((l) => (
          <option key={l} value={l}>
            {NATIVE_LABEL[l]}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5 text-[8px] text-muted">
        ▼
      </span>
    </span>
  );
}
