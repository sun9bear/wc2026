import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { Disclaimer } from "@/components/Disclaimer";

// 常青解释页：2026 新赛制 + 出线/第三名判据（最高需求×最低竞争长尾，最佳 AI 引用候选）。
// 判据严格对齐 src/lib/prob/standings.ts（已逐字核对 FIFA 规程）：组内相互战绩优先，第三名横排无相互战绩。

const COPY = {
  zh: {
    title: "2026 世界杯赛制与出线规则详解：48 队、12 组、8 个最佳第三名",
    description:
      "2026 世界杯新赛制完整说明：48 队分 12 组，每组前两名加 8 个最佳第三名晋级 32 强淘汰赛。含小组排名与最佳第三名的官方决胜判据。",
    h1: "2026 世界杯赛制与出线规则",
    tldr:
      "2026 世界杯共 48 支球队，分 12 个小组、每组 4 队。每组前两名（24 队）加上 12 个小组第三里最好的 8 个，共 32 队晋级新设的「32 强」淘汰赛。换句话说：一支球队可以输一场、平一场、小组排名第三，仍然出线——理论上甚至一路夺冠。",
    formatH: "赛制概览",
    formatBody:
      "全程 104 场比赛。小组赛阶段 12 组 × 4 队。小组赛后：每组前 2 名直接晋级（24 队）+ 12 个小组第三名中排名最高的 8 个（8 队）= 32 队进入 32 强（Round of 32），随后 16 强、8 强、4 强、决赛，均为单场淘汰。",
    groupH: "小组排名判据（相互战绩优先）",
    groupIntro: "同一小组内排名，依次比较：",
    groupList: [
      "全部小组赛积分（胜 3 分、平 1 分、负 0 分）。",
      "若有球队积分相同，先比这些同分球队「彼此之间」的：相互战绩积分 → 相互战绩净胜球 → 相互战绩进球。",
      "全部小组赛净胜球。",
      "全部小组赛进球总数。",
      "公平竞赛分（黄牌 −1、间接红牌 −3、直接红牌 −4、先黄后红 −5；扣分越少越靠前）。",
      "FIFA 世界排名；若仍无法区分，则抽签。",
    ],
    thirdH: "最佳第三名排名（12 取 8）",
    thirdIntro:
      "12 个小组第三名横向比较，取最好的 8 个晋级。由于它们来自不同小组、彼此没有交手，这里没有「相互战绩」一项，判据依次为：",
    thirdList: [
      "积分。",
      "净胜球。",
      "进球总数。",
      "公平竞赛分。",
      "FIFA 世界排名；仍并列则抽签。",
    ],
    thirdNote:
      "至于具体哪 8 个第三名、分别进入 32 强对阵表的哪个位置，由 FIFA 赛前确定的对照表按「哪些小组的第三名出线」的组合查表决定。",
    fairNote:
      "说明：公平竞赛分需要红黄牌数据。本站模型在缺少该数据时，以「模型实力评分」近似最末几项判据，页面均有标注——这对出线概率影响极小（只在前面所有判据都打平时才生效）。",
    ctaH: "我的队还能出线吗？",
    ctaBody:
      "用实时出线计算器改动任意剩余赛果，立刻看 12 个小组排名与最佳第三名榜如何变化；或直接看模型对每支球队的出线 / 夺冠概率。",
    calc: "🧮 打开第三名出线计算器 →",
    forecast: "📊 看出线 & 夺冠概率 →",
    back: "← 返回",
  },
  en: {
    title: "World Cup 2026 format & qualification rules explained (48 teams, 12 groups, 8 best thirds)",
    description:
      "How the new 2026 World Cup works: 48 teams in 12 groups, top two plus the 8 best third-placed teams advance to a 32-team knockout round. Includes the official group and best-third tie-breakers.",
    h1: "World Cup 2026 Format & Qualification Rules",
    tldr:
      "The 2026 World Cup has 48 teams in 12 groups of four. The top two of every group (24 teams) plus the 8 best third-placed teams advance to a new 32-team knockout round (the Round of 32). In other words: a team can lose one match, draw one, finish third in its group, and still advance — and in theory go on to win the whole thing.",
    formatH: "Format at a glance",
    formatBody:
      "104 matches in total. Group stage: 12 groups of 4. After the group stage, the top 2 of each group qualify directly (24 teams) plus the 8 highest-ranked of the 12 third-placed teams (8 teams) = 32 teams in the Round of 32, then the Round of 16, quarter-finals, semi-finals and final — all single-elimination.",
    groupH: "Group ranking tie-breakers (head-to-head first)",
    groupIntro: "Within a group, teams are ranked by, in order:",
    groupList: [
      "Most points in all group matches (win 3, draw 1, loss 0).",
      "If teams are level on points, the head-to-head record among only those tied teams is used first: head-to-head points then head-to-head goal difference then head-to-head goals scored.",
      "Goal difference across all group matches.",
      "Goals scored across all group matches.",
      "Fair-play points (yellow minus 1, indirect red minus 3, direct red minus 4, yellow-then-red minus 5; fewer deductions ranks higher).",
      "FIFA World Ranking; if still level, a drawing of lots.",
    ],
    thirdH: "Best third-placed teams (8 of 12 advance)",
    thirdIntro:
      "The 12 third-placed teams are compared across groups, and the best 8 advance. Because they come from different groups and have not played each other, there is no head-to-head step here; the criteria are, in order:",
    thirdList: [
      "Points.",
      "Goal difference.",
      "Goals scored.",
      "Fair-play points.",
      "FIFA World Ranking; a drawing of lots if still level.",
    ],
    thirdNote:
      "Exactly which 8 third-placed teams advance, and which Round-of-32 slot each takes, is set by a pre-determined FIFA table based on which groups' third-placed teams qualify.",
    fairNote:
      "Note: fair-play points require yellow/red-card data. Where that data is unavailable, this site's model approximates the lowest tie-breakers with its model strength rating (labelled on every page) — this barely affects advancement odds, since it only applies when every earlier criterion is tied.",
    ctaH: "Can my team still advance?",
    ctaBody:
      "Flip any remaining result in the live scenario calculator and instantly see how all 12 group tables and the best-thirds race change — or read the model's chance to advance and to win the title for every team.",
    calc: "🧮 Open the third-place scenario calculator →",
    forecast: "📊 See advancement & title probabilities →",
    back: "← Back",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: "https://www.wc2026.cool/rules" },
  };
}

export default async function RulesPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">{c.h1}</h1>

      {/* 前置可提取答案 / TL;DR（GEO：答案前置 + 统计数字 + 年份）。 */}
      <p className="mt-3 rounded-lg border border-green/30 bg-surface p-4 text-sm leading-relaxed">
        {c.tldr}
      </p>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.formatH}</h2>
        <p className="text-sm leading-relaxed text-text/90">{c.formatBody}</p>
      </section>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.groupH}</h2>
        <p className="mb-2 text-sm text-text/90">{c.groupIntro}</p>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm leading-relaxed text-text/90">
          {c.groupList.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.thirdH}</h2>
        <p className="mb-2 text-sm text-text/90">{c.thirdIntro}</p>
        <ol className="ml-5 list-decimal space-y-1.5 text-sm leading-relaxed text-text/90">
          {c.thirdList.map((li, i) => (
            <li key={i}>{li}</li>
          ))}
        </ol>
        <p className="mt-2 text-xs leading-relaxed text-muted">{c.thirdNote}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">{c.fairNote}</p>
      </section>

      <section className="mt-7 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-head mb-1 text-sm font-semibold">{c.ctaH}</h2>
        <p className="text-sm leading-relaxed text-text/90">{c.ctaBody}</p>
        <div className="mt-3 space-y-2">
          <Link
            href="/calculator"
            className="block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
          >
            {c.calc}
          </Link>
          <Link
            href="/forecast"
            className="block rounded-md border border-border px-3 py-2 text-sm text-text/90"
          >
            {c.forecast}
          </Link>
        </div>
      </section>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
