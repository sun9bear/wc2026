import Link from "next/link";
import { after } from "next/server";
import { getMatches } from "@/lib/matches/getMatches";
import { MatchList } from "@/components/MatchList";
import { MatchCard } from "@/components/MatchCard";
import { Disclaimer } from "@/components/Disclaimer";
import { getDict } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { maybeAutoSettle } from "@/lib/settlement/autoSettle";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const locale = await getLocale();
  const t = getDict(locale);
  const all = await getMatches();

  // 流量自驱动结算：每个首页请求后台检查一次（10 分钟节流、幂等），
  // 修复"每日 cron 只跑一次→比分滞后 24h+"的架构缺陷。响应后执行，不拖慢页面。
  after(() => maybeAutoSettle());

  const now = Date.now();
  const focus =
    all.find(
      (m) => m.status !== "settled" && new Date(m.kickoffAt).getTime() > now
    ) ?? null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-5">
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
        <p className="mt-1 text-sm text-muted">{t.hero.valueProp}</p>
      </header>

      {/* 主入口：第三名出线计算器（独家资产，纯链接，与概率侧分屏隔离不冲突) */}
      <Link
        href="/calculator"
        className="mb-4 block rounded-lg border border-green/40 bg-surface p-4 transition hover:border-green"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-head text-lg font-bold">🧮 {t.hero.calcHook}</div>
            <div className="mt-0.5 text-xs text-muted">{t.hero.calcSub}</div>
          </div>
          <span className="shrink-0 rounded-pill bg-green px-3 py-1.5 text-xs font-bold text-[#06231a]">
            {t.hero.calcCta}
          </span>
        </div>
      </Link>

      {/* 次入口：今晚焦点战，直达预测 */}
      {focus && (
        <section className="mb-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
            <span>⚡ {t.hero.focusTitle}</span>
            <span className="text-green">{t.hero.focusCta}</span>
          </div>
          <MatchCard match={focus} locale={locale} />
        </section>
      )}

      {/* 新人积分可见化 + 次级链接 */}
      <p className="mb-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-center text-[11px] text-muted">
        {t.hero.pointsBanner}
      </p>
      <div className="mb-6 flex justify-center gap-4 text-xs">
        <Link href="/combo" className="text-muted hover:text-green">
          {t.hero.comboLink}
        </Link>
        <Link href="/watch" className="text-muted hover:text-green">
          {t.hero.watchLink}
        </Link>
      </div>

      <div className="mb-5 flex items-center gap-2 text-xs">
        <span className="font-head text-sm font-semibold">📅 {t.hero.todaySchedule}</span>
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

      <MatchList matches={all} locale={locale} filter={filter} />

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
