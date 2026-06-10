import Link from "next/link";
import { getMatches } from "@/lib/matches/getMatches";
import { MatchCard } from "@/components/MatchCard";
import { Disclaimer } from "@/components/Disclaimer";
import { getDict } from "@/i18n";
import { getLocale } from "@/i18n/server";
import type { FixtureMatch } from "@/lib/fixtures/matches";

export const dynamic = "force-dynamic";

function dateKey(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const locale = await getLocale();
  const t = getDict(locale);
  const all = await getMatches();
  const now = Date.now();
  const matches = all.filter((m) => {
    if (filter === "upcoming")
      return m.status !== "settled" && new Date(m.kickoffAt).getTime() > now;
    if (filter === "done") return m.status === "settled";
    return true;
  });

  const groups: { date: string; items: FixtureMatch[] }[] = [];
  for (const m of matches) {
    const d = dateKey(m.kickoffAt, locale);
    let g = groups.find((x) => x.date === d);
    if (!g) {
      g = { date: d, items: [] };
      groups.push(g);
    }
    g.items.push(m);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-head text-2xl font-bold tracking-wide">
          {locale === "en" ? (
            <>
              World Cup <span className="text-green">Predictor</span> · 2026
            </>
          ) : (
            <>
              环球足球<span className="text-green">预测</span> · 2026
            </>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted">{t.tagline}</p>
      </header>

      <div className="mb-5 flex gap-2 text-xs">
        {(
          [
            ["all", t.filter.all],
            ["upcoming", t.filter.upcoming],
            ["done", t.filter.done],
          ] as const
        ).map(([k, label]) => (
          <Link
            key={k}
            href={k === "all" ? "/" : `/?filter=${k}`}
            className={`rounded-pill border px-3 py-1 ${
              filter === k ? "border-green text-green" : "border-border text-muted"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="mt-16 text-center">
          <div className="text-5xl">📭</div>
          <p className="mt-3 text-sm text-muted">{t.filter.empty}</p>
        </div>
      )}

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
