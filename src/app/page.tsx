import Link from "next/link";
import { getMatches } from "@/lib/matches/getMatches";
import { MatchCard } from "@/components/MatchCard";
import { Disclaimer } from "@/components/Disclaimer";
import { zh } from "@/i18n/messages/zh";

export default async function Home() {
  const matches = await getMatches();

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
          <Link href="/leaderboard" className="text-green">
            🏆 排行榜
          </Link>
          <Link href="/me" className="text-green">
            👤 我的
          </Link>
        </nav>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </section>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
