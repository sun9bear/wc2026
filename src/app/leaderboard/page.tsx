import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/leaderboard/getLeaderboard";
import { Disclaimer } from "@/components/Disclaimer";
import { fmtPoints } from "@/lib/format";
import { getDict, localeHref } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { localizedAlternates } from "@/lib/seo/canonical";

export const dynamic = "force-dynamic";

// 显式绝对自指 canonical（CodeX 外审 M2）。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    alternates: localizedAlternates("/leaderboard", locale),
  };
}

const TIER_COLOR: Record<string, string> = {
  legend: "text-gold",
  diamond: "text-blue",
  platinum: "text-blue",
  gold: "text-gold",
  silver: "text-muted",
  bronze: "text-muted",
};

export default async function LeaderboardPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const rows = await getLeaderboard(locale);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.leaderboard.title}</h1>
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">🏆</div>
          <p className="mt-3 text-sm text-muted">{t.leaderboard.empty}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-2">
          {rows.map((r) => (
            <li
              key={r.rank}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-2 p-3"
            >
              <span className="font-head w-6 text-center text-lg font-bold text-muted">
                {r.rank}
              </span>
              <span className="flex-1 truncate text-sm font-medium">
                {r.name}
              </span>
              <span className={`text-[10px] ${TIER_COLOR[r.tierCode] ?? "text-muted"}`}>
                {t.tiers[r.tierCode] ?? r.tierLabel}
              </span>
              <span className="font-head text-base font-bold">{fmtPoints(r.points)}</span>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
