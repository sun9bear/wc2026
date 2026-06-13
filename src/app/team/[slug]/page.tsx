import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { getTeamDetail, type TeamResult } from "@/lib/prob/getTeamDetail";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
import { HeaderShare } from "@/components/HeaderShare";
import { SetMyTeamButton } from "@/components/SetMyTeamButton";
import { LocalTime } from "@/components/LocalTime";
import { Disclaimer } from "@/components/Disclaimer";

export const maxDuration = 60;

const SITE = "https://www.wc2026.cool";

// 球队详情着陆页（任务 B）：出线/夺冠概率 + 模型实力评分(Elo) + 最近战绩 + 下一场 + 设为主队。
// 48 队 = 48 个 SEO 着陆页（进 sitemap）。实力评分对外只标「模型实力评分」，不写官方排名/身价（版权结论）。

const fmtP = (x: number) => {
  const v = x > 1 ? x : x * 100;
  return v >= 10 ? v.toFixed(0) : v.toFixed(1);
};

const COPY = {
  zh: {
    back: "← 返回",
    title: (nm: string) => `${nm}出线 & 夺冠概率 · 2026 世界杯`,
    desc: (nm: string, adv: string, champ: string) =>
      `${nm}在 2026 世界杯的实时出线概率 ${adv}%、夺冠概率 ${champ}%（万次蒙特卡洛模拟），含模型实力评分、最近战绩与下一场。免费、无需注册。`,
    advance: "出线概率",
    champion: "夺冠概率",
    rating: "模型实力评分",
    ratingNote: "实力评分 = 模型用的 Elo 评分（概率输入因子之一），非官方排名。",
    group: (x: string, r: number) => `${x} 组 · 当前第 ${r}`,
    recent: "最近战绩",
    noRecent: "暂无已完成的比赛",
    next: "下一场",
    noNext: "暂无后续赛程",
    home: "主",
    away: "客",
    W: "胜",
    D: "平",
    L: "负",
    calc: (nm: string) => `🧮 ${nm}还能怎样出线？打开计算器 →`,
    sims: "万次蒙特卡洛模拟（公开预测数据 + Elo 融合），每小时更新",
    latest: "最新赛果",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `2026 世界杯：${nm} 从 ${x} 组出线概率 ${adv}%、夺冠概率 ${champ}%（万次蒙特卡洛模拟）。`,
    shareText: (nm: string, adv: string) => `${nm} 出线概率 ${adv}%（2026 世界杯模型）`,
  },
  en: {
    back: "← Back",
    title: (nm: string) => `${nm} — chance to advance & win · World Cup 2026`,
    desc: (nm: string, adv: string, champ: string) =>
      `${nm}'s live World Cup 2026 chance to advance ${adv}% and to win ${champ}% (10,000 Monte Carlo sims), with model strength rating, recent form and next match. Free, no sign-up.`,
    advance: "Chance to advance",
    champion: "Title chance",
    rating: "Model strength rating",
    ratingNote: "Strength rating = the Elo rating the model uses (one input to its probabilities), not an official ranking.",
    group: (x: string, r: number) => `Group ${x} · currently ${r}${["st", "nd", "rd"][r - 1] ?? "th"}`,
    recent: "Recent form",
    noRecent: "No completed matches yet",
    next: "Next match",
    noNext: "No upcoming fixtures",
    home: "H",
    away: "A",
    W: "W",
    D: "D",
    L: "L",
    calc: (nm: string) => `🧮 How can ${nm} still advance? Open the calculator →`,
    sims: "10,000 Monte Carlo simulations (public forecasting data + Elo), refreshed hourly",
    latest: "Latest result",
    lead: (nm: string, adv: string, champ: string, x: string) =>
      `At the 2026 World Cup, ${nm} has a ${adv}% chance to advance from Group ${x} and a ${champ}% chance to win the title, per a 10,000-run simulation.`,
    shareText: (nm: string, adv: string) => `${nm} has a ${adv}% chance to advance (World Cup 2026 model)`,
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const d = await getTeamDetail(slug).catch(() => null);
  if (!d) return {};
  const c = COPY[locale];
  const nm = locale === "zh" ? d.zh : d.name;
  const og = `/api/og?team=${d.slug}&locale=${locale}&u=${encodeURIComponent(`/team/${d.slug}`)}`;
  return {
    title: c.title(nm),
    description: c.desc(nm, fmtP(d.pAdvance), fmtP(d.pChampion)),
    alternates: { canonical: `${SITE}/team/${d.slug}` },
    openGraph: { title: c.title(nm), images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

function ResultChip({
  r,
  c,
  locale,
}: {
  r: TeamResult;
  c: { home: string; away: string; W: string; D: string; L: string };
  locale: "zh" | "en";
}) {
  const color = r.outcome === "W" ? "text-green" : r.outcome === "L" ? "text-red" : "text-amber";
  const oppName = locale === "zh" ? r.oppZh : r.oppName;
  return (
    <Link
      href={`/match/${r.matchId}`}
      className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm transition hover:border-green/50"
    >
      <span className="flex items-center gap-2">
        <span className={`font-head w-4 shrink-0 font-bold ${color}`}>{c[r.outcome]}</span>
        <span className="text-[10px] text-muted">{r.home ? c.home : c.away}</span>
        {r.oppFlag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.oppFlag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
        )}
        <span className="truncate">{oppName}</span>
      </span>
      <span className="font-head tabular-nums">
        {r.gf}-{r.ga}
      </span>
    </Link>
  );
}

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const d = await getTeamDetail(slug);
  if (!d) notFound();
  const idx = await getSettledIndex().catch(() => null);
  const lastResult = idx?.byTeam[d.id] ?? null; // 真实 settled_at，非伪新鲜
  const c = COPY[locale];
  const nm = locale === "zh" ? d.zh : d.name;
  const adv = fmtP(d.pAdvance);
  const champ = fmtP(d.pChampion);
  const advHigh = (d.pAdvance > 1 ? d.pAdvance : d.pAdvance * 100) >= 50;
  const nextOpp = d.next ? (locale === "zh" ? d.next.oppZh : d.next.oppName) : "";
  const ogUrl = `${SITE}/api/og?team=${d.slug}&locale=${locale}&u=${encodeURIComponent(`/team/${d.slug}`)}`;

  // SportsTeam + 面包屑实体（只填真实字段；实力评分对外不写官方排名）。
  const teamJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsTeam",
        "@id": `${SITE}/team/${d.slug}#team`,
        name: d.name,
        sport: "Soccer",
        url: `${SITE}/team/${d.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: locale === "zh" ? "首页" : "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: nm, item: `${SITE}/team/${d.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <JsonLd data={teamJsonLd} />
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-muted">
          {c.back}
        </Link>
        <HeaderShare
          locale={locale}
          shareUrl={`${SITE}/team/${d.slug}`}
          text={c.shareText(nm, adv)}
          ogUrl={ogUrl}
          source="team"
        />
      </div>

      {/* 主体卡：国旗 + 队名 + 组/排名 */}
      <div className="mt-3 flex items-center gap-4 rounded-lg border border-border bg-surface p-5">
        {d.flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.flag.replace("/w80/", "/w160/")} alt="" className="h-12 w-16 rounded-sm object-cover ring-1 ring-border" />
        ) : (
          <span className="text-5xl">⚽</span>
        )}
        <div>
          <h1 className="font-head text-2xl font-bold">{nm}</h1>
          <div className="text-xs text-muted">{c.group(d.letter, d.rank)}</div>
        </div>
      </div>

      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份；EN-first）+ 最新赛果（真实 settled_at）。 */}
      <p className="mt-3 text-sm leading-relaxed">{c.lead(nm, adv, champ, d.letter)}</p>
      {lastResult && (
        <p className="mt-1 text-[11px] text-muted">
          {c.latest} · {new Date(lastResult).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
        </p>
      )}

      {/* 概率 + 实力评分 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className={`font-head text-3xl font-bold ${advHigh ? "text-green" : "text-amber"}`}>{adv}%</div>
          <div className="mt-1 text-[11px] text-muted">{c.advance}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="font-head text-3xl font-bold text-gold">{champ}%</div>
          <div className="mt-1 text-[11px] text-muted">{c.champion}</div>
        </div>
        <div className="rounded-md border border-border bg-surface-2 p-4">
          <div className="font-head text-3xl font-bold">{d.rating}</div>
          <div className="mt-1 text-[11px] text-muted">{c.rating}</div>
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-muted">{c.ratingNote}</p>

      <div className="mt-4">
        <SetMyTeamButton slug={d.slug} locale={locale} />
      </div>

      {/* 下一场 */}
      <h2 className="font-head mb-2 mt-6 text-sm font-semibold">{c.next}</h2>
      {d.next ? (
        <Link
          href={`/match/${d.next.matchId}`}
          className="flex items-center justify-between rounded-lg border border-green/40 bg-surface p-3 text-sm transition hover:border-green"
        >
          <span className="flex items-center gap-2">
            <span className="text-[10px] text-muted">{d.next.home ? c.home : c.away}</span>
            {d.next.oppFlag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.next.oppFlag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
            )}
            <span>{nextOpp}</span>
          </span>
          <span className="text-xs text-muted">
            <LocalTime iso={d.next.kickoff} locale={locale} mode="datetime" />
          </span>
        </Link>
      ) : (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted">{c.noNext}</p>
      )}

      {/* 最近战绩 */}
      <h2 className="font-head mb-2 mt-6 text-sm font-semibold">{c.recent}</h2>
      {d.recent.length > 0 ? (
        <div className="space-y-1.5">
          {d.recent.map((r) => (
            <ResultChip key={r.matchId} r={r} c={c} locale={locale} />
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-border bg-surface-2 p-3 text-sm text-muted">{c.noRecent}</p>
      )}

      {/* 交叉链接：计算器 */}
      <Link
        href={`/calculator?team=${d.slug}`}
        className="mt-6 block rounded-lg border border-border bg-surface p-3 text-sm text-green"
      >
        {c.calc(nm)}
      </Link>
      <Link
        href={`/calculator/group/${d.letter.toLowerCase()}`}
        className="mt-2 block rounded-lg border border-border bg-surface p-3 text-sm text-muted"
      >
        {locale === "zh" ? `🧮 看 ${d.letter} 组完整出线形势 →` : `🧮 See full Group ${d.letter} scenarios →`}
      </Link>
      <Link href="/rules" className="mt-2 block rounded-lg border border-border bg-surface p-3 text-sm text-muted">
        {locale === "zh" ? "📖 出线规则详解（第三名怎么算）" : "📖 How World Cup 2026 qualification works"}
      </Link>

      <p className="mt-4 text-[10px] text-muted">{c.sims}</p>

      <footer className="mt-6 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
