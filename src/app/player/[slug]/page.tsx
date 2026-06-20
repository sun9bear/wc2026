import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPlayer, getPlayerFacts, getPlayerIntro } from "@/lib/players/getPlayer";
import { getTeamSquad } from "@/lib/squad/getTeamSquad";
import { normalizeNameSorted } from "@/lib/players/perfScore";
import { PageContainer } from "@/components/PageContainer";
import { PlayerVoteButton } from "@/components/PlayerVoteButton";
import { getDict, localeHref, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { teamName, flagUrl } from "@/lib/football/teams";
import { nameZhBySlug, wikiTitleBySlug } from "@/data/players.seed";
import { PHOTOS } from "@/data/players.photos";
import { GALLERY } from "@/data/players.gallery";
import { localizedAlternates, selfUrl, SITE_ORIGIN } from "@/lib/seo/canonical";
import { JsonLd } from "@/lib/seo/jsonLd";

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
// 数据卡标签（6 语）。进球来自射手榜(世界杯)；出场/进球/俱乐部来自官方阵容(国家队生涯)。
const STAT: Record<Locale, { wcGoals: string; intlGoals: string; caps: string; club: string }> = {
  zh: { wcGoals: "世界杯进球", intlGoals: "国家队进球", caps: "国家队出场", club: "俱乐部" },
  en: { wcGoals: "World Cup goals", intlGoals: "Int'l goals", caps: "Caps", club: "Club" },
  es: { wcGoals: "Goles del Mundial", intlGoals: "Goles internac.", caps: "Internac.", club: "Club" },
  pt: { wcGoals: "Gols na Copa", intlGoals: "Gols pela seleção", caps: "Jogos seleção", club: "Clube" },
  de: { wcGoals: "WM-Tore", intlGoals: "Länderspieltore", caps: "Länderspiele", club: "Verein" },
  fr: { wcGoals: "Buts au Mondial", intlGoals: "Buts internat.", caps: "Sélections", club: "Club" },
};

const UI: Record<Locale, { photos: string; bioSource: string; more: string }> = {
  zh: { photos: "相册", bioSource: "资料来自维基百科 · CC BY-SA", more: "查看词条" },
  en: { photos: "Photos", bioSource: "Bio from Wikipedia · CC BY-SA", more: "Read more" },
  es: { photos: "Fotos", bioSource: "Biografía de Wikipedia · CC BY-SA", more: "Leer más" },
  pt: { photos: "Fotos", bioSource: "Biografia da Wikipédia · CC BY-SA", more: "Ler mais" },
  de: { photos: "Fotos", bioSource: "Biografie aus Wikipedia · CC BY-SA", more: "Mehr lesen" },
  fr: { photos: "Photos", bioSource: "Biographie de Wikipédia · CC BY-SA", more: "En savoir plus" },
};

// A1：球员页 SEO/GEO 文案（6 语）——标题/描述对齐「<球员> world cup 2026」查询；答案前置 lede 供抓取/AI 引用。
const PTITLE: Record<Locale, (name: string, team: string) => string> = {
  zh: (n, t) => `${n}（${t}）· 2026 世界杯`,
  en: (n, t) => `${n} — ${t} at the 2026 World Cup`,
  es: (n, t) => `${n} — ${t} en el Mundial 2026`,
  pt: (n, t) => `${n} — ${t} na Copa 2026`,
  de: (n, t) => `${n} — ${t} bei der WM 2026`,
  fr: (n, t) => `${n} — ${t} au Mondial 2026`,
};
const PDESC: Record<Locale, (name: string, team: string, pos: string | null, rank: number) => string> = {
  zh: (n, t, pos, r) => `${n}（${t}${pos ? " · " + pos : ""}）的 2026 世界杯资料：世界杯进球、国家队出场、球迷人气榜第 ${r} 名与简介。免费、无需注册。`,
  en: (n, t, pos, r) => `${n} — ${t}${pos ? `, ${pos}` : ""}, at the 2026 World Cup: World Cup goals, caps, fan-favorite rank #${r} and bio. Free, no sign-up.`,
  es: (n, t, pos, r) => `${n} (${t}${pos ? ` · ${pos}` : ""}) en el Mundial 2026: goles del Mundial, internacionalidades, puesto #${r} entre los favoritos de la afición y biografía. Gratis, sin registro.`,
  pt: (n, t, pos, r) => `${n} (${t}${pos ? ` · ${pos}` : ""}) na Copa 2026: gols na Copa, jogos pela seleção, #${r} entre os favoritos da torcida e biografia. Grátis, sem cadastro.`,
  de: (n, t, pos, r) => `${n} (${t}${pos ? ` · ${pos}` : ""}) bei der WM 2026: WM-Tore, Länderspiele, Platz #${r} bei den Fan-Favoriten und Biografie. Kostenlos, ohne Anmeldung.`,
  fr: (n, t, pos, r) => `${n} (${t}${pos ? ` · ${pos}` : ""}) au Mondial 2026 : buts au Mondial, sélections, #${r} parmi les favoris des fans et biographie. Gratuit, sans inscription.`,
};
const LEDE: Record<Locale, (name: string, team: string, pos: string | null, rank: number, votes: number) => string> = {
  zh: (n, t, pos, r, v) => `${n} 是 ${t} 出战 2026 世界杯的${pos ?? "球员"}，在 wc2026.cool 球迷人气榜排名第 ${r}（${v} 票）。`,
  en: (n, t, pos, r, v) => `${n} plays for ${t} at the 2026 World Cup${pos ? ` as a ${pos}` : ""}, ranked #${r} in the wc2026.cool fan-favorite index (${v} votes).`,
  es: (n, t, pos, r, v) => `${n} juega con ${t} en el Mundial 2026${pos ? ` como ${pos}` : ""}, #${r} en el índice de favoritos de wc2026.cool (${v} votos).`,
  pt: (n, t, pos, r, v) => `${n} joga pela ${t} na Copa 2026${pos ? ` como ${pos}` : ""}, #${r} no índice de favoritos da wc2026.cool (${v} votos).`,
  de: (n, t, pos, r, v) => `${n} spielt für ${t} bei der WM 2026${pos ? ` als ${pos}` : ""}, Platz #${r} im Fan-Favoriten-Index von wc2026.cool (${v} Stimmen).`,
  fr: (n, t, pos, r, v) => `${n} joue pour ${t} au Mondial 2026${pos ? ` comme ${pos}` : ""}, #${r} dans l'index des favoris de wc2026.cool (${v} votes).`,
};
const HOME_LABEL: Record<Locale, string> = {
  zh: "首页", en: "Home", es: "Inicio", pt: "Início", de: "Startseite", fr: "Accueil",
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
  const name = dispName(slug, p.name, locale);
  const team = teamName(p.teamName, locale);
  const pos = p.position ? POS[p.position]?.[locale] ?? null : null;
  const ogImg = PHOTOS[slug]?.url ?? `${SITE_ORIGIN}/og.png`;
  const title = PTITLE[locale](name, team);
  const description = PDESC[locale](name, team, pos, p.rank);
  return {
    title,
    description,
    alternates: localizedAlternates(`/player/${slug}`, locale),
    openGraph: { type: "profile", title, description, url: selfUrl(`/player/${slug}`, locale), images: [{ url: ogImg }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImg] },
  };
}

export default async function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = getDict(locale);
  const p = await getPlayer(slug);
  if (!p) notFound();

  // 反查官方阵容拿生涯数据（国家队出场/进球/俱乐部）：按 token 排序名匹配本队阵容。
  const squad = await getTeamSquad(p.teamName).catch(() => null);
  const sp =
    squad?.players.find((x) => normalizeNameSorted(x.name) === normalizeNameSorted(p.name)) ?? null;
  const stat = STAT[locale];

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

  // A1：Person + 面包屑实体（只填真实字段；sameAs→维基百科是最强 GEO 实体锚定，仅有词条时输出）。
  const bio = intro?.text ?? blurb ?? undefined;
  const playerJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${selfUrl(`/player/${slug}`, locale)}#person`,
        name,
        ...(pos ? { jobTitle: pos } : {}),
        ...(photo?.url ? { image: photo.url } : {}),
        ...(facts.birthDate ? { birthDate: facts.birthDate } : {}),
        ...(facts.heightCm ? { height: `${facts.heightCm} cm` } : {}),
        nationality: team,
        memberOf: { "@type": "SportsTeam", name: team },
        ...(wikiUrl ? { sameAs: [wikiUrl] } : {}),
        ...(bio ? { description: bio } : {}),
        url: selfUrl(`/player/${slug}`, locale),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: HOME_LABEL[locale], item: selfUrl("/", locale) },
          { "@type": "ListItem", position: 2, name, item: selfUrl(`/player/${slug}`, locale) },
        ],
      },
    ],
  };

  return (
    <PageContainer tier="prose">
      <Link href={localeHref(locale, "/popularity")} className="text-xs md:text-sm text-muted">
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
          <h1 className="font-head text-2xl md:text-3xl font-bold">{name}</h1>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            {flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={flag} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
            )}
            <span>{team}</span>
            {pos && <span>· {pos}</span>}
          </div>
          <div className="font-head mt-1 text-sm font-bold text-green tabular-nums">
            🏆 #{p.rank} · {t.popularity.title.replace(/^⭐\s*/, "")} {p.popValue}
          </div>
        </div>
      </header>

      {/* A1：答案前置 lede（服务端纯文本，命中「<球员> world cup 2026」+ 供 AI 引用） */}
      <p className="mt-3 text-sm leading-relaxed md:text-base">
        {LEDE[locale](name, team, pos, p.rank, p.votes)}
      </p>

      {/* Wikidata 事实（CC0）+ 分项 */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted tabular-nums">
        {age !== null && <span>🎂 {age}</span>}
        {facts.heightCm && <span>📏 {(facts.heightCm / 100).toFixed(2)}m</span>}
        <span>🗳 {p.votes}</span>
        <span>⚽ {p.perfScore}</span>
        <span>🔥 {p.buzzScore}</span>
      </div>

      {/* 真实数据卡：世界杯进球(射手榜) + 国家队生涯出场/进球/俱乐部(官方阵容)。只显示有数据的项。 */}
      {(p.goals > 0 || sp) && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {p.goals > 0 && (
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="font-head text-2xl font-bold tabular-nums text-gold">{p.goals}</div>
              <div className="mt-0.5 text-[11px] text-muted md:text-xs">🏆 {stat.wcGoals}</div>
            </div>
          )}
          {sp?.goals != null && (
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="font-head text-2xl font-bold tabular-nums">{sp.goals}</div>
              <div className="mt-0.5 text-[11px] text-muted md:text-xs">⚽ {stat.intlGoals}</div>
            </div>
          )}
          {sp?.caps != null && (
            <div className="rounded-md border border-border bg-surface-2 p-3">
              <div className="font-head text-2xl font-bold tabular-nums">{sp.caps}</div>
              <div className="mt-0.5 text-[11px] text-muted md:text-xs">👕 {stat.caps}</div>
            </div>
          )}
          {sp?.club && (
            <div className="col-span-2 rounded-md border border-border bg-surface-2 p-3 sm:col-span-1">
              <div className="font-head truncate text-sm font-bold" title={sp.club}>
                {sp.club}
              </div>
              <div className="mt-0.5 text-[11px] text-muted md:text-xs">🏟 {stat.club}</div>
            </div>
          )}
        </div>
      )}

      {blurb && <p className="mt-3 text-sm md:text-base italic text-muted">{blurb}</p>}

      {/* 维基百科简介（CC BY-SA，需署名 + 链接源页；当前语言词条，无则不显示） */}
      {intro && (
        <section className="mt-4">
          <p className="text-sm md:text-base leading-relaxed">{intro.text}</p>
          <a
            href={intro.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-block text-[11px] md:text-xs text-muted hover:text-green"
          >
            📖 {ui.bioSource} · {ui.more} →
          </a>
        </section>
      )}

      <JsonLd data={playerJsonLd} />
      <PlayerVoteButton playerId={p.id} initialVotes={p.votes} locale={locale} />

      {/* Commons 相册（自由许可，逐图链 Commons 源页 + 署名；不足 2 张则不显示） */}
      {gallery.length >= 2 && (
        <section className="mt-6">
          <h2 className="font-head mb-2 text-sm md:text-base font-semibold">{ui.photos}</h2>
          <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
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
          <p className="mt-1.5 text-[10px] md:text-xs text-muted">
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
        <p className="mt-4 text-[10px] md:text-xs text-muted">
          📷 {photo.author || "Wikimedia Commons"} · {photo.license} · Wikimedia Commons
        </p>
      )}

    </PageContainer>
  );
}
