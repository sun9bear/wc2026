import type { Metadata } from "next";
import Link from "next/link";
import { getRanking } from "@/lib/players/getRanking";
import { nameZhBySlug } from "@/data/players.seed";
import { PHOTOS } from "@/data/players.photos";
import { PopularityList } from "@/components/PopularityList";
import { PageContainer } from "@/components/PageContainer";
import { Disclaimer } from "@/components/Disclaimer";
import { getDict, localeHref } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { teamName, flagUrl } from "@/lib/football/teams";
import { localizedAlternates, SITE_ORIGIN } from "@/lib/seo/canonical";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getDict(locale);
  const ogImage = `${SITE_ORIGIN}/api/og?mode=ranking&locale=${locale}`;
  return {
    title: `${t.popularity.title} · ${t.appName}`,
    description: t.popularity.subtitle,
    alternates: localizedAlternates("/popularity", locale),
    openGraph: {
      title: `${t.popularity.title} · ${t.appName}`,
      description: t.popularity.subtitle,
      url: `${SITE_ORIGIN}${localeHref(locale, "/popularity")}`,
      images: [{ url: ogImage, width: 1080, height: 1440 }],
    },
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
    voteScore: r.voteScore,
    perfScore: r.perfScore,
    buzzScore: r.buzzScore,
    // 非 zh 取英文短评（缺则不显示，与全站 AiBlock 一致）；zh 取中文。
    blurb: locale === "zh" ? r.blurbZh : r.blurbEn,
  }));

  return (
    <PageContainer tier="standard">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.popularity.title}</h1>
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">{t.popularity.subtitle}</p>
      <Link
        href={localeHref(locale, "/scorers")}
        className="mt-1 inline-block text-xs text-green hover:underline"
      >
        {locale === "zh" ? "⚽ 射手榜" : "⚽ Top Scorers"} →
      </Link>

      {rows.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">⭐</div>
          <p className="mt-3 text-sm text-muted">{t.popularity.empty}</p>
        </div>
      ) : (
        <PopularityList rows={rows} locale={locale} />
      )}

      <p className="mt-6 text-center text-[11px] text-muted">{t.popularity.note}</p>
      <p className="mt-1 text-center text-[10px] text-muted">
        {locale === "zh"
          ? "球员头像来自 Wikimedia Commons（CC 许可）"
          : "Player photos via Wikimedia Commons (CC)"}
      </p>
      <footer className="mt-4 text-center">
        <Disclaimer />
      </footer>
    </PageContainer>
  );
}
