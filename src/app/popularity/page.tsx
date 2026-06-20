import type { Metadata } from "next";
import Link from "next/link";
import { getRanking } from "@/lib/players/getRanking";
import { nameZhBySlug } from "@/data/players.seed";
import { PHOTOS } from "@/data/players.photos";
import { PopularityList } from "@/components/PopularityList";
import { PageContainer } from "@/components/PageContainer";
import { getDict, localeHref, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { teamName, flagUrl } from "@/lib/football/teams";
import { localizedAlternates, selfUrl, SITE_ORIGIN } from "@/lib/seo/canonical";
import { JsonLd } from "@/lib/seo/jsonLd";

export const dynamic = "force-dynamic";

// A6：关键词对齐标题/描述（命中「most popular player world cup 2026」）+ 答案前置 + 面包屑（6 语）。
const P_TITLE: Record<Locale, string> = {
  zh: "2026 世界杯最受欢迎球员 · 球迷人气榜（实时投票）",
  en: "Most Popular Players · World Cup 2026 Fan Favorites (live vote)",
  es: "Jugadores más populares · Favoritos del Mundial 2026 (voto en vivo)",
  pt: "Jogadores mais populares · Favoritos da Copa 2026 (voto ao vivo)",
  de: "Beliebteste Spieler · Fan-Favoriten der WM 2026 (Live-Voting)",
  fr: "Joueurs les plus populaires · Favoris du Mondial 2026 (vote en direct)",
};
const P_DESC: Record<Locale, string> = {
  zh: "2026 世界杯谁最受球迷欢迎？实时人气榜：球迷投票 + 公开表现与热度数据综合排名，持续更新。免费，无需注册。",
  en: "Who are the most popular players at the World Cup 2026? Live fan-favorite ranking from community votes plus public performance and buzz, updated continuously. Free, no sign-up.",
  es: "¿Quiénes son los jugadores más populares del Mundial 2026? Ranking en vivo de favoritos según votos de la afición más rendimiento y popularidad. Gratis, sin registro.",
  pt: "Quem são os jogadores mais populares da Copa 2026? Ranking ao vivo de favoritos por votos da torcida mais desempenho e popularidade. Grátis, sem cadastro.",
  de: "Wer sind die beliebtesten Spieler der WM 2026? Live-Fan-Favoriten-Ranking aus Community-Votes plus Leistung und Buzz. Kostenlos, ohne Anmeldung.",
  fr: "Quels sont les joueurs les plus populaires du Mondial 2026 ? Classement en direct des favoris selon les votes des fans, la performance et le buzz. Gratuit, sans inscription.",
};
const LEAD: Record<Locale, (a: string, b: string | null, c: string | null) => string> = {
  zh: (a, b, c) => `目前 2026 世界杯人气最高的球员是 ${a}${b ? `，其次是 ${b}` : ""}${c ? `、${c}` : ""}——按球迷投票 + 实时热度综合排名。`,
  en: (a, b, c) => `The most popular player at the World Cup 2026 right now is ${a}${b ? `, followed by ${b}` : ""}${c ? ` and ${c}` : ""} — ranked by fan votes plus live buzz.`,
  es: (a, b, c) => `El jugador más popular del Mundial 2026 ahora mismo es ${a}${b ? `, seguido de ${b}` : ""}${c ? ` y ${c}` : ""} — según votos de la afición y popularidad en vivo.`,
  pt: (a, b, c) => `O jogador mais popular da Copa 2026 agora é ${a}${b ? `, seguido por ${b}` : ""}${c ? ` e ${c}` : ""} — por votos da torcida e popularidade ao vivo.`,
  de: (a, b, c) => `Der derzeit beliebteste Spieler der WM 2026 ist ${a}${b ? `, gefolgt von ${b}` : ""}${c ? ` und ${c}` : ""} — nach Fan-Votes und Live-Buzz.`,
  fr: (a, b, c) => `Le joueur le plus populaire du Mondial 2026 en ce moment est ${a}${b ? `, suivi de ${b}` : ""}${c ? ` et ${c}` : ""} — selon les votes des fans et le buzz en direct.`,
};
const CRUMB_HOME: Record<Locale, string> = {
  zh: "首页", en: "Home", es: "Inicio", pt: "Início", de: "Startseite", fr: "Accueil",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const ogImage = `${SITE_ORIGIN}/api/og?mode=ranking&locale=${locale}`;
  return {
    title: P_TITLE[locale],
    description: P_DESC[locale],
    alternates: localizedAlternates("/popularity", locale),
    openGraph: {
      title: P_TITLE[locale],
      description: P_DESC[locale],
      url: `${SITE_ORIGIN}${localeHref(locale, "/popularity")}`,
      images: [{ url: ogImage, width: 1080, height: 1440 }],
    },
    twitter: { card: "summary_large_image", title: P_TITLE[locale], description: P_DESC[locale], images: [ogImage] },
  };
}

export default async function PopularityPage() {
  const locale = await getLocale();
  const t = getDict(locale);
  const ranking = await getRanking();

  // 服务端解析展示字段（国旗 + 本地化队名），客户端岛只管渲染与投票。
  const rows = ranking.map((r, i) => ({
    id: r.id,
    slug: r.slug,
    rank: i + 1,
    name: locale === "zh" ? nameZhBySlug.get(r.slug) ?? r.name : r.name,
    teamLabel: teamName(r.teamName, locale),
    flag: flagUrl(r.teamName),
    photo: PHOTOS[r.slug]?.url ?? null,
    votes: r.votes,
    index: r.index,
    popValue: r.popValue,
    voteScore: r.voteScore,
    perfScore: r.perfScore,
    buzzScore: r.buzzScore,
    // 非 zh 取英文短评（缺则不显示，与全站 AiBlock 一致）；zh 取中文。
    blurb: locale === "zh" ? r.blurbZh : r.blurbEn,
  }));

  const popJsonLd =
    rows.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              name: P_TITLE[locale],
              numberOfItems: rows.length,
              itemListElement: rows.slice(0, 30).map((r) => ({
                "@type": "ListItem",
                position: r.rank,
                name: r.name,
                url: selfUrl(`/player/${r.slug}`, locale),
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: CRUMB_HOME[locale], item: selfUrl("/", locale) },
                { "@type": "ListItem", position: 2, name: P_TITLE[locale], item: selfUrl("/popularity", locale) },
              ],
            },
          ],
        }
      : null;

  return (
    <PageContainer tier="standard">
      {popJsonLd && <JsonLd data={popJsonLd} />}
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl md:text-3xl font-bold">{t.popularity.title}</h1>
        <Link href={localeHref(locale, "/")} className="text-xs md:text-sm text-muted">
          {t.common.back}
        </Link>
      </div>
      <p className="mt-1 text-sm md:text-base text-muted">{t.popularity.subtitle}</p>
      <Link
        href={localeHref(locale, "/scorers")}
        className="mt-1 inline-block text-xs md:text-sm text-green hover:underline"
      >
        {locale === "zh" ? "⚽ 射手榜" : "⚽ Top Scorers"} →
      </Link>
      {rows.length > 0 && (
        <p className="mt-3 text-sm md:text-base leading-relaxed">
          {LEAD[locale](rows[0].name, rows[1]?.name ?? null, rows[2]?.name ?? null)}
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">⭐</div>
          <p className="mt-3 text-sm md:text-base text-muted">{t.popularity.empty}</p>
        </div>
      ) : (
        <PopularityList rows={rows} locale={locale} />
      )}

      <p className="mt-6 text-center text-[11px] md:text-xs text-muted">{t.popularity.note}</p>
      <p className="mt-1 text-center text-[10px] md:text-xs text-muted">
        {locale === "zh"
          ? "球员头像来自 Wikimedia Commons（CC 许可）"
          : "Player photos via Wikimedia Commons (CC)"}
      </p>
    </PageContainer>
  );
}
