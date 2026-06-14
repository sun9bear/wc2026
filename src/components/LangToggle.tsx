"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/i18n";
import { localeHref, stripLocale } from "@/i18n";

// 语言切换：per-locale URL 下改为“导航到对应 locale 的 URL”（不再 cookie+refresh，
// 否则 URL 栏与渲染内容脱节）。当前 pathname 可能带 /zh 前缀，先剥成裸路径再按目标 locale 重建。
// 仍写 NEXT_LOCALE cookie 记住偏好（供无 x-locale 头的 API 路由兜底）。
export function LangToggle({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "zh" ? "en" : "zh";

  function switchTo() {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    const target = localeHref(next, stripLocale(pathname));
    startTransition(() => router.push(target));
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
