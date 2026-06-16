import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getPlayerFacts, getPlayerIntro } from "@/lib/players/getPlayer";
import { PlayerVoteButton } from "@/components/PlayerVoteButton";
import { Disclaimer } from "@/components/Disclaimer";
import { getDict, localeHref, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { teamName, flagUrl } from "@/lib/football/teams";
import { nameZhBySlug, wikiTitleBySlug } from "@/data/players.seed";
import { PHOTOS } from "@/data/players.photos";
import { GALLERY } from "@/data/players.gallery";
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

// 详情页本地文案（6 语，页面专属，免动全局 Dict）。
const UI: Record<Locale, { photos: string; bioSource: string; more: string }> = {
  zh: { photos: "相册", bioSource: "资料来自维基百科 · CC BY-SA", more: "查看词条" },
  en: { photos: "Photos", bioSource: "Bio from Wikipedia · CC BY-SA", more: "Read more" },
  es: { photos: "Fotos", bioSource: "Biografía de Wikipedia · CC BY-SA", more: "Leer más" },
  pt: { photos: "Fotos", bioSource: "Biografia da Wikipédia · CC BY-SA", more: "Ler mais" },
  de: { photos: "Fotos", bioSource: "Biografie aus Wikipedia · CC BY-SA", more: "Mehr lesen" },
  fr: { photos: "Photos", bioSource: "Biographie de Wikipédia · CC BY-SA", more: "En savoir plus" },
};

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
  const intro = wikiTitle ? await getPlayerIntro(wikiTitle, locale) : null;
  const gallery = GALLERY[slug] ?? [];
  const ui = UI[locale];

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

      {/* 维基百科简介（CC BY-SA，需署名 + 链接源页；当前语言词条，无则不显示） */}
      {intro && (
        <section className="mt-4">
          <p className="text-sm leading-relaxed">{intro.text}</p>
          <a
            href={intro.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-[11px] text-muted hover:text-green"
          >
            📖 {ui.bioSource} · {ui.more} →
          </a>
        </section>
      )}

      <PlayerVoteButton playerId={p.id} initialVotes={p.votes} locale={locale} />

      {/* Commons 相册（自由许可，逐图链 Commons 源页 + 署名；不足 2 张则不显示） */}
      {gallery.length >= 2 && (
        <section className="mt-6">
          <h2 className="font-head mb-2 text-sm font-semibold">{ui.photos}</h2>
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((g) => (
              <a
                key={g.file}
                href={`https://commons.wikimedia.org/wiki/${encodeURIComponent(g.file)}`}
                target="_blank"
                rel="noopener noreferrer"
                title={`${g.author} · ${g.license}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.url}
                  alt={name}
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover ring-1 ring-border transition hover:opacity-90"
                />
              </a>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted">
            📷 {Array.from(new Set(gallery.map((g) => `${g.author} (${g.license})`))).join(" · ")} ·
            Wikimedia Commons
          </p>
        </section>
      )}

      {/* 兜底维基链接：仅当无当前语言简介时显示 */}
      {!intro && wikiUrl && (
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
