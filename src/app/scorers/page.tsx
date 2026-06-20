import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getScorers } from "@/lib/football/getScorers";
import { teamName, flagUrl } from "@/lib/football/teams";
import { PageContainer } from "@/components/PageContainer";
import { localeHref, getDict, type Locale, BCP47_LOCALE } from "@/i18n";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { JsonLd } from "@/lib/seo/jsonLd";
import { getSettledIndex } from "@/lib/seo/freshness";

// 射手榜（金靴）页：数据 football-data.org，30min 共享缓存。EN-first，6 语种本地化。
// 合规：纯进球榜，无任何盘口/赔率措辞。

const COPY = {
  zh: {
    title: "2026 世界杯射手榜 · 金靴争夺（实时）",
    description:
      "2026 世界杯射手榜：各球员进球数、出场数与点球数，金靴奖争夺实时排名，赛后自动更新。免费，无需注册。",
    h1: "射手榜 · 金靴争夺",
    source: "数据来源 football-data.org · 约每 30 分钟更新",
    goals: "球",
    matches: "出场",
    pen: (n: number) => `含 ${n} 粒点球`,
    empty: "小组赛进行中，射手数据稍后更新。",
    back: "← 返回首页",
    crumbHome: "首页",
  },
  en: {
    title: "World Cup 2026 Top Scorers · Golden Boot race (live)",
    description:
      "World Cup 2026 top scorers: goals, appearances and penalties for every player, the live Golden Boot race, updated after every match. Free, no sign-up.",
    h1: "Top Scorers · Golden Boot race",
    source: "Data by football-data.org · updated about every 30 min",
    goals: "goals",
    matches: "apps",
    pen: (n: number) => `${n} from the spot`,
    empty: "Group stage under way — scorer data updates shortly.",
    back: "← Back home",
    crumbHome: "Home",
  },
  es: {
    title: "Goleadores del Mundial 2026 · Carrera por la Bota de Oro (en vivo)",
    description:
      "Goleadores del Mundial 2026: goles, partidos y penaltis de cada jugador, la carrera por la Bota de Oro en vivo, actualizada tras cada partido. Gratis, sin registro.",
    h1: "Goleadores · Bota de Oro",
    source: "Datos de football-data.org · actualizado cada 30 min aprox.",
    goals: "goles",
    matches: "PJ",
    pen: (n: number) => `${n} de penalti`,
    empty: "Fase de grupos en curso: los datos de goleadores se actualizan en breve.",
    back: "← Volver al inicio",
    crumbHome: "Inicio",
  },
  pt: {
    title: "Artilheiros da Copa 2026 · Disputa da Chuteira de Ouro (ao vivo)",
    description:
      "Artilheiros da Copa 2026: gols, jogos e pênaltis de cada jogador, a disputa ao vivo da Chuteira de Ouro, atualizada após cada jogo. Grátis, sem cadastro.",
    h1: "Artilheiros · Chuteira de Ouro",
    source: "Dados de football-data.org · atualizado a cada 30 min aprox.",
    goals: "gols",
    matches: "J",
    pen: (n: number) => `${n} de pênalti`,
    empty: "Fase de grupos em andamento — os dados de artilheiros atualizam em breve.",
    back: "← Voltar ao início",
    crumbHome: "Início",
  },
  de: {
    title: "WM 2026 Torjäger · Rennen um den Goldenen Schuh (live)",
    description:
      "WM-2026-Torjäger: Tore, Einsätze und Elfmeter jedes Spielers, das Live-Rennen um den Goldenen Schuh, nach jedem Spiel aktualisiert. Kostenlos, ohne Anmeldung.",
    h1: "Torjäger · Goldener Schuh",
    source: "Daten von football-data.org · etwa alle 30 Min. aktualisiert",
    goals: "Tore",
    matches: "Sp.",
    pen: (n: number) => `${n} per Elfmeter`,
    empty: "Gruppenphase läuft — Torjägerdaten werden in Kürze aktualisiert.",
    back: "← Zurück zur Startseite",
    crumbHome: "Startseite",
  },
  fr: {
    title: "Buteurs du Mondial 2026 · Course au Soulier d'or (en direct)",
    description:
      "Buteurs du Mondial 2026 : buts, matchs et penaltys de chaque joueur, la course au Soulier d'or en direct, mise à jour après chaque match. Gratuit, sans inscription.",
    h1: "Buteurs · Soulier d'or",
    source: "Données par football-data.org · mis à jour environ toutes les 30 min",
    goals: "buts",
    matches: "M",
    pen: (n: number) => `${n} sur penalty`,
    empty: "Phase de groupes en cours — les données des buteurs seront mises à jour bientôt.",
    back: "← Retour à l'accueil",
    crumbHome: "Accueil",
  },
} as const;

// A2：表头 / "更新于" / 答案前置金靴领跑句 / forecast 互链（6 语）。
const TH: Record<Locale, { rank: string; player: string; team: string }> = {
  zh: { rank: "#", player: "球员", team: "球队" },
  en: { rank: "#", player: "Player", team: "Team" },
  es: { rank: "#", player: "Jugador", team: "Equipo" },
  pt: { rank: "#", player: "Jogador", team: "Seleção" },
  de: { rank: "#", player: "Spieler", team: "Team" },
  fr: { rank: "#", player: "Joueur", team: "Équipe" },
};
const UPDATED: Record<Locale, string> = {
  zh: "更新于", en: "Updated", es: "Actualizado", pt: "Atualizado", de: "Aktualisiert", fr: "Mis à jour",
};
const FCAST: Record<Locale, string> = {
  zh: "📊 出线 & 夺冠概率", en: "📊 Advancement & title odds", es: "📊 Probabilidades de avance y título",
  pt: "📊 Probabilidades de avanço e título", de: "📊 Weiterkommen- & Titelchancen", fr: "📊 Probabilités de qualification et titre",
};
const LEAD: Record<Locale, (l: string, g: number, t: string, r: string | null, rg: number) => string> = {
  zh: (l, g, t, r, rg) => `${l}（${t}）以 ${g} 球领跑 2026 世界杯金靴榜${r ? `，${r} 以 ${rg} 球紧随其后` : ""}。`,
  en: (l, g, t, r, rg) => `${l} (${t}) leads the World Cup 2026 Golden Boot race with ${g} goal${g === 1 ? "" : "s"}${r ? `, ahead of ${r} on ${rg}` : ""}.`,
  es: (l, g, t, r, rg) => `${l} (${t}) lidera la carrera por la Bota de Oro del Mundial 2026 con ${g} gol${g === 1 ? "" : "es"}${r ? `, por delante de ${r} con ${rg}` : ""}.`,
  pt: (l, g, t, r, rg) => `${l} (${t}) lidera a disputa da Chuteira de Ouro da Copa 2026 com ${g} gol${g === 1 ? "" : "s"}${r ? `, à frente de ${r} com ${rg}` : ""}.`,
  de: (l, g, t, r, rg) => `${l} (${t}) führt das Rennen um den Goldenen Schuh der WM 2026 mit ${g} Tor${g === 1 ? "" : "en"} an${r ? `, vor ${r} mit ${rg}` : ""}.`,
  fr: (l, g, t, r, rg) => `${l} (${t}) mène la course au Soulier d'or du Mondial 2026 avec ${g} but${g === 1 ? "" : "s"}${r ? `, devant ${r} avec ${rg}` : ""}.`,
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/scorers", locale),
    openGraph: {
      type: "website",
      url: selfUrl("/scorers", locale),
      siteName: "wc2026.cool",
      title: c.title,
      description: c.description,
      images: [{ url: "/og.png", width: 1080, height: 1440 }],
    },
  };
}

export default async function ScorersPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const th = TH[locale];
  const [scorers, idx] = await Promise.all([
    getScorers().catch(() => []),
    getSettledIndex().catch(() => null),
  ]);

  const scorersJsonLd =
    scorers.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ItemList",
              name: c.h1,
              numberOfItems: scorers.length,
              ...(idx?.all ? { dateModified: idx.all } : {}),
              itemListElement: scorers.slice(0, 30).map((s, i) => ({
                "@type": "ListItem",
                position: s.rank ?? i + 1,
                name: `${s.playerName} — ${s.goals} ${c.goals} (${teamName(s.teamName, locale)})`,
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: c.crumbHome, item: selfUrl("/", locale) },
                { "@type": "ListItem", position: 2, name: c.h1, item: selfUrl("/scorers", locale) },
              ],
            },
          ],
        }
      : null;

  return (
    <PageContainer tier="prose">
      {scorersJsonLd && <JsonLd data={scorersJsonLd} />}
      <Link href={localeHref(locale, "/")} className="text-xs md:text-sm text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-2 text-2xl md:text-3xl font-bold">⚽ {c.h1}</h1>
      <p className="mt-1 text-[11px] md:text-xs text-muted">{c.source}</p>
      {idx?.all && (
        <p className="mt-0.5 text-[11px] md:text-xs text-muted">
          {UPDATED[locale]}{" "}
          {new Date(idx.all).toLocaleDateString(BCP47_LOCALE[locale] ?? "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <Link href={localeHref(locale, "/popularity")} className="text-xs md:text-sm text-green hover:underline">
          {getDict(locale).popularity.title} →
        </Link>
        <Link href={localeHref(locale, "/forecast")} className="text-xs md:text-sm text-green hover:underline">
          {FCAST[locale]} →
        </Link>
      </div>

      {scorers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-4 text-center text-sm md:text-base text-muted">
          {c.empty}
        </p>
      ) : (
        <>
          {/* A2：答案前置金靴领跑句（服务端纯文本，供搜索/AI 引用；单人时去掉次席从句） */}
          <p className="mt-4 text-sm md:text-base leading-relaxed">
            {LEAD[locale](
              scorers[0].playerName,
              scorers[0].goals,
              teamName(scorers[0].teamName, locale),
              scorers[1] ? scorers[1].playerName : null,
              scorers[1]?.goals ?? 0
            )}
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full text-sm">
              <caption className="sr-only">{c.title}</caption>
              <thead>
                <tr className="border-b border-border text-[11px] md:text-xs text-muted">
                  <th className="px-2 py-2 text-left font-normal">{th.rank}</th>
                  <th className="px-2 py-2 text-left font-normal">{th.player}</th>
                  <th className="px-2 py-2 text-left font-normal">{th.team}</th>
                  <th className="px-2 py-2 text-right font-normal">{c.matches}</th>
                  <th className="px-2 py-2 text-right font-normal">{c.goals}</th>
                </tr>
              </thead>
              <tbody>
                {scorers.map((s, i) => {
                  const flag = flagUrl(s.teamName) ?? s.crest;
                  return (
                    <tr key={`${s.playerName}-${i}`} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-2 font-head tabular-nums text-muted">{s.rank}</td>
                      <td className="px-2 py-2">
                        <span className="font-medium">{s.playerName}</span>
                        {s.penalties ? (
                          <span className="block text-[11px] text-muted">{c.pen(s.penalties)}</span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center gap-1.5">
                          {flag && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={flag}
                              alt=""
                              width={24}
                              height={16}
                              loading="lazy"
                              decoding="async"
                              className="h-4 w-6 rounded-[2px] object-cover ring-1 ring-border"
                            />
                          )}
                          <span className="truncate">{teamName(s.teamName, locale)}</span>
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted">
                        {s.playedMatches || "–"}
                      </td>
                      <td className="px-2 py-2 text-right font-head tabular-nums">
                        <span className="text-base font-bold text-green">{s.goals}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageContainer>
  );
}
