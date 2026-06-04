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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
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
      <header className="mb-6">
        <h1 className="font-head text-2xl font-bold tracking-wide">
          环球足球<span className="text-green">预测</span> · 2026
        </h1>
        <p className="mt-1 text-sm text-muted">{zh.tagline}</p>
      </header>

      <div className="mb-5 flex gap-2 text-xs">
        {(
          [
            ["all", "全部"],
            ["upcoming", "未开赛"],
            ["done", "已结束"],
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
        <p className="mt-10 text-center text-sm text-muted">该筛选下暂无比赛。</p>
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
