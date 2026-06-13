"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getDict, type Locale } from "@/i18n";
import { SETTLE_NEW_EVENT, SETTLE_SEEN_EVENT } from "@/components/SettleDrawer";

export function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
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
  // 小组赛期间"出线计算器"占主导航位（独家传播资产）；串关入口在首页与 /me。
  // 淘汰赛阶段（6/28+）视数据评估是否换回 combo。
  const tabs = [
    { href: "/", label: nav.predict, icon: "⚽" },
    { href: "/calculator", label: nav.calc, icon: "🧮" },
    { href: "/forecast", label: nav.forecast, icon: "📊" },
    { href: "/leaderboard", label: nav.ranking, icon: "🏆" },
    { href: "/me", label: nav.me, icon: "👤" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 h-14 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-xl">
        {tabs.map((t) => {
          const active =
            t.href === "/"
              ? pathname === "/" || pathname.startsWith("/match")
              : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
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
