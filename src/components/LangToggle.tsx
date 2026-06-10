"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/i18n";

// 语言切换：写 NEXT_LOCALE cookie 后 router.refresh()，让服务端组件按新语言重渲染。
export function LangToggle({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "zh" ? "en" : "zh";

  function switchTo() {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
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
