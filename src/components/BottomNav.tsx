"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDict, type Locale } from "@/i18n";

export function BottomNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const nav = getDict(locale).nav;
  const tabs = [
    { href: "/", label: nav.predict, icon: "⚽" },
    { href: "/parlay", label: nav.parlay, icon: "🔗" },
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
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
