import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getForecast } from "@/lib/prob/pipeline";
import { ThirdCalculator } from "@/components/ThirdCalculator";

export const maxDuration = 60;

const COPY = {
  zh: {
    title: "第三名出线计算器 · 2026 世界杯（我的队还有戏吗）",
    description:
      "点选剩余小组赛结果，实时计算 12 个小组排名与 8 个最佳第三名晋级形势——2026 世界杯 48 队新赛制专用工具。",
    h1: "第三名出线计算器",
    back: "← 返回",
    forecast: "📊 看模型概率版 →",
  },
  en: {
    title: "World Cup 2026 Third-Place Scenario Calculator — Who Advances?",
    description:
      "Pick the remaining group-stage results and instantly see all 12 tables and which 8 best third-placed teams advance under the new 48-team format.",
    h1: "Third-Place Scenario Calculator",
    back: "← Back",
    forecast: "📊 See model probabilities →",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: COPY[locale].title, description: COPY[locale].description };
}

export default async function CalculatorPage() {
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

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-muted">
          {c.back}
        </Link>
        <Link href="/forecast" className="text-xs text-green">
          {c.forecast}
        </Link>
      </div>
      <h1 className="font-head mb-4 mt-3 text-2xl font-bold">🧮 {c.h1}</h1>
      <ThirdCalculator
        locale={locale}
        groups={groups}
        played={data.played}
        remaining={remaining}
        rating={data.rating}
      />
    </main>
  );
}
