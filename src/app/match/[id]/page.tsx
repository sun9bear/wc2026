import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getMatchDetail } from "@/lib/markets/getMatchDetail";
import { MarketPicks } from "@/components/MarketPicks";
import { MatchProbTrend } from "@/components/MatchProbTrend";
import { ScoreProbs } from "@/components/ScoreProbs";
import { LiveScoreProbs } from "@/components/LiveScoreProbs";
import { MatchSwingShare } from "@/components/MatchSwingShare";
import { MatchPreviewShare } from "@/components/MatchPreviewShare";
import { HeaderShare } from "@/components/HeaderShare";
import { SentimentBar } from "@/components/SentimentBar";
import { Disclaimer } from "@/components/Disclaimer";
import { TeamBadge } from "@/components/TeamBadge";
import { LocalTime } from "@/components/LocalTime";
import { result1x2 } from "@/lib/settlement/result";
import { stageName, teamName } from "@/lib/football/teams";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam, teamSlug } from "@/lib/prob/findTeam";
import { getMatchSwing, swingOgPath } from "@/lib/prob/getMatchSwing";
import { getMatchScoreline } from "@/lib/prob/getMatchScoreline";
import { JsonLd } from "@/lib/seo/jsonLd";
import { getDict } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { maybeAutoSettle } from "@/lib/settlement/autoSettle";

const SITE = "https://www.wc2026.cool";

// 每场都给真实默认标题 + 显式绝对自指 canonical（经 CodeX 外审：非爆冷场次原返回 {}，
// 既无标题又会继承根 layout 的相对 canonical 解析错误，伤收录）。
// 已结算且出现"爆冷"（出线概率大摆动）时，再把 og:image 设为摆动卡 + 改标题（覆盖默认）。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await getLocale();
  const canonical = `${SITE}/match/${id}`;

  const m = await getMatchDetail(id).catch(() => null);
  let base: Metadata = { alternates: { canonical } };
  if (m) {
    const home = teamName(m.home.name, locale);
    const away = teamName(m.away.name, locale);
    const title =
      locale === "zh"
        ? `${home} vs ${away} — 2026 世界杯预测与最可能比分`
        : `${home} vs ${away} — World Cup 2026 prediction & likely scores`;
    const description =
      locale === "zh"
        ? `${home} vs ${away} 的 2026 世界杯模型胜平负概率与最可能比分。免费，无需注册。`
        : `Model win, draw and loss probabilities and the most likely scorelines for ${home} vs ${away} at the 2026 World Cup. Free, no sign-up.`;
    base = {
      title,
      description,
      alternates: { canonical },
      // 完整 openGraph（CodeX 外审 MAJOR：page 的 openGraph 整体替换 layout 的、不深合并；
      // 非爆冷场次原先丢了默认 og.png/type/url，伤分享卡）。默认 /og.png，爆冷场次下方覆盖为摆动卡。
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "wc2026.cool",
        title,
        description,
        images: [{ url: "/og.png", width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    };
  }

  let swing = null;
  try {
    swing = await getMatchSwing(id);
  } catch {
    swing = null;
  }
  if (!swing) return base;
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
    ...base,
    title,
    description,
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "wc2026.cool",
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogUrl] },
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const m = await getMatchDetail(id);
  if (!m) notFound();

  // 队旗从概率数据取（与球队卡同源 flagcdn；matches 表的 flag 对部分队缺失/非 flagcdn → 之前渲染成空占位）。
  const fdata = await getForecast().catch(() => null);
  const homeFlag = fdata ? findTeam(fdata, teamSlug(m.home.name))?.team.flag ?? null : null;
  const awayFlag = fdata ? findTeam(fdata, teamSlug(m.away.name))?.team.flag ?? null : null;

  // 流量自驱动结算（响应后执行；详情页是赛后回访的高频落点）
  after(() => maybeAutoSettle());

  const settled = m.status === "settled" && m.homeScore != null && m.awayScore != null;
  const started = new Date(m.kickoffAt).getTime() <= Date.now();
  const open = !settled && !started;
  const inPlay = !settled && started; // 已开赛未结算 = 进行中
  // 「爆冷瞬间」摆动卡：仅已结算且出线概率大摆动时返回非 null（缓存读快照，失败降级 null）。
  const swing = settled ? await getMatchSwing(id).catch(() => null) : null;
  // 比分分布：未结算即取赛前 Top-5（open 分支直接展示；进行中作为 LiveScoreProbs 实时未命中时的兜底）。
  const scoreline = !settled ? await getMatchScoreline(id).catch(() => null) : null;

  // 赛前胜平负概率（由池倍率 p≈1/m 归一化）——供 MatchPreviewShare 分享卡用。
  // 倍率全为默认 3.00（无真实预测的种子值）时退化为 33/33/34，不影响功能。
  const impliedSplit = (() => {
    const sels = m.market?.selections ?? [];
    const find = (code: string) => sels.find((s) => s.code === code);
    const h = find("home");
    const d = find("draw");
    const a = find("away");
    if (!h || !d || !a || !(h.multiplier > 0) || !(d.multiplier > 0) || !(a.multiplier > 0))
      return null;
    const inv = [1 / h.multiplier, 1 / d.multiplier, 1 / a.multiplier];
    const sum = inv[0] + inv[1] + inv[2];
    if (!(sum > 0) || !Number.isFinite(sum)) return null;
    const pcts = inv.map((x) => Math.round((x / sum) * 100));
    const diff = 100 - (pcts[0] + pcts[1] + pcts[2]);
    if (diff !== 0) pcts[pcts.indexOf(Math.max(...pcts))] += diff; // round 余数补给最大项，保证和=100
    return { hp: pcts[0], dp: pcts[1], ap: pcts[2] };
  })();
  const resultLabel: Record<string, string> = {
    home: t.match.home,
    draw: t.match.draw,
    away: t.match.away,
  };

  // 页眉右上分享（任务 A）：未结算 → 比赛预览卡（mode=match，含 Top-3 比分[任务E] + zh 二维码[任务D]）；
  // 已结算且爆冷 → 摆动卡；其余只给链接分享。
  const headerMatch =
    open && impliedSplit
      ? {
          home: teamName(m.home.name, locale),
          away: teamName(m.away.name, locale),
          hp: impliedSplit.hp,
          dp: impliedSplit.dp,
          ap: impliedSplit.ap,
          kickoffIso: m.kickoffAt,
          homeFlag,
          awayFlag,
          aiTake: locale === "zh" ? m.sentiment : m.sentimentEn,
          scoreTop3: scoreline?.top ?? null,
          qrPath: `/match/${id}`,
        }
      : null;
  const headerOgUrl = !headerMatch && swing ? `${SITE}${swingOgPath(swing, locale)}` : null;

  // SportsEvent + 面包屑实体（实体/GEO 理解，非 Event 富结果；不编造 offers/location）。
  const evHome = teamName(m.home.name, locale);
  const evAway = teamName(m.away.name, locale);
  const matchJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        "@id": `${SITE}/match/${id}#event`,
        name: `${evHome} vs ${evAway}`,
        sport: "Soccer",
        startDate: m.kickoffAt,
        eventStatus: settled
          ? "https://schema.org/EventCompleted"
          : "https://schema.org/EventScheduled",
        competitor: [
          { "@type": "SportsTeam", name: evHome },
          { "@type": "SportsTeam", name: evAway },
        ],
        superEvent: { "@type": "SportsEvent", name: "FIFA World Cup 2026" },
        url: `${SITE}/match/${id}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: locale === "zh" ? "首页" : "Home", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: `${evHome} vs ${evAway}`, item: `${SITE}/match/${id}` },
        ],
      },
    ],
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
      <JsonLd data={matchJsonLd} />
      {/* 语义 h1（视觉隐藏，不改版式；给爬虫/AI 明确实体标题）。 */}
      <h1 className="sr-only">
        {locale === "zh"
          ? `${teamName(m.home.name, locale)} vs ${teamName(m.away.name, locale)} — 2026 世界杯预测`
          : `${teamName(m.home.name, locale)} vs ${teamName(m.away.name, locale)} — World Cup 2026 prediction`}
      </h1>
      <div className="flex items-center justify-between">
        <Link href="/" className="text-xs text-muted">
          {t.common.back}
        </Link>
        <HeaderShare
          locale={locale}
          shareUrl={`${SITE}/match/${id}`}
          text={`${teamName(m.home.name, locale)} vs ${teamName(m.away.name, locale)}`}
          match={headerMatch}
          ogUrl={headerOgUrl}
          source="match"
        />
      </div>

      <div className="mt-3 rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 text-[11px] text-muted">
          {stageName(m.stage ?? "", locale)} ·{" "}
          <LocalTime iso={m.kickoffAt} locale={locale} mode="datetime" tz />
        </div>
        <div className="flex items-center justify-between">
          <TeamBadge name={m.home.name} locale={locale} size="lg" linkToTeam />
          <div className="text-center">
            {settled ? (
              <div className="font-head text-3xl font-bold">
                {m.homeScore} : {m.awayScore}
              </div>
            ) : (
              <span className="font-head text-sm text-muted">VS</span>
            )}
          </div>
          <TeamBadge name={m.away.name} locale={locale} size="lg" linkToTeam />
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
            {scoreline && (
              <ScoreProbs data={scoreline} locale={locale} home={m.home} away={m.away} />
            )}
            <MatchProbTrend matchId={id} locale={locale} />
            {impliedSplit && (
              <MatchPreviewShare
                home={teamName(m.home.name, locale)}
                away={teamName(m.away.name, locale)}
                hp={impliedSplit.hp}
                dp={impliedSplit.dp}
                ap={impliedSplit.ap}
                locale={locale}
                kickoff={m.kickoffAt}
              />
            )}
          </>
        ) : inPlay ? (
          <LiveScoreProbs
            matchId={id}
            home={m.home}
            away={m.away}
            locale={locale}
            fallback={scoreline}
          />
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
