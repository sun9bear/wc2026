import { getMatches } from "@/lib/matches/getMatches";
import { MatchCard } from "@/components/MatchCard";
import { Disclaimer } from "@/components/Disclaimer";
import { zh } from "@/i18n/messages/zh";

export default async function Home() {
  const matches = await getMatches();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-head text-2xl font-bold tracking-wide">
          环球足球<span className="text-green">预测</span> · 2026
        </h1>
        <p className="mt-1 text-sm text-muted">{zh.tagline}</p>
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
