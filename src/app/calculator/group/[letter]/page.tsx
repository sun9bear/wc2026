import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";
import { getForecast } from "@/lib/prob/pipeline";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
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
    title: (x: string) => `${x} 组谁能出线？2026 世界杯 ${x} 组积分榜 + 晋级概率`,
    desc: (x: string) =>
      `${x} 组实时积分榜、各队出线概率（万次蒙特卡洛模拟）与剩余赛程。用出线计算器改任意赛果，立即看 ${x} 组与最佳第三名榜变化。`,
    h1: (x: string) => `${x} 组出线形势`,
    table: "实时积分榜",
    cols: ["排名", "球队", "赛", "积分", "净胜", "出线概率"],
    fixtures: "剩余赛程",
    cta: (zh: string) => `${zh}怎样才能出线？去算 →`,
    tool: "🧮 打开出线计算器（改任意赛果实时重算）",
    note: "出线概率来自万次蒙特卡洛模拟（公开预测数据 + Elo 融合），每小时更新。",
    latest: "最新赛果",
    lead: (x: string, leader: string, p: string) =>
      `2026 世界杯 ${x} 组：${leader} 以 ${p} 出线概率领跑；改动下方任意未赛赛果，即可看 ${x} 组与最佳第三名形势如何变化。`,
    back: "← 返回",
  },
  en: {
    title: (x: string) => `Group ${x}: who advances? — World Cup 2026 standings`,
    desc: (x: string) =>
      `Live Group ${x} table, every team's chance to advance (10,000 Monte Carlo simulations) and remaining fixtures. Flip any result in the scenario calculator and watch the best-thirds race update.`,
    h1: (x: string) => `Group ${x} — who advances?`,
    table: "Live standings",
    cols: ["#", "Team", "P", "Pts", "GD", "Advance"],
    fixtures: "Remaining fixtures",
    cta: (name: string) => `Can ${name} still advance? Find out →`,
    tool: "🧮 Open the scenario calculator (flip any result, live recompute)",
    note: "Advance chances come from 10,000 Monte Carlo simulations (public forecasting data + Elo blend), refreshed hourly.",
    latest: "Latest result",
    lead: (x: string, leader: string, p: string) =>
      `As of the 2026 World Cup, ${leader} leads Group ${x} with a ${p} chance to advance to the Round of 32; flip any remaining result below to see how the group and best-third race change.`,
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
    alternates: localizedAlternates(`/calculator/group/${letter}`, locale),
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
  const idx = await getSettledIndex().catch(() => null);
  const lastResult = idx?.byGroup[X] ?? null; // 真实 settled_at（该组最近一场结算），非伪新鲜
  const ids = new Set(group.table.map((t) => t.id));
  const fixtures = data.matches.filter((m) => ids.has(m.homeId) && ids.has(m.awayId));
  const name = (t: { name: string; zh: string }) => (locale === "zh" ? t.zh : t.name);
  const pct = (x: number) => `${((x > 1 ? x : x * 100)).toFixed(0)}%`;

  // ItemList 实体：该组出线概率排名（只填真实字段）。
  const groupJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name:
      locale === "zh"
        ? `2026 世界杯 ${X} 组出线形势`
        : `World Cup 2026 Group ${X} — chance to advance`,
    itemListElement: group.table.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: name(t),
      description: locale === "zh" ? `出线概率 ${pct(t.pAdvance)}` : `${pct(t.pAdvance)} chance to advance`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <JsonLd data={groupJsonLd} />
      <div className="flex items-center justify-between">
        <Link href={localeHref(locale, "/calculator")} className="text-xs text-muted">
          {c.back}
        </Link>
      </div>
      <h1 className="font-head mb-1 mt-3 text-2xl font-bold">🧮 {c.h1(X)}</h1>
      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份；EN-first）。 */}
      {group.table[0] && (
        <p className="mt-1 text-sm leading-relaxed">
          {c.lead(X, name(group.table[0]), pct(group.table[0].pAdvance))}
        </p>
      )}
      {lastResult && (
        <p className="mt-1 text-[11px] text-muted">
          {c.latest} · {new Date(lastResult).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
        </p>
      )}
      <p className="mb-4 mt-2 text-xs text-muted">{c.note}</p>

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
                    href={localeHref(locale, `/calculator?team=${teamSlug(t.name)}`)}
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
              <li key={m.id}>
                <Link
                  href={localeHref(locale, `/match/${m.id}`)}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 transition hover:border-green/50"
                >
                  <span>
                    {name(m.home)} vs {name(m.away)}
                  </span>
                  <span className="text-xs text-muted">
                    <LocalTime iso={m.kickoff} locale={locale} mode="datetime" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 space-y-2 text-sm">
        {group.table[2] && (
          <Link
            href={localeHref(locale, `/calculator?team=${teamSlug(group.table[2].name)}`)}
            className="block rounded-lg border border-green/40 bg-surface p-3 text-green"
          >
            {c.cta(name(group.table[2]))}
          </Link>
        )}
        <Link href={localeHref(locale, "/calculator")} className="block rounded-lg border border-border bg-surface p-3">
          {c.tool}
        </Link>
        <Link href={localeHref(locale, "/rules")} className="block rounded-lg border border-border bg-surface-2 p-3 text-muted">
          {locale === "zh" ? "📖 出线规则详解（第三名怎么算）" : "📖 How qualification works (third-place rules)"}
        </Link>
      </div>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
