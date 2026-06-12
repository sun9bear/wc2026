import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getForecast, type ForecastData } from "@/lib/prob/pipeline";

export const maxDuration = 60; // 首次计算含外部抓取+万次模拟

const COPY = {
  zh: {
    title: "2026 世界杯出线概率 · 夺冠概率（实时模型）",
    description:
      "基于实力评分与公开预测数据的万次模拟：每队出线概率、夺冠概率、最佳第三名形势与每场胜平负概率，赛后自动更新。",
    h1: "出线 & 夺冠概率",
    updated: "更新于",
    champions: "🏆 夺冠概率 Top 12",
    groups: "小组出线概率",
    thirds: "最佳第三名形势（前 8 晋级）",
    thirdsNote: "按当前真实战绩排名；线下为暂时出局",
    matches: "近期比赛胜平负概率",
    draw: "平局",
    calculatorCta: "🧮 自己动手算：第三名出线计算器 →",
    method:
      "方法：多源公开数据（队伍实力评分、公开预测市场共识）融合 + 泊松比分模型 + 10,000 次蒙特卡洛模拟；排名判据按 2026 官方新规（相互战绩优先），不含公平竞赛分（无红黄牌数据，以实力评分近似末位判据）。",
    fun: "全部概率仅供娱乐参考，不构成任何建议。",
    aiTag: "AI 短评 · 仅供娱乐",
  },
  en: {
    title: "World Cup 2026 Advancement & Title Probabilities (Live Model)",
    description:
      "10,000-run simulation from team strength ratings and public forecasting data: every team's chance to advance, win the title, third-place picture and per-match win probabilities.",
    h1: "Advancement & Title Probabilities",
    updated: "Updated",
    champions: "🏆 Title chances — Top 12",
    groups: "Chance to advance by group",
    thirds: "Best third-placed race (top 8 advance)",
    thirdsNote: "Ranked on actual results so far; below the line = currently out",
    matches: "Upcoming match win probabilities",
    draw: "Draw",
    calculatorCta: "🧮 Try it yourself: third-place scenario calculator →",
    method:
      "Method: fusion of public data (team strength ratings, public forecast consensus) + Poisson score model + 10,000 Monte Carlo runs; 2026 official tiebreakers (head-to-head first), fair-play points approximated by strength rating.",
    fun: "All probabilities are for entertainment only.",
    aiTag: "AI note · for fun only",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: COPY[locale].title, description: COPY[locale].description };
}

function pct(p: number, digits = 0): string {
  return (p * 100).toFixed(digits) + "%";
}

function Bar({ p }: { p: { home: number; draw: number; away: number } }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="bg-green" style={{ width: `${p.home * 100}%` }} />
      <div className="bg-white/25" style={{ width: `${p.draw * 100}%` }} />
      <div className="bg-[#f97316]" style={{ width: `${p.away * 100}%` }} />
    </div>
  );
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

export default async function ForecastPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const zhFirst = locale === "zh";
  let data: ForecastData | null = null;
  try {
    data = await getForecast();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="font-head text-2xl font-bold">📊 {c.h1}</h1>
        <p className="mt-4 text-sm text-muted">数据暂不可用，请稍后再试 / Data temporarily unavailable.</p>
      </main>
    );
  }

  const note = zhFirst ? data.noteZh : data.noteEn;
  const upcoming = data.matches.slice(0, 12);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <h1 className="font-head text-2xl font-bold">📊 {c.h1}</h1>
      <p className="mt-1 text-[11px] text-muted">
        {c.updated} {new Date(data.updatedAt).toLocaleString(zhFirst ? "zh-CN" : "en-US")}
      </p>

      {note && (
        <div className="fade-up mt-3 rounded-lg border border-border bg-surface p-3">
          <div className="mb-1 text-[10px] text-muted">{c.aiTag}</div>
          <p className="text-sm leading-relaxed">{note}</p>
        </div>
      )}

      {data.simOk && (
        <section className="mt-6">
          <h2 className="font-head mb-2 text-sm font-semibold">{c.champions}</h2>
          <div className="space-y-1.5">
            {data.champions.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className="w-32 shrink-0 truncate">
                  <TeamName t={t} zhFirst={zhFirst} />
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-green"
                    style={{ width: `${Math.min(100, t.p * 400)}%` }}
                  />
                </div>
                <span className="font-head w-12 shrink-0 text-right text-green">{pct(t.p, 1)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="font-head mb-2 text-sm font-semibold">{c.matches}</h2>
        <div className="space-y-2">
          {upcoming.map((m) => (
            <div key={m.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <TeamName t={m.home} zhFirst={zhFirst} />
                <span className="text-[10px] text-muted">
                  {new Date(m.kickoff).toLocaleString(zhFirst ? "zh-CN" : "en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <TeamName t={m.away} zhFirst={zhFirst} />
              </div>
              <Bar p={m.p} />
              <div className="mt-1 flex justify-between text-[10px] text-muted">
                <span className="text-green">{pct(m.p.home)}</span>
                <span>
                  {c.draw} {pct(m.p.draw)}
                  {m.topScores[0] &&
                    ` · ${m.topScores[0].h}-${m.topScores[0].a} (${pct(m.topScores[0].p)})`}
                </span>
                <span className="text-[#f97316]">{pct(m.p.away)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="font-head mb-2 text-sm font-semibold">{c.thirds}</h2>
        <p className="mb-2 text-[10px] text-muted">{c.thirdsNote}</p>
        <div className="rounded-lg border border-border bg-surface p-3">
          {data.thirds.map((t) => (
            <div
              key={t.id}
              className={`flex items-center justify-between py-1 text-sm ${
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
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/calculator"
          className="mt-3 inline-block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
        >
          {c.calculatorCta}
        </Link>
      </section>

      {data.simOk && (
        <section className="mt-7">
          <h2 className="font-head mb-2 text-sm font-semibold">{c.groups}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {data.groups.map((g) => (
              <div key={g.letter} className="rounded-lg border border-border bg-surface p-3">
                <div className="font-head mb-1.5 text-xs font-semibold text-muted">
                  Group {g.letter}
                </div>
                {g.table.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-0.5 text-sm">
                    <span className="truncate">
                      <TeamName t={t} zhFirst={zhFirst} />
                    </span>
                    <span className="shrink-0 text-[11px]">
                      <span className="text-muted">{t.pts}pts · </span>
                      <span className="font-head text-green">{pct(t.pAdvance)}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-8 space-y-2 text-center text-[10px] leading-relaxed text-muted">
        <p>{c.method}</p>
        <p>{c.fun}</p>
      </footer>
    </main>
  );
}
