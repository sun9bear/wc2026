import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { getMatchDetail } from "@/lib/markets/getMatchDetail";
import { getMatchExtra } from "@/lib/football/getMatchExtra";
import { PageContainer } from "@/components/PageContainer";
import { MarketPicks } from "@/components/MarketPicks";
import { MatchProbTrend } from "@/components/MatchProbTrend";
import { ScoreProbs } from "@/components/ScoreProbs";
import { LiveScoreProbs } from "@/components/LiveScoreProbs";
import { LiveScore } from "@/components/LiveScore";
import { MatchSwingShare } from "@/components/MatchSwingShare";
import { MatchPreviewShare } from "@/components/MatchPreviewShare";
import { HeaderShare } from "@/components/HeaderShare";
import { TeamBadge } from "@/components/TeamBadge";
import { LocalTime } from "@/components/LocalTime";
import { result1x2 } from "@/lib/settlement/result";
import { stageName, teamName } from "@/lib/football/teams";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam, teamSlug } from "@/lib/prob/findTeam";
import { getMatchSwing, swingOgPath } from "@/lib/prob/getMatchSwing";
import { getMatchReport, reportOgPath } from "@/lib/prob/getMatchReport";
import { getMatchScoreline } from "@/lib/prob/getMatchScoreline";
import { JsonLd } from "@/lib/seo/jsonLd";
import { getDict, localeHref, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { maybeAutoSettle } from "@/lib/settlement/autoSettle";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { RelatedCommentary } from "@/components/RelatedCommentary";
import { getRelatedBlogByMatch, toBlogLocale } from "@/lib/blog/published";

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
  const canonical = selfUrl(`/match/${id}`, locale);
  const alts = localizedAlternates(`/match/${id}`, locale);

  const m = await getMatchDetail(id).catch(() => null);
  let base: Metadata = { alternates: alts };
  if (m) {
    const home = teamName(m.home.name, locale);
    const away = teamName(m.away.name, locale);
    const title = (
      {
        zh: `${home} vs ${away} — 2026 世界杯预测与最可能比分`,
        en: `${home} vs ${away} — World Cup 2026 prediction & likely scores`,
        es: `${home} vs ${away} — predicción y marcadores probables del Mundial 2026`,
        pt: `${home} vs ${away} — previsão e placares prováveis da Copa 2026`,
        de: `${home} vs ${away} — WM-2026-Vorhersage & wahrscheinliche Ergebnisse`,
        fr: `${home} vs ${away} — prédiction et scores probables du Mondial 2026`,
      } as Record<Locale, string>
    )[locale];
    const description = (
      {
        zh: `${home} vs ${away} 的 2026 世界杯模型胜平负概率与最可能比分。免费，无需注册。`,
        en: `Model win, draw and loss probabilities and the most likely scorelines for ${home} vs ${away} at the 2026 World Cup. Free, no sign-up.`,
        es: `Probabilidades del modelo de victoria, empate y derrota y los marcadores más probables para ${home} vs ${away} en el Mundial 2026. Gratis, sin registro.`,
        pt: `Probabilidades do modelo de vitória, empate e derrota e os placares mais prováveis para ${home} vs ${away} na Copa 2026. Grátis, sem cadastro.`,
        de: `Modell-Wahrscheinlichkeiten für Sieg, Unentschieden und Niederlage sowie die wahrscheinlichsten Ergebnisse für ${home} vs ${away} bei der WM 2026. Kostenlos, ohne Anmeldung.`,
        fr: `Probabilités du modèle de victoire, nul et défaite et les scores les plus probables pour ${home} vs ${away} à la Coupe du monde 2026. Gratuit, sans inscription.`,
      } as Record<Locale, string>
    )[locale];
    base = {
      title,
      description,
      alternates: alts,
      // 完整 openGraph（CodeX 外审 MAJOR：page 的 openGraph 整体替换 layout 的、不深合并；
      // 非爆冷场次原先丢了默认 og.png/type/url，伤分享卡）。默认 /og.png，爆冷场次下方覆盖为摆动卡。
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "wc2026.cool",
        title,
        description,
        images: [{ url: "/og.png", width: 1080, height: 1440 }],
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
  if (!swing) {
    // 非爆冷的已结算场次：用「比分战报」卡作分享图（每场都有，触发频率高）。失败回退默认 og.png。
    let report = null;
    try {
      report = await getMatchReport(id);
    } catch {
      report = null;
    }
    if (!report) return base;
    const rOg = `${SITE}${reportOgPath(report, locale)}`;
    const rHome = locale === "zh" ? report.homeZh : teamName(report.homeName, locale);
    const rAway = locale === "zh" ? report.awayZh : teamName(report.awayName, locale);
    const rScore = `${report.homeScore}-${report.awayScore}`;
    const rTitle = (
      {
        zh: `${rHome} ${rScore} ${rAway} · 赛后战报 · wc2026.cool`,
        en: `${rHome} ${rScore} ${rAway} · Full-time · wc2026.cool`,
        es: `${rHome} ${rScore} ${rAway} · Final · wc2026.cool`,
        pt: `${rHome} ${rScore} ${rAway} · Fim de jogo · wc2026.cool`,
        de: `${rHome} ${rScore} ${rAway} · Schlusspfiff · wc2026.cool`,
        fr: `${rHome} ${rScore} ${rAway} · Fin du match · wc2026.cool`,
      } as Record<Locale, string>
    )[locale];
    const sp = Math.round((report.scoreP ?? 0) * 100);
    const rDesc = (
      {
        zh: report.rank
          ? `这个比分赛前是模型第 ${report.rank} 可能（${sp}%）。世界杯 2026 实时模型，免费无需注册。`
          : `这个比分赛前不在模型 Top-5（冷门）。世界杯 2026 实时模型，免费无需注册。`,
        en: report.rank
          ? `This scoreline was the model's #${report.rank} most likely pre-match (${sp}%). Live World Cup 2026 model, free, no sign-up.`
          : `This scoreline wasn't in the model's pre-match Top 5 (upset). Live World Cup 2026 model, free, no sign-up.`,
        es: report.rank
          ? `Este marcador era el #${report.rank} más probable del modelo antes del partido (${sp}%). Modelo en vivo del Mundial 2026, gratis, sin registro.`
          : `Este marcador no estaba en el Top 5 del modelo antes del partido (sorpresa). Modelo en vivo del Mundial 2026, gratis, sin registro.`,
        pt: report.rank
          ? `Este placar era o #${report.rank} mais provável do modelo antes do jogo (${sp}%). Modelo ao vivo da Copa 2026, grátis, sem cadastro.`
          : `Este placar não estava no Top 5 do modelo antes do jogo (zebra). Modelo ao vivo da Copa 2026, grátis, sem cadastro.`,
        de: report.rank
          ? `Dieses Ergebnis war vor dem Spiel das #${report.rank} wahrscheinlichste im Modell (${sp}%). Live-WM-2026-Modell, kostenlos, ohne Anmeldung.`
          : `Dieses Ergebnis war vor dem Spiel nicht in den Top 5 des Modells (Überraschung). Live-WM-2026-Modell, kostenlos, ohne Anmeldung.`,
        fr: report.rank
          ? `Ce score était le #${report.rank} le plus probable du modèle avant le match (${sp}%). Modèle en direct du Mondial 2026, gratuit, sans inscription.`
          : `Ce score n'était pas dans le Top 5 du modèle avant le match (surprise). Modèle en direct du Mondial 2026, gratuit, sans inscription.`,
      } as Record<Locale, string>
    )[locale];
    return {
      ...base,
      title: rTitle,
      description: rDesc,
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "wc2026.cool",
        title: rTitle,
        description: rDesc,
        images: [{ url: rOg, width: 1080, height: 1440 }],
      },
      twitter: { card: "summary_large_image", title: rTitle, description: rDesc, images: [rOg] },
    };
  }
  const ogUrl = `${SITE}${swingOgPath(swing, locale)}`;
  const heroName = locale === "zh" ? swing.hero.zh : teamName(swing.hero.name, locale);
  const bp = Math.round(swing.hero.before * 100);
  const ap = Math.round(swing.hero.after * 100);
  const sHome = locale === "zh" ? swing.homeZh : teamName(swing.homeName, locale);
  const sAway = locale === "zh" ? swing.awayZh : teamName(swing.awayName, locale);
  const sScore = `${swing.homeScore}-${swing.awayScore}`;
  const title = (
    {
      zh: `爆冷！${sHome} ${sScore} ${sAway} · wc2026.cool`,
      en: `Upset! ${sHome} ${sScore} ${sAway} · wc2026.cool`,
      es: `¡Sorpresa! ${sHome} ${sScore} ${sAway} · wc2026.cool`,
      pt: `Zebra! ${sHome} ${sScore} ${sAway} · wc2026.cool`,
      de: `Überraschung! ${sHome} ${sScore} ${sAway} · wc2026.cool`,
      fr: `Surprise ! ${sHome} ${sScore} ${sAway} · wc2026.cool`,
    } as Record<Locale, string>
  )[locale];
  const description = (
    {
      zh: `${heroName}出线概率 ${bp}% → ${ap}%。世界杯 2026 实时模型，免费无需注册。`,
      en: `${heroName}'s chance to advance ${bp}% → ${ap}%. Live World Cup 2026 model, free, no sign-up.`,
      es: `Probabilidad de ${heroName} de avanzar ${bp}% → ${ap}%. Modelo en vivo del Mundial 2026, gratis, sin registro.`,
      pt: `Chance de ${heroName} avançar ${bp}% → ${ap}%. Modelo ao vivo da Copa 2026, grátis, sem cadastro.`,
      de: `${heroName}s Chance aufs Weiterkommen ${bp}% → ${ap}%. Live-WM-2026-Modell, kostenlos, ohne Anmeldung.`,
      fr: `Probabilité de qualification de ${heroName} ${bp}% → ${ap}%. Modèle en direct du Mondial 2026, gratuit, sans inscription.`,
    } as Record<Locale, string>
  )[locale];
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
      images: [{ url: ogUrl, width: 1080, height: 1440 }],
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

  // P5：本场相关的已发布事件解读（无则不渲染）。
  const related = await getRelatedBlogByMatch(id, toBlogLocale(locale)).catch(() => []);

  // 裁判 + 赛果时长（加时/点球）：football-data 单场详情，按 external_id 缓存 6h，失败降级空。
  const extra = await getMatchExtra(m.externalId).catch(() => ({ referee: null, duration: null }));

  // 队旗从概率数据取（与球队卡同源 flagcdn；matches 表的 flag 对部分队缺失/非 flagcdn → 之前渲染成空占位）。
  const fdata = await getForecast().catch(() => null);
  const homeFlag = fdata ? findTeam(fdata, teamSlug(m.home.name))?.team.flag ?? null : null;
  const awayFlag = fdata ? findTeam(fdata, teamSlug(m.away.name))?.team.flag ?? null : null;
  // 比分预测卡（ScoreProbs/LiveScoreProbs）用修正后的 flagcdn 旗。
  // m.home.flag 是 matches 表缺失/非 flagcdn 的值，直接传会渲染成裂图（用户反馈：实时比分卡小旗不显示）。
  const homeTeam = { name: m.home.name, flag: homeFlag };
  const awayTeam = { name: m.away.name, flag: awayFlag };

  // 流量自驱动结算（响应后执行；详情页是赛后回访的高频落点）
  after(() => maybeAutoSettle());

  const settled = m.status === "settled" && m.homeScore != null && m.awayScore != null;
  const started = new Date(m.kickoffAt).getTime() <= Date.now();
  const open = !settled && !started;
  const inPlay = !settled && started; // 已开赛未结算 = 进行中
  // 「爆冷瞬间」摆动卡：仅已结算且出线概率大摆动时返回非 null（缓存读快照，失败降级 null）。
  const swing = settled ? await getMatchSwing(id).catch(() => null) : null;
  // 非爆冷的已结算场次取「比分战报」（每场都有），供页眉「保存图片卡」与分享图复用。
  const report = settled && !swing ? await getMatchReport(id).catch(() => null) : null;
  // 比分分布：未结算即取赛前 Top-5（open 分支直接展示；进行中作为 LiveScoreProbs 实时未命中时的兜底）。
  const scoreline = !settled ? await getMatchScoreline(id).catch(() => null) : null;

  // 池倍率隐含的胜平负概率（p≈1/m 归一化）：作 heroProb 在无引擎快照时的回落值。
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

  // 主展示口径（heroProb）：优先用引擎快照的融合胜平负概率（与最可能比分/走势同源、走势末点对齐）；
  // 无引擎快照时回落池倍率隐含值 impliedSplit。fresh 标记是否来自每小时刷新的引擎快照。
  const heroProb = (() => {
    const ep = scoreline?.p;
    if (ep) {
      const arr = [ep.home, ep.draw, ep.away];
      const sum = arr[0] + arr[1] + arr[2];
      if (sum > 0 && Number.isFinite(sum)) {
        const pcts = arr.map((x) => Math.round((x / sum) * 100));
        const diff = 100 - (pcts[0] + pcts[1] + pcts[2]);
        if (diff !== 0) pcts[pcts.indexOf(Math.max(...pcts))] += diff; // 余数补给最大项，保证和=100
        return { hp: pcts[0], dp: pcts[1], ap: pcts[2], fresh: true };
      }
    }
    return impliedSplit ? { ...impliedSplit, fresh: false } : null;
  })();
  const resultLabel: Record<string, string> = {
    home: t.match.home,
    draw: t.match.draw,
    away: t.match.away,
  };
  // 裁判标签 + 加时/点球徽章文案（站内既有 inline Record<Locale> 模式，无需动全局 Dict）。
  const REF_LABEL: Record<Locale, string> = {
    zh: "主裁", en: "Referee", es: "Árbitro", pt: "Árbitro", de: "Schiedsrichter", fr: "Arbitre",
  };
  const DURATION_LABEL: Record<"EXTRA_TIME" | "PENALTY_SHOOTOUT", Record<Locale, string>> = {
    EXTRA_TIME: {
      zh: "加时赛", en: "after extra time", es: "tras la prórroga", pt: "após prorrogação",
      de: "nach Verlängerung", fr: "après prolongation",
    },
    PENALTY_SHOOTOUT: {
      zh: "点球大战", en: "on penalties", es: "en los penaltis", pt: "nos pênaltis",
      de: "im Elfmeterschießen", fr: "aux tirs au but",
    },
  };
  const durationBadge =
    settled && (extra.duration === "EXTRA_TIME" || extra.duration === "PENALTY_SHOOTOUT")
      ? DURATION_LABEL[extra.duration][locale]
      : null;

  // B3/B4：答案前置（模型胜平负 + 最可能比分），服务端纯文本 —— 命中「X vs Y prediction / 比分预测」查询 + AI 引用。
  const PRED_COPY: Record<
    Locale,
    {
      label: string;
      wdl: (home: string, hp: number, dp: number, away: string, ap: number) => string;
      score: (h: number, a: number, p: number) => string;
    }
  > = {
    zh: { label: "模型预测：", wdl: (h, hp, dp, a, ap) => `${h} 胜 ${hp}%、平局 ${dp}%、${a} 胜 ${ap}%。`, score: (h, a, p) => `最可能比分 ${h}-${a}（约 ${p}%）。` },
    en: { label: "Model prediction:", wdl: (h, hp, dp, a, ap) => `${h} win ${hp}%, draw ${dp}%, ${a} win ${ap}%.`, score: (h, a, p) => `Most likely score ${h}-${a} (about ${p}%).` },
    es: { label: "Predicción del modelo:", wdl: (h, hp, dp, a, ap) => `Victoria de ${h} ${hp}%, empate ${dp}%, victoria de ${a} ${ap}%.`, score: (h, a, p) => `Marcador más probable ${h}-${a} (alrededor del ${p}%).` },
    pt: { label: "Previsão do modelo:", wdl: (h, hp, dp, a, ap) => `Vitória de ${h} ${hp}%, empate ${dp}%, vitória de ${a} ${ap}%.`, score: (h, a, p) => `Placar mais provável ${h}-${a} (cerca de ${p}%).` },
    de: { label: "Modell-Prognose:", wdl: (h, hp, dp, a, ap) => `Sieg ${h} ${hp}%, Unentschieden ${dp}%, Sieg ${a} ${ap}%.`, score: (h, a, p) => `Wahrscheinlichstes Ergebnis ${h}-${a} (rund ${p}%).` },
    fr: { label: "Prévision du modèle :", wdl: (h, hp, dp, a, ap) => `Victoire de ${h} ${hp}%, nul ${dp}%, victoire de ${a} ${ap}%.`, score: (h, a, p) => `Score le plus probable ${h}-${a} (environ ${p}%).` },
  };

  // 页眉右上分享（任务 A）：未结算 → 比赛预览卡（mode=match，含 Top-3 比分[任务E] + zh 二维码[任务D]）；
  // 已结算且爆冷 → 摆动卡；其余只给链接分享。
  const headerMatch =
    open && heroProb
      ? {
          home: teamName(m.home.name, locale),
          away: teamName(m.away.name, locale),
          hp: heroProb.hp,
          dp: heroProb.dp,
          ap: heroProb.ap,
          kickoffIso: m.kickoffAt,
          homeFlag,
          awayFlag,
          aiTake: locale === "zh" ? m.sentiment : m.sentimentEn,
          scoreTop3: scoreline?.top ?? null,
          qrPath: `/match/${id}`,
        }
      : null;
  const headerOgUrl = !headerMatch
    ? swing
      ? `${SITE}${swingOgPath(swing, locale)}`
      : report
        ? `${SITE}${reportOgPath(report, locale)}`
        : null
    : null;

  // A3：比赛页只保留 BreadcrumbList。原 SportsEvent 节点缺 Google Event 富结果必填的
  // location（比赛 venue 不在数据管线里——getMatchExtra 返回 venue=null），导致 GSC
  // 「Events」报告 8 条全部无效（新域名 trust drag、且永远拿不到富结果）。在拿到官方
  // 「赛程→球场」映射前先移除该节点；比赛实体语义已由正文 + sr-only h1 + 面包屑承载，
  // GEO/AI 理解不依赖此 JSON-LD。后续 venue 数据到位可重新加回合法 SportsEvent（含 Place）。
  const evHome = teamName(m.home.name, locale);
  const evAway = teamName(m.away.name, locale);
  const HOME_LABEL: Record<Locale, string> = {
    zh: "首页",
    en: "Home",
    es: "Inicio",
    pt: "Início",
    de: "Startseite",
    fr: "Accueil",
  };
  const matchJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: HOME_LABEL[locale] ?? "Home", item: selfUrl("/", locale) },
          { "@type": "ListItem", position: 2, name: `${evHome} vs ${evAway}`, item: selfUrl(`/match/${id}`, locale) },
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
    const isZh = locale === "zh";
    // 中文：平铺中文 AI 文案。非中文（en/es/pt/de/fr）：优先平铺英文版（Phase A 新语种 AI 内容回落英文）；
    // 无英文版时折叠展示中文原文（不漏内容，也不在非本语种页平铺中文）。
    if (isZh) {
      if (!body) return null;
      return (
        <div className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
          <div className="mb-1 text-[11px] text-muted md:text-xs">{tag}</div>
          <p className="text-sm leading-relaxed md:text-base">{body}</p>
        </div>
      );
    }
    if (bodyEn) {
      return (
        <div className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
          <div className="mb-1 text-[11px] text-muted md:text-xs">{tag}</div>
          <p className="text-sm leading-relaxed md:text-base">{bodyEn}</p>
        </div>
      );
    }
    if (!body) return null;
    return (
      <details className="fade-up mt-4 rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-[11px] text-muted md:text-xs">{foldTag}</summary>
        <p className="mt-2 text-sm leading-relaxed md:text-base">{body}</p>
      </details>
    );
  };

  return (
    <PageContainer tier="standard">
      <JsonLd data={matchJsonLd} />
      {/* 语义 h1（视觉隐藏，不改版式；给爬虫/AI 明确实体标题）。 */}
      <h1 className="sr-only">
        {(
          {
            zh: `${evHome} vs ${evAway} — 2026 世界杯预测`,
            en: `${evHome} vs ${evAway} — World Cup 2026 prediction`,
            es: `${evHome} vs ${evAway} — predicción del Mundial 2026`,
            pt: `${evHome} vs ${evAway} — previsão da Copa 2026`,
            de: `${evHome} vs ${evAway} — WM-2026-Vorhersage`,
            fr: `${evHome} vs ${evAway} — prédiction du Mondial 2026`,
          } as Record<Locale, string>
        )[locale]}
      </h1>
      <div className="flex items-center justify-between">
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {t.common.back}
        </Link>
        <HeaderShare
          locale={locale}
          shareUrl={selfUrl(`/match/${id}`, locale)}
          text={`${teamName(m.home.name, locale)} vs ${teamName(m.away.name, locale)}`}
          match={headerMatch}
          ogUrl={headerOgUrl}
          source="match"
        />
      </div>

      <div className="mt-3 rounded-lg border border-border bg-surface p-5">
        <div className="mb-4 text-[11px] text-muted md:text-xs">
          {stageName(m.stage ?? "", locale)} ·{" "}
          <LocalTime iso={m.kickoffAt} locale={locale} mode="datetime" tz />
          {extra.referee && (
            <>
              {" · "}
              {REF_LABEL[locale]} {extra.referee.name}
              {extra.referee.nationality
                ? ` (${teamName(extra.referee.nationality, locale)})`
                : ""}
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <TeamBadge name={m.home.name} locale={locale} size="lg" linkToTeam />
          <div className="text-center">
            {settled ? (
              <div>
                <div className="font-head text-3xl font-bold">
                  {m.homeScore} : {m.awayScore}
                </div>
                {durationBadge && (
                  <div className="mt-0.5 text-[10px] font-medium text-muted md:text-xs">{durationBadge}</div>
                )}
              </div>
            ) : inPlay ? (
              // 进行中：页眉显示放大的实时比分+分钟（实时更新）。
              <LiveScore matchId={id} kickoffAt={m.kickoffAt} locale={locale} size="lg" />
            ) : (
              <span className="font-head text-sm text-muted">VS</span>
            )}
          </div>
          <TeamBadge name={m.away.name} locale={locale} size="lg" linkToTeam />
        </div>
      </div>

      {/* 队名正下方主展示：模型胜平负概率（引擎每小时融合快照，与下方「最可能比分」「概率走势」同源、走势末点对齐）。 */}
      {open && heroProb && (
        <MatchPreviewShare
          home={teamName(m.home.name, locale)}
          away={teamName(m.away.name, locale)}
          hp={heroProb.hp}
          dp={heroProb.dp}
          ap={heroProb.ap}
          fresh={heroProb.fresh}
          locale={locale}
          kickoff={m.kickoffAt}
        />
      )}

      {/* B3/B4：答案前置概率/比分句（服务端纯文本，供搜索/AI 直接引用）。与主展示同一口径（heroProb）。 */}
      {!settled && (heroProb || scoreline?.top?.[0]) && (() => {
        const pc = PRED_COPY[locale] ?? PRED_COPY.en;
        const top = scoreline?.top?.[0];
        const parts: string[] = [];
        if (heroProb)
          parts.push(
            pc.wdl(
              teamName(m.home.name, locale),
              heroProb.hp,
              heroProb.dp,
              teamName(m.away.name, locale),
              heroProb.ap
            )
          );
        if (top) parts.push(pc.score(top.h, top.a, Math.max(1, Math.round(top.p * 100))));
        return (
          <p className="mt-3 rounded-lg border border-green/30 bg-surface px-3 py-2.5 text-sm leading-relaxed md:text-base">
            <span className="font-semibold text-green">{pc.label}</span> {parts.join(" ")}
          </p>
        );
      })()}

      {/* 进行中：直播看板（进球文字流 + 最可能比分 + 可展开技术统计）；比分/分钟已放大显示在上方页眉。 */}
      {inPlay && (
        <LiveScoreProbs
          matchId={id}
          home={homeTeam}
          away={awayTeam}
          locale={locale}
          fallback={scoreline}
        />
      )}

      {settled && (m.recap || m.recapEn) && (
        <AiBlock tag={t.match.recapTag} foldTag={t.match.recapTag} body={m.recap} bodyEn={m.recapEn} />
      )}

      {/* 未结算：最可能比分 + 概率走势（与主展示同一引擎快照——走势末点 = 主展示，永不矛盾）。 */}
      {open && (
        <div className="md:grid md:grid-cols-2 md:gap-4">
          {scoreline && (
            <ScoreProbs data={scoreline} locale={locale} home={homeTeam} away={awayTeam} />
          )}
          <MatchProbTrend matchId={id} locale={locale} />
        </div>
      )}

      {/* 2 段 AI 短评：赛前前瞻 + 冷热门看点（置于数据图表之后）。 */}
      {(m.preview || m.previewEn) && (
        <AiBlock tag={t.match.previewTag} foldTag={t.match.previewFold} body={m.preview} bodyEn={m.previewEn} />
      )}

      {!settled && (m.sentiment || m.sentimentEn) && (
        <AiBlock tag={t.match.hotTakeTag} foldTag={t.match.hotTakeFold} body={m.sentiment} bodyEn={m.sentimentEn} />
      )}

      {/* 下注/玩法区（页面最后）：实时倍率按钮 + 投入积分 + 提交预测。倍率为玩法赔付倍数，非胜率预测。 */}
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
            <p className="mb-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-center text-[11px] text-muted md:text-xs">
              {t.hero.pointsBanner}
            </p>
            <h2 className="font-head mb-2 mt-4 flex items-center gap-2 text-sm font-semibold md:text-base">
              <span className="live-dot" /> {t.match.livePicks}
            </h2>
            <MarketPicks marketId={m.market.id} selections={m.market.selections} locale={locale} />
          </>
        ) : inPlay ? null : (
          <p className="rounded-md border border-border bg-surface-2 p-4 text-center text-sm text-muted md:text-base">
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

      <RelatedCommentary items={related} locale={locale} />

    </PageContainer>
  );
}
