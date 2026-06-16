import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getScorers } from "@/lib/football/getScorers";
import { teamName, flagUrl } from "@/lib/football/teams";
import { localeHref, getDict, type Locale } from "@/i18n";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";

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
  const scorers = await getScorers().catch(() => []);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-2 text-2xl font-bold">⚽ {c.h1}</h1>
      <p className="mt-1 text-[11px] text-muted">{c.source}</p>
      <Link
        href={localeHref(locale, "/popularity")}
        className="mt-2 inline-block text-xs text-green hover:underline"
      >
        {getDict(locale).popularity.title} →
      </Link>

      {scorers.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-border bg-surface p-4 text-center text-sm text-muted">
          {c.empty}
        </p>
      ) : (
        <ol className="mt-5 space-y-1.5">
          {scorers.map((s, i) => {
            const flag = flagUrl(s.teamName) ?? s.crest;
            return (
              <li
                key={`${s.playerName}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5"
              >
                <span className="font-head w-6 shrink-0 text-center text-sm text-muted">
                  {s.rank}
                </span>
                {flag ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flag}
                    alt=""
                    className="h-4 w-6 shrink-0 rounded-[2px] object-cover ring-1 ring-border"
                  />
                ) : (
                  <span className="w-6 shrink-0 text-center text-base leading-none">⚽</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.playerName}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {teamName(s.teamName, locale)}
                    {s.penalties ? ` · ${c.pen(s.penalties)}` : ""}
                  </span>
                </span>
                {s.playedMatches ? (
                  <span className="shrink-0 text-right text-[11px] text-muted">
                    {s.playedMatches} {c.matches}
                  </span>
                ) : null}
                <span className="font-head shrink-0 text-right">
                  <span className="text-lg font-bold text-green">{s.goals}</span>
                  <span className="ml-0.5 text-[11px] text-muted">{c.goals}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </main>
  );
}
