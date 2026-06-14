import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getForecast, type ForecastData } from "@/lib/prob/pipeline";
import { JsonLd } from "@/lib/seo/jsonLd";
import { getSettledIndex } from "@/lib/seo/freshness";
import { R32, allocateThirds } from "@/lib/prob/bracket";
import { Disclaimer } from "@/components/Disclaimer";
import { localeHref } from "@/i18n";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";

export const maxDuration = 60; // 复用 getForecast() 共享缓存（含外部抓取 + 万次模拟）

// 最佳第三名实时着陆页：12 个小组第三名横排（前 8 晋级 32 强）+ FIFA Annex C 的
// C(12,8)=495 行「第三名 → 小组第一」对阵映射。数据源 getForecast().thirds（排名判据与
// src/lib/prob/standings.ts 一致：积分→净胜→进球→评分→随机，跨组不可比、无相互战绩）。
// 规则全文见 /rules；改任意赛果实时重算见 /calculator。前置答案 EN-first（GEO）。

const COPY = {
  zh: {
    title: "2026 世界杯最佳第三名排名：12 组第三谁能出线（前 8 晋级）",
    description:
      "12 个小组第三名实时横排榜——按 2026 官方判据（积分 / 净胜 / 进球）排名，前 8 名晋级 32 强；含 FIFA Annex C 第三名对阵小组第一的映射，赛果落库后自动更新。",
    h1: "最佳第三名排名",
    updated: "更新于",
    intro:
      "12 个小组各有一支第三名球队，其中成绩最好的 8 支晋级 32 强。横排只比积分、净胜球、进球数（跨组不可比，无小组内相互战绩）。",
    rankH: "12 个小组第三名横排（前 8 晋级）",
    rankNote: "按当前真实战绩排名；虚线下方为暂时出局。点队名进对应小组页。",
    advanceLabel: "出线概率",
    mapH: "若当前形势成立：第三名 vs 小组第一对阵",
    mapNote:
      "8 个晋级的小组第三名按 FIFA Annex C 的 495 种组合表分配给 8 个小组第一，确保不与同组第一相遇。",
    ctaH: "想看你的队怎样才能挤进前 8？",
    ctaBody: "用出线计算器改任意未赛赛果，立即看最佳第三名榜如何变化。",
    calc: "🧮 打开第三名出线计算器 →",
    forecast: "📊 全部出线 & 夺冠概率 →",
    rules: "📖 2026 世界杯赛制与出线规则详解 →",
    back: "← 返回",
    method:
      "排名按 2026 官方新规（积分 → 净胜球 → 进球 → 公平竞赛分 → FIFA 排名 → 抽签）；公平竞赛分无红黄牌数据故跳过，FIFA 排名一档以模型实力评分（Elo）近似，最终以随机抽签兜底。出线概率来自万次蒙特卡洛模拟。",
    fun: "全部概率仅供娱乐参考，不构成任何建议。",
    na: "—",
    naMsg: "数据暂不可用，请稍后再试 / Data temporarily unavailable.",
  },
  en: {
    title: "World Cup 2026 best third-placed teams: who advances (top 8)",
    description:
      "Live ranking of the 12 third-placed teams — sorted by the 2026 official tiebreakers (points / goal difference / goals); the top 8 advance to the Round of 32. Includes FIFA's Annex C third-place to group-winner mapping, updated after each result.",
    h1: "Best third-placed teams",
    updated: "Updated",
    intro:
      "Each of the 12 groups has a third-placed team; the 8 best of them advance to the Round of 32. They are compared only on points, goal difference and goals scored (cross-group, with no head-to-head).",
    rankH: "All 12 third-placed teams ranked (top 8 advance)",
    rankNote: "Ranked on actual results so far; below the dashed line = currently out. Tap a team for its group page.",
    advanceLabel: "Chance to advance",
    mapH: "If the current standings hold: third-place Round-of-32 matchups",
    mapNote:
      "The 8 qualifying third-placed teams are assigned to 8 group winners via FIFA's 495-combination Annex C table, so a third never meets the winner of its own group.",
    ctaH: "Want to see how your team can sneak into the top 8?",
    ctaBody: "Flip any remaining result in the scenario calculator and watch the best third-placed race update live.",
    calc: "🧮 Open the third-place scenario calculator →",
    forecast: "📊 All advancement & title probabilities →",
    rules: "📖 2026 World Cup format & qualification rules →",
    back: "← Back",
    method:
      "Ranked by the 2026 official tiebreakers (points → goal difference → goals → fair-play → FIFA ranking → drawing of lots); fair-play card data is unavailable so that step is skipped, and the FIFA-ranking step is approximated by the model strength rating (Elo), with a random draw as the final fallback. Advancement chances come from a 10,000-run Monte Carlo simulation.",
    fun: "All probabilities are for entertainment only.",
    na: "—",
    naMsg: "数据暂不可用，请稍后再试 / Data temporarily unavailable.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: COPY[locale].title,
    description: COPY[locale].description,
    alternates: localizedAlternates("/forecast/best-thirds", locale),
  };
}

function pct(p: number, digits = 0): string {
  return (p * 100).toFixed(digits) + "%";
}

function TeamName({
  t,
  zhFirst,
}: {
  t: { name: string; zh: string; flag: string | null };
  zhFirst: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {t.flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
      )}
      {zhFirst ? t.zh : t.name}
    </span>
  );
}

export default async function BestThirdsPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const zhFirst = locale === "zh";
  let data: ForecastData | null = null;
  try {
    data = await getForecast();
  } catch {
    data = null;
  }

  if (!data || data.thirds.length === 0) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="font-head text-2xl font-bold">🥉 {c.h1}</h1>
        <p className="mt-4 text-sm text-muted">{c.naMsg}</p>
      </main>
    );
  }

  const thirds = data.thirds;
  const idx = await getSettledIndex().catch(() => null);

  // 每队 Monte-Carlo 出线概率（仅 simOk 时有意义）：按 teamId 关联到小组表。
  const pAdvanceById = new Map<string, number>(
    data.groups.flatMap((g) => g.table).map((t) => [t.id, t.pAdvance] as const)
  );

  // 若当前前 8 第三名成立 → Annex C 槽位指派（slot 组第一 ↔ 第三名来源组）。
  // allocateThirds 需正好 8 个去重组字母；任何 8/12 组合都在 495 行表内。出错则不渲染该块。
  const qualifiedLetters = thirds.filter((t) => t.rank <= 8).map((t) => t.letter);
  let thirdFixtures: { match: number; winner: string; source: string }[] = [];
  try {
    if (qualifiedLetters.length === 8 && new Set(qualifiedLetters).size === 8) {
      const alloc = allocateThirds(qualifiedLetters); // slot -> source group
      thirdFixtures = R32.filter((f) => f.away.kind === "third")
        .map((f) => {
          const slot = f.away.kind === "third" ? f.away.slot : "";
          const winner = f.home.kind === "winner" ? f.home.group : slot;
          return { match: f.match, winner, source: alloc[slot] };
        })
        .filter((x) => Boolean(x.source))
        .sort((a, b) => a.match - b.match);
    }
  } catch {
    thirdFixtures = [];
  }

  // ItemList 结构化数据（排名实体；只填真字段，dateModified 用真实 settled_at）。
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.title,
    description: c.description,
    url: selfUrl("/forecast/best-thirds", locale),
    numberOfItems: thirds.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    ...(idx?.all ? { dateModified: idx.all } : {}),
    itemListElement: thirds.map((t) => ({
      "@type": "ListItem",
      position: t.rank,
      name: zhFirst ? t.zh : t.name,
    })),
  };

  const leader = thirds[0];
  const leaderName = zhFirst ? leader.zh : leader.name;
  const cut = thirds.find((t) => t.rank === 8);
  const cutName = cut ? (zhFirst ? cut.zh : cut.name) : c.na;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <JsonLd data={itemListJsonLd} />
      <Link href={localeHref(locale, "/forecast")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">🥉 {c.h1}</h1>
      {idx?.all && (
        <p className="mt-1 text-[11px] text-muted">
          {c.updated} {new Date(idx.all).toLocaleString(zhFirst ? "zh-CN" : "en-US")}
        </p>
      )}

      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份信号；EN-first，爬虫见英文）。 */}
      {cut && (
        <p className="mt-3 rounded-lg border border-green/30 bg-surface p-4 text-sm leading-relaxed">
          {zhFirst
            ? `2026 世界杯最佳第三名排名：${leaderName} 目前以 ${leader.pts} 分领跑 12 个小组第三名；成绩最好的 8 支晋级 32 强，当前出线分数线为 ${cut.pts} 分（${cutName}）。`
            : `At the 2026 World Cup, ${leaderName} currently leads the 12 third-placed teams with ${leader.pts} points; the best 8 advance to the Round of 32, with the cut-off at ${cut.pts} points (${cutName}).`}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-text/90">{c.intro}</p>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.rankH}</h2>
        <p className="mb-2 text-[10px] text-muted">{c.rankNote}</p>
        <div className="rounded-lg border border-border bg-surface p-3">
          {thirds.map((t) => {
            const pa = pAdvanceById.get(t.id);
            return (
              <Link
                key={t.id}
                href={localeHref(locale, `/calculator/group/${t.letter.toLowerCase()}`)}
                className={`flex items-center justify-between py-1 text-sm transition hover:text-green ${
                  t.rank === 8 ? "border-b border-dashed border-green/60 pb-2" : ""
                } ${t.rank > 8 ? "opacity-50" : ""}`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="font-head w-5 text-right text-xs text-muted">{t.rank}</span>
                  <TeamName t={t} zhFirst={zhFirst} />
                  <span className="text-[10px] text-muted">{t.letter}</span>
                </span>
                <span className="text-[11px] text-muted">
                  {t.pts}pts · GD{t.gd >= 0 ? "+" : ""}
                  {t.gd}
                  {data.simOk && typeof pa === "number" && (
                    <span className="font-head ml-2 text-green">{pct(pa)}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {thirdFixtures.length > 0 && (
        <section className="mt-7">
          <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.mapH}</h2>
          <p className="mb-2 text-[10px] text-muted">{c.mapNote}</p>
          <div className="space-y-1 rounded-lg border border-border bg-surface p-3 text-sm">
            {thirdFixtures.map((f) => (
              <div key={f.match} className="flex items-center justify-between py-0.5">
                <span>
                  {zhFirst
                    ? `${f.winner} 组第一 vs `
                    : `Winner Group ${f.winner} vs `}
                  <Link
                    href={localeHref(locale, `/calculator/group/${f.source.toLowerCase()}`)}
                    className="text-green transition hover:underline"
                  >
                    {zhFirst ? `${f.source} 组第三` : `3rd of Group ${f.source}`}
                  </Link>
                </span>
                <span className="font-head text-[10px] text-muted">M{f.match}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-head mb-1 text-sm font-semibold">{c.ctaH}</h2>
        <p className="text-sm leading-relaxed text-text/90">{c.ctaBody}</p>
        <div className="mt-3 space-y-2">
          <Link
            href={localeHref(locale, "/calculator")}
            className="block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
          >
            {c.calc}
          </Link>
          <Link
            href={localeHref(locale, "/forecast")}
            className="block rounded-md border border-border px-3 py-2 text-sm text-text/90"
          >
            {c.forecast}
          </Link>
          <Link
            href={localeHref(locale, "/rules")}
            className="block rounded-md border border-border px-3 py-2 text-sm text-text/90"
          >
            {c.rules}
          </Link>
        </div>
      </section>

      <footer className="mt-8 space-y-2 text-center text-[10px] leading-relaxed text-muted">
        <p>{c.method}</p>
        <p>{c.fun}</p>
        <Disclaimer />
      </footer>
    </main>
  );
}
