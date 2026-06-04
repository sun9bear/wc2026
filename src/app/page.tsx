import Link from "next/link";
import { getMatches } from "@/lib/matches/getMatches";
import { MatchCard } from "@/components/MatchCard";
import { Disclaimer } from "@/components/Disclaimer";
import { zh } from "@/i18n/messages/zh";
import type { FixtureMatch } from "@/lib/fixtures/matches";

export const dynamic = "force-dynamic";

function dateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default async function Home() {
  const matches = await getMatches();

  const groups: { date: string; items: FixtureMatch[] }[] = [];
  for (const m of matches) {
    const d = dateKey(m.kickoffAt);
    let g = groups.find((x) => x.date === d);
    if (!g) {
      g = { date: d, items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-head text-2xl font-bold tracking-wide">
            环球足球<span className="text-green">预测</span> · 2026
          </h1>
          <p className="mt-1 text-sm text-muted">{zh.tagline}</p>
        </div>
        <nav className="flex shrink-0 gap-3 text-xs">
          <Link href="/parlay" className="text-green">
            🔗 串关
          </Link>
          <Link href="/leaderboard" className="text-green">
            🏆 排行榜
          </Link>
          <Link href="/me" className="text-green">
            👤 我的
          </Link>
        </nav>
      </header>

      {groups.map((g) => (
        <section key={g.date} className="mb-6">
          <h2 className="font-head sticky top-0 z-10 -mx-4 mb-2 bg-bg/90 px-4 py-2 text-sm font-semibold text-muted backdrop-blur">
            {g.date}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      ))}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
