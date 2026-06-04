"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "预测", icon: "⚽" },
  { href: "/parlay", label: "串关", icon: "🔗" },
  { href: "/leaderboard", label: "排行", icon: "🏆" },
  { href: "/me", label: "我的", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 h-14 border-t border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-full max-w-xl">
        {TABS.map((t) => {
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
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
