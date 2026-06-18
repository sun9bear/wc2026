"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDict, localeHref, stripLocale, type Locale } from "@/i18n";
import { SETTLE_NEW_EVENT, SETTLE_SEEN_EVENT } from "@/components/SettleDrawer";
import { buildNavTabs, isNavActive } from "@/components/nav-tabs";
import { LangToggle } from "@/components/LangToggle";

// 桌面端顶部导航（≥md 显示；手机端隐藏，由 BottomNav 接管）。
// sticky 占正常流，无需 body 顶部留白；与 BottomNav 共用 nav-tabs 真理源。
export function TopNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  // /zh/* 是内部 rewrite，usePathname() 带前缀；比对前剥成裸路径（与 BottomNav 同源）。
  const bare = stripLocale(pathname);
  const tabs = buildNavTabs(getDict(locale).nav);

  // 新结算红点：与 BottomNav 共用 localStorage 信号 + 事件。
  const [dot, setDot] = useState(false);
  useEffect(() => {
    const sync = () => {
      try {
        setDot(localStorage.getItem("wc_unseen_settled") === "1");
      } catch {
        /* 隐私模式 */
      }
    };
    sync();
    window.addEventListener(SETTLE_NEW_EVENT, sync);
    window.addEventListener(SETTLE_SEEN_EVENT, sync);
    return () => {
      window.removeEventListener(SETTLE_NEW_EVENT, sync);
      window.removeEventListener(SETTLE_SEEN_EVENT, sync);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-surface/90 backdrop-blur md:block">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-6">
        <Link
          href={localeHref(locale, "/")}
          className="font-head shrink-0 text-base font-bold tracking-wide transition-opacity hover:opacity-80"
        >
          ⚽ <span className="text-green">WC</span>2026
        </Link>
        <nav className="flex flex-1 items-center gap-1" aria-label="Primary">
          {tabs.map((t) => {
            const active = isNavActive(bare, t.href);
            return (
              <Link
                key={t.href}
                href={localeHref(locale, t.href)}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-pill px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-2 text-green"
                    : "text-muted hover:bg-surface-2/60 hover:text-text"
                }`}
              >
                {t.label}
                {t.href === "/me" && dot && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red" />
                )}
              </Link>
            );
          })}
        </nav>
        <LangToggle locale={locale} />
      </div>
    </header>
  );
}
