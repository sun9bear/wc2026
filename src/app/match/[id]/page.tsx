import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getMatchDetail } from "@/lib/markets/getMatchDetail";
import { MarketPicks } from "@/components/MarketPicks";
import { MatchProbTrend } from "@/components/MatchProbTrend";
import { MatchSwingShare } from "@/components/MatchSwingShare";
import { SentimentBar } from "@/components/SentimentBar";
import { Disclaimer } from "@/components/Disclaimer";
import { TeamBadge } from "@/components/TeamBadge";
import { LocalTime } from "@/components/LocalTime";
import { result1x2 } from "@/lib/settlement/result";
import { stageName } from "@/lib/football/teams";
import { getMatchSwing, swingOgPath } from "@/lib/prob/getMatchSwing";
import { getDict } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { maybeAutoSettle } from "@/lib/settlement/autoSettle";

const SITE = "https://www.wc2026.cool";

// 已结算且出现"爆冷"（出线概率大摆动）时，把本场链接的 og:image 设为摆动卡——
// 分享到 X/微信/Telegram 即自动展开成震撼图卡。非爆冷场次继承默认 metadata。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  let swing = null;
  try {
    swing = await getMatchSwing(id);
  } catch {
    swing = null;
  }
  if (!swing) return {};
  const locale = await getLocale();
  const ogUrl = `${SITE}${swingOgPath(swing, locale)}`;
  const heroName = locale === "zh" ? swing.hero.zh : swing.hero.name;
  const bp = Math.round(swing.hero.before * 100);
  const ap = Math.round(swing.hero.after * 100);
  const title =
    locale === "zh"
      ? `爆冷！${swing.homeZh} ${swing.homeScore}-${swing.awayScore} ${swing.awayZh} · wc2026.cool`
      : `Upset! ${swing.homeName} ${swing.homeScore}-${swing.awayScore} ${swing.awayName} · wc2026.cool`;
  const description =
    locale === "zh"
      ? `${heroName}出线概率 ${bp}% → ${ap}%。世界杯 2026 实时模型，免费无需注册。`
      : `${heroName}'s chance to advance ${bp}% → ${ap}%. Live World Cup 2026 model, free, no sign-up.`;
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const m = await getMatchDetail(id);
  if (!m) notFound();

  // 流量自驱动结算（响应后执行；详情页是赛后回访的高频落点）
  after(() => maybeAutoSettle());

  const settled = m.status === "settled" && m.homeScore != null && m.awayScore != null;
  const started = new Date(m.kickoffAt).getTime() <= Date.now();
  const open = !settled && !started;
  // 「爆冷瞬间」摆动卡：仅已结算且出线概率大摆动时返回非 null（缓存读快照，失败降级 null）。
  const swing = settled ? await getMatchSwing(id).catch(() => null) : null;
  const resultLabel: Record<string, string> = {
    home: t.match.home,
    draw: t.match.draw,
    away: t.match.away,
  };

  // AI 内容：EN 视图优先英文版（Gemini 生成，平铺展示）；无英文版则折叠中文，避免满屏中文破相。
  const AiBlock = ({
    tag,
    foldTag,
    body,
    bodyEn,
  }: {
    tag: string;
    foldTag: string;
    body: string | null;
    bodyEn: string | null;
  }) => {
    if (locale === "en" && bodyEn) {
      return (
        <div className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
          <div className="mb-1 text-[11px] text-muted">{tag}</div>
          <p className="text-sm leading-relaxed">{bodyEn}</p>
        </div>
      );
    }
    if (!body) return null;
    return locale === "en" ? (
      <details className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-[11px] text-muted">{foldTag}</summary>
        <p className="mt-2 text-sm leading-relaxed">{body}</p>
      </details>
    ) : (
      <div className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
        <div className="mb-1 text-[11px] text-muted">{tag}</div>
        <p className="text-sm leading-relaxed">{body}</p>
      </div>
    );
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        {t.common.back}
      </Link>

      <div className="mt-3 rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 text-[11px] text-muted">
          {stageName(m.stage ?? "", locale)} ·{" "}
          <LocalTime iso={m.kickoffAt} locale={locale} mode="datetime" tz />
        </div>
        <div className="flex items-center justify-between">
          <TeamBadge name={m.home.name} locale={locale} size="lg" />
          <div className="text-center">
            {settled ? (
              <div className="font-head text-3xl font-bold">
                {m.homeScore} : {m.awayScore}
              </div>
            ) : (
              <span className="font-head text-sm text-muted">VS</span>
            )}
          </div>
          <TeamBadge name={m.away.name} locale={locale} size="lg" />
        </div>
      </div>

      {settled && (m.recap || m.recapEn) && (
        <AiBlock tag={t.match.recapTag} foldTag={t.match.recapTag} body={m.recap} bodyEn={m.recapEn} />
      )}

      {(m.preview || m.previewEn) && (
        <AiBlock tag={t.match.previewTag} foldTag={t.match.previewFold} body={m.preview} bodyEn={m.previewEn} />
      )}

      {!settled && (m.sentiment || m.sentimentEn) && (
        <AiBlock tag={t.match.hotTakeTag} foldTag={t.match.hotTakeFold} body={m.sentiment} bodyEn={m.sentimentEn} />
      )}

      <section className="mt-5">
        {settled ? (
          <div className="rounded-md border border-border bg-surface-2 p-4 text-center text-sm">
            <span className="text-muted">{t.match.resultPrefix}</span>
            <span className="font-head text-green">
              {resultLabel[result1x2(m.homeScore as number, m.awayScore as number)]}
            </span>
            <span className="text-muted">{t.match.settledSuffix}</span>
          </div>
        ) : open && m.market ? (
          <>
            <p className="mb-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-center text-[11px] text-muted">
              {t.hero.pointsBanner}
            </p>
            <SentimentBar selections={m.market.selections} locale={locale} />
            <h2 className="font-head mb-2 mt-5 flex items-center gap-2 text-sm font-semibold">
              <span className="live-dot" /> {t.match.livePicks}
            </h2>
            <MarketPicks marketId={m.market.id} selections={m.market.selections} locale={locale} />
            <MatchProbTrend matchId={id} locale={locale} />
          </>
        ) : (
          <p className="rounded-md border border-border bg-surface-2 p-4 text-center text-sm text-muted">
            {t.match.locked}
          </p>
        )}
      </section>

      {swing && (
        <MatchSwingShare
          swing={swing}
          matchId={id}
          locale={locale}
          ogPath={swingOgPath(swing, locale)}
        />
      )}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
