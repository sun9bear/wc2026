import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getPlayerFacts } from "@/lib/players/getPlayer";
import { PlayerVoteButton } from "@/components/PlayerVoteButton";
import { Disclaimer } from "@/components/Disclaimer";
import { getDict, localeHref, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { teamName, flagUrl } from "@/lib/football/teams";
import { nameZhBySlug, wikiTitleBySlug } from "@/data/players.seed";
import { PHOTOS } from "@/data/players.photos";
import { localizedAlternates } from "@/lib/seo/canonical";

export const dynamic = "force-dynamic";

const POS: Record<string, Record<Locale, string>> = {
  FW: { zh: "前锋", en: "Forward", es: "Delantero", pt: "Atacante", de: "Stürmer", fr: "Attaquant" },
  MF: { zh: "中场", en: "Midfielder", es: "Centrocampista", pt: "Meio-campo", de: "Mittelfeld", fr: "Milieu" },
  DF: { zh: "后卫", en: "Defender", es: "Defensa", pt: "Defensor", de: "Verteidiger", fr: "Défenseur" },
  GK: { zh: "门将", en: "Goalkeeper", es: "Portero", pt: "Goleiro", de: "Torwart", fr: "Gardien" },
};

function dispName(slug: string, latin: string, locale: Locale): string {
  return locale === "zh" ? nameZhBySlug.get(slug) ?? latin : latin;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const p = await getPlayer(slug);
  if (!p) return {};
  const t = getDict(locale);
  const name = dispName(slug, p.name, locale);
  const photo = PHOTOS[slug]?.url;
  const blurb = locale === "zh" ? p.blurbZh : p.blurbEn;
  return {
    title: `${name} · ${t.popularity.title} · ${t.appName}`,
    description: blurb ?? `${name} — ${teamName(p.teamName, locale)}`,
    alternates: localizedAlternates(`/player/${slug}`, locale),
    openGraph: photo ? { images: [{ url: photo }] } : undefined,
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const p = await getPlayer(slug);
  if (!p) notFound();

  const name = dispName(slug, p.name, locale);
  const team = teamName(p.teamName, locale);
  const flag = flagUrl(p.teamName);
  const photo = PHOTOS[slug];
  const wikiTitle = wikiTitleBySlug.get(slug);
  const blurb = locale === "zh" ? p.blurbZh : p.blurbEn;
  const pos = p.position ? POS[p.position]?.[locale] : null;

  const facts = wikiTitle ? await getPlayerFacts(wikiTitle) : { birthDate: null, heightCm: null };
  const age = facts.birthDate
    ? Math.floor((Date.now() - Date.parse(facts.birthDate)) / 31_557_600_000)
    : null;
  const wikiUrl = wikiTitle ? `https://en.wikipedia.org/wiki/${wikiTitle}` : null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={localeHref(locale, "/popularity")} className="text-xs text-muted">
        {t.common.back}
      </Link>

      <header className="mt-3 flex items-center gap-4">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={name} className="h-20 w-20 shrink-0 rounded-full object-cover ring-1 ring-border" />
        ) : flag ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={flag} alt="" className="h-12 w-16 shrink-0 rounded-sm object-cover ring-1 ring-border" />
        ) : (
          <span className="text-5xl">⚽</span>
        )}
        <div className="min-w-0">
          <h1 className="font-head text-2xl font-bold">{name}</h1>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            {flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={flag} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
            )}
            <span>{team}</span>
            {pos && <span>· {pos}</span>}
          </div>
          <div className="font-head mt-1 text-sm font-bold text-green tabular-nums">
            🏆 #{p.rank} · {t.popularity.title.replace(/^⭐\s*/, "")} {p.index}
          </div>
        </div>
      </header>

      {/* Wikidata 事实（CC0）+ 分项 */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted tabular-nums">
        {age !== null && <span>🎂 {age}</span>}
        {facts.heightCm && <span>📏 {(facts.heightCm / 100).toFixed(2)}m</span>}
        <span>🗳 {p.votes}</span>
        <span>⚽ {p.perfScore}</span>
        <span>🔥 {p.buzzScore}</span>
      </div>

      {blurb && <p className="mt-3 text-sm italic text-muted">{blurb}</p>}

      <PlayerVoteButton playerId={p.id} initialVotes={p.votes} locale={locale} />

      {wikiUrl && (
        <a
          href={wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-block text-sm text-green hover:underline"
        >
          {locale === "zh" ? "维基百科详情 →" : "More on Wikipedia →"}
        </a>
      )}

      {photo && (
        <p className="mt-4 text-[10px] text-muted">
          📷 {photo.author || "Wikimedia Commons"} · {photo.license} · Wikimedia Commons
        </p>
      )}

      <footer className="mt-6 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
