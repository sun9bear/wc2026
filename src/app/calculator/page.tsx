import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam, teamSlug } from "@/lib/prob/findTeam";
import { ThirdCalculator } from "@/components/ThirdCalculator";
import { CalculatorFocus } from "@/components/CalculatorFocus";
import { HeaderShare } from "@/components/HeaderShare";

export const maxDuration = 60;

const SITE = "https://www.wc2026.cool";

const COPY = {
  zh: {
    title: "第三名出线计算器 · 2026 世界杯（我的队还有戏吗）",
    description:
      "点选剩余小组赛结果，实时计算 12 个小组排名与 8 个最佳第三名晋级形势——2026 世界杯 48 队新赛制专用工具。",
    teamTitle: (zh: string) => `${zh}怎样才能出线？2026 世界杯第三名计算器`,
    teamDesc: (zh: string) =>
      `${zh}的出线形势实时计算：改任意剩余赛果，立即看 ${zh} 在小组与最佳第三名榜的位置变化。免费、无需注册。`,
    h1: "第三名出线计算器",
    back: "← 返回",
    forecast: "📊 看模型概率版 →",
  },
  en: {
    title: "World Cup 2026 Third-Place Scenario Calculator — Who Advances?",
    description:
      "Pick the remaining group-stage results and instantly see all 12 tables and which 8 best third-placed teams advance under the new 48-team format.",
    teamTitle: (name: string) => `Can ${name} still advance? World Cup 2026 scenario calculator`,
    teamDesc: (name: string) =>
      `Live qualification scenarios for ${name}: flip any remaining result and instantly see where ${name} lands in the group and best-thirds race. Free, no sign-up.`,
    h1: "Third-Place Scenario Calculator",
    back: "← Back",
    forecast: "📊 See model probabilities →",
  },
} as const;

// 12 支热门队（北美主场三强 + 传统豪门 + 东亚），slug 与 DB 英文名对应
const HOT = [
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Japan",
  "South Korea",
  "England",
  "France",
  "Spain",
  "Portugal",
  "Germany",
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}): Promise<Metadata> {
  const { team = "" } = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];
  if (team) {
    try {
      const data = await getForecast();
      const hit = findTeam(data, team);
      if (hit) {
        const nm = locale === "zh" ? hit.team.zh : hit.team.name;
        const og = `/api/og?team=${teamSlug(hit.team.name)}&locale=${locale}`;
        return {
          title: c.teamTitle(nm),
          description: c.teamDesc(nm),
          // ?team= 变体合并到 /calculator（同一工具、不入 sitemap，避免近重复页）。
          alternates: localizedAlternates("/calculator", locale),
          openGraph: { images: [{ url: og, width: 1200, height: 630 }] },
          twitter: { card: "summary_large_image", images: [og] },
        };
      }
    } catch {
      /* 降级为通用 meta */
    }
  }
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/calculator", locale),
  };
}

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team = "" } = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];
  const data = await getForecast();

  const groups = data.groups.map((g) => ({
    letter: g.letter,
    teams: g.table.map((t) => ({ id: t.id, name: t.name, zh: t.zh, flag: t.flag })),
  }));
  const remaining = data.matches.map((m) => ({
    id: m.id,
    homeId: m.homeId,
    awayId: m.awayId,
    likely: m.likely,
  }));

  const hit = team ? findTeam(data, team) : null;
  const allTeams = data.groups
    .flatMap((g) => g.table)
    .map((t) => ({ name: t.name, zh: t.zh, slug: teamSlug(t.name) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const hotTeams = HOT.map((n) => allTeams.find((t) => t.name === n)).filter(
    (x): x is { name: string; zh: string; slug: string } => !!x
  );

  // 页眉分享（任务 A）：选了队 → 该队 OG 卡（zh 带二维码）；未选 → 仅链接分享整页。
  const focusSlug = hit ? teamSlug(hit.team.name) : null;
  const shareUrl = focusSlug
    ? selfUrl(`/calculator?team=${focusSlug}`, locale)
    : selfUrl("/calculator", locale);
  const shareText = hit
    ? locale === "zh"
      ? `${hit.team.zh}出线概率 ${(hit.team.pAdvance > 1 ? hit.team.pAdvance : hit.team.pAdvance * 100).toFixed(0)}% · 自己改一版剩余赛果`
      : `${hit.team.name} chance to advance — flip remaining results yourself`
    : locale === "zh"
      ? "2026 世界杯出线计算器（我的队还有戏吗）"
      : "World Cup 2026 scenario calculator";
  const shareOg = focusSlug
    ? `${SITE}/api/og?team=${focusSlug}&locale=${locale}&u=${encodeURIComponent(localeHref(locale, `/calculator?team=${focusSlug}`))}`
    : null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between gap-2">
        <Link href={localeHref(locale, "/")} className="shrink-0 text-xs text-muted">
          {c.back}
        </Link>
        <div className="flex items-center gap-2">
          <Link href={localeHref(locale, "/forecast")} className="shrink-0 text-xs text-green">
            {c.forecast}
          </Link>
          <HeaderShare
            locale={locale}
            shareUrl={shareUrl}
            text={shareText}
            ogUrl={shareOg}
            source="calculator"
          />
        </div>
      </div>
      <h1 className="font-head mb-4 mt-3 text-2xl font-bold">🧮 {c.h1}</h1>
      <CalculatorFocus
        locale={locale}
        hot={hotTeams}
        all={allTeams}
        focus={
          hit
            ? {
                name: hit.team.name,
                zh: hit.team.zh,
                flag: hit.team.flag,
                letter: hit.letter,
                rank: hit.rank,
                pAdvance: hit.team.pAdvance,
                pChampion: hit.team.pChampion,
                slug: teamSlug(hit.team.name),
              }
            : null
        }
      />
      <ThirdCalculator
        locale={locale}
        groups={groups}
        played={data.played}
        remaining={remaining}
        rating={data.rating}
        focusLetter={hit?.letter ?? null}
      />
    </main>
  );
}
