"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDict, localeHref, stripLocale, type Locale } from "@/i18n";
import { SETTLE_NEW_EVENT, SETTLE_SEEN_EVENT } from "@/components/SettleDrawer";
import { buildNavTabs, isNavActive } from "@/components/nav-tabs";

export function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  // /zh/* 是内部 rewrite，usePathname() 返回带前缀的公开路径；比对前先剥成裸路径，
  // 否则 zh 树上所有 tab 都不会高亮（与 LangToggle 共用同一前缀真理点 stripLocale）。
  const bare = stripLocale(pathname);
  const nav = getDict(locale).nav;

  // 新结算红点：SettleDrawer 发现新结果时写 localStorage + 派发事件，关闭抽屉即清除。
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
  // Tab 配置与高亮逻辑见 nav-tabs.ts（与桌面 TopNav 共用真理源）。
  const tabs = buildNavTabs(nav);

  return (
    // md+ 由桌面端 TopNav 接管，底部栏仅手机端显示。
    <nav className="fixed inset-x-0 bottom-0 z-40 h-14 border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <div className="mx-auto flex h-full max-w-xl">
        {tabs.map((t) => {
          const active = isNavActive(bare, t.href);
          return (
            <Link
              key={t.href}
              href={localeHref(locale, t.href)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "text-green" : "text-muted"
              }`}
            >
              <span className="relative text-lg leading-none">
                {t.icon}
                {t.href === "/me" && dot && (
                  <span className="absolute -right-1.5 -top-0.5 h-2 w-2 rounded-full bg-red" />
                )}
              </span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
