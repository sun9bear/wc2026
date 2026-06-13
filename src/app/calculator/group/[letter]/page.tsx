import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { getForecast } from "@/lib/prob/pipeline";
import { teamSlug } from "@/lib/prob/findTeam";
import { LocalTime } from "@/components/LocalTime";
import { Disclaimer } from "@/components/Disclaimer";

export const maxDuration = 60;

// 按组 SEO 着陆页：/calculator/group/a … /l —— 承接"Group A who advances /
// X 组出线形势"类脉冲搜索，正文给可索引文字密度（AdSense 审核期内容厚度），
// CTA 导向 /calculator?team=（互动工具）。
const LETTERS = "abcdefghijkl".split("");

const COPY = {
  zh: {
    title: (x: string) => `2026 世界杯 ${x} 组出线形势：积分榜 + 第三名晋级概率`,
    desc: (x: string) =>
      `${x} 组实时积分榜、各队出线概率（万次蒙特卡洛模拟）与剩余赛程。用出线计算器改任意赛果，立即看 ${x} 组与最佳第三名榜变化。`,
    h1: (x: string) => `${x} 组出线形势`,
    table: "实时积分榜",
    cols: ["排名", "球队", "赛", "积分", "净胜", "出线概率"],
    fixtures: "剩余赛程",
    cta: (zh: string) => `${zh}怎样才能出线？去算 →`,
    tool: "🧮 打开出线计算器（改任意赛果实时重算）",
    note: "出线概率来自万次蒙特卡洛模拟（市场共识 + Elo 融合），每小时更新。",
    back: "← 返回",
  },
  en: {
    title: (x: string) => `World Cup 2026 Group ${x} standings & qualification scenarios`,
    desc: (x: string) =>
      `Live Group ${x} table, every team's chance to advance (10,000 Monte Carlo simulations) and remaining fixtures. Flip any result in the scenario calculator and watch the best-thirds race update.`,
    h1: (x: string) => `Group ${x} — who advances?`,
    table: "Live standings",
    cols: ["#", "Team", "P", "Pts", "GD", "Advance"],
    fixtures: "Remaining fixtures",
    cta: (name: string) => `Can ${name} still advance? Find out →`,
    tool: "🧮 Open the scenario calculator (flip any result, live recompute)",
    note: "Advance chances come from 10,000 Monte Carlo simulations (market consensus + Elo blend), refreshed hourly.",
    back: "← Back",
  },
} as const;

export function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const X = letter.toUpperCase();
  if (!LETTERS.includes(letter)) return {};
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title(X),
    description: c.desc(X),
    alternates: { canonical: `https://www.wc2026.cool/calculator/group/${letter}` },
  };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  if (!LETTERS.includes(letter)) notFound();
  const X = letter.toUpperCase();
  const locale = await getLocale();
  const c = COPY[locale];
  const data = await getForecast();

  const group = data.groups.find((g) => g.letter === X);
  if (!group) notFound();
  const ids = new Set(group.table.map((t) => t.id));
  const fixtures = data.matches.filter((m) => ids.has(m.homeId) && ids.has(m.awayId));
  const name = (t: { name: string; zh: string }) => (locale === "zh" ? t.zh : t.name);
  const pct = (x: number) => `${((x > 1 ? x : x * 100)).toFixed(0)}%`;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/calculator" className="text-xs text-muted">
          {c.back}
        </Link>
      </div>
      <h1 className="font-head mb-1 mt-3 text-2xl font-bold">🧮 {c.h1(X)}</h1>
      <p className="mb-4 text-xs text-muted">{c.note}</p>

      <h2 className="font-head mb-2 text-sm font-semibold">{c.table}</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] text-muted">
              {c.cols.map((col) => (
                <th key={col} className="px-2 py-2 text-left font-normal">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.table.map((t, i) => (
              <tr key={t.id} className={i < 2 ? "text-text" : "text-muted"}>
                <td className="px-2 py-2 font-head">{i + 1}</td>
                <td className="px-2 py-2">
                  <Link
                    href={`/calculator?team=${teamSlug(t.name)}`}
                    className="inline-flex items-center gap-1.5 hover:text-green"
                  >
                    {t.flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                    )}
                    {name(t)}
                  </Link>
                </td>
                <td className="px-2 py-2 font-head">{t.played}</td>
                <td className="px-2 py-2 font-head">{t.pts}</td>
                <td className="px-2 py-2 font-head">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td className="px-2 py-2 font-head text-green">{pct(t.pAdvance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fixtures.length > 0 && (
        <>
          <h2 className="font-head mb-2 mt-6 text-sm font-semibold">{c.fixtures}</h2>
          <ul className="space-y-1.5 text-sm">
            {fixtures.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <span>
                  {name(m.home)} vs {name(m.away)}
                </span>
                <span className="text-xs text-muted">
                  <LocalTime iso={m.kickoff} locale={locale} mode="datetime" />
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 space-y-2 text-sm">
        {group.table[2] && (
          <Link
            href={`/calculator?team=${teamSlug(group.table[2].name)}`}
            className="block rounded-lg border border-green/40 bg-surface p-3 text-green"
          >
            {c.cta(name(group.table[2]))}
          </Link>
        )}
        <Link href="/calculator" className="block rounded-lg border border-border bg-surface p-3">
          {c.tool}
        </Link>
      </div>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
