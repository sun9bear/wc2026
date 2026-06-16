import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale } from "@/i18n";
import { teamName } from "@/lib/football/teams";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { getForecast } from "@/lib/prob/pipeline";
import { findTeam, teamSlug } from "@/lib/prob/findTeam";
import { ThirdCalculator } from "@/components/ThirdCalculator";
import { AdvanceRequirements } from "@/components/AdvanceRequirements";
import { getAdvanceRequirements } from "@/lib/prob/requirements";
import { CalculatorFocus } from "@/components/CalculatorFocus";
import { HeaderShare } from "@/components/HeaderShare";
import { JsonLd } from "@/lib/seo/jsonLd";

export const maxDuration = 60;

const SITE = "https://www.wc2026.cool";

const COPY = {
  zh: {
    title: "第三名出线计算器 · 2026 世界杯（我的队还有戏吗）",
    description:
      "点选剩余小组赛结果，实时计算 12 个小组排名与 8 个最佳第三名晋级形势——2026 世界杯 48 队新赛制专用工具。",
    teamTitle: (zh: string) => `${zh}怎样才能出线？2026 世界杯第三名计算器`,
    teamDesc: (zh: string) =>
      `${zh}的出线形势实时计算：改任意剩余赛果，立即看 ${zh} 在小组与最佳第三名榜的位置变化。免费、无需注册。`,
    h1: "第三名出线计算器",
    back: "← 返回",
    forecast: "📊 看模型概率版 →",
  },
  en: {
    title: "World Cup 2026 Third-Place Scenario Calculator — Who Advances?",
    description:
      "Pick the remaining group-stage results and instantly see all 12 tables and which 8 best third-placed teams advance under the new 48-team format.",
    teamTitle: (name: string) => `Can ${name} still advance? World Cup 2026 scenario calculator`,
    teamDesc: (name: string) =>
      `Live qualification scenarios for ${name}: flip any remaining result and instantly see where ${name} lands in the group and best-thirds race. Free, no sign-up.`,
    h1: "Third-Place Scenario Calculator",
    back: "← Back",
    forecast: "📊 See model probabilities →",
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：本页 shareText / nm 仍有 locale 三元（A4 清剿项），激活时一并处理。
  es: {
    title: "Calculadora de escenarios de terceros · Mundial 2026 (¿mi equipo aún tiene opciones?)",
    description:
      "Elige los resultados restantes de la fase de grupos y calcula en tiempo real las 12 tablas y qué 8 mejores terceros se clasifican — herramienta para el nuevo formato de 48 equipos del Mundial 2026.",
    teamTitle: (name: string) => `¿Cómo puede clasificar ${name}? Calculadora de escenarios del Mundial 2026`,
    teamDesc: (name: string) =>
      `Escenarios de clasificación en vivo para ${name}: cambia cualquier resultado restante y ve al instante dónde queda ${name} en el grupo y en la carrera por los mejores terceros. Gratis, sin registro.`,
    h1: "Calculadora de escenarios de terceros",
    back: "← Atrás",
    forecast: "📊 Ver versión de probabilidades →",
  },
  pt: {
    title: "Calculadora de cenários dos terceiros · Copa 2026 (minha seleção ainda tem chance?)",
    description:
      "Escolha os resultados restantes da fase de grupos e calcule em tempo real as 12 tabelas e quais 8 melhores terceiros se classificam — ferramenta para o novo formato de 48 seleções da Copa 2026.",
    teamTitle: (name: string) => `Como ${name} pode se classificar? Calculadora de cenários da Copa 2026`,
    teamDesc: (name: string) =>
      `Cenários de classificação ao vivo para ${name}: mude qualquer resultado restante e veja na hora onde ${name} fica no grupo e na disputa pelos melhores terceiros. Grátis, sem cadastro.`,
    h1: "Calculadora de cenários dos terceiros",
    back: "← Voltar",
    forecast: "📊 Ver versão de probabilidades →",
  },
  de: {
    title: "Szenario-Rechner für Gruppendritte · WM 2026 (Hat mein Team noch eine Chance?)",
    description:
      "Wähle die noch offenen Gruppenspiel-Ergebnisse und berechne in Echtzeit alle 12 Tabellen und welche 8 besten Gruppendritten weiterkommen — Tool für das neue 48-Team-Format der WM 2026.",
    teamTitle: (name: string) => `Wie kann ${name} noch weiterkommen? WM-2026-Szenario-Rechner`,
    teamDesc: (name: string) =>
      `Live-Qualifikationsszenarien für ${name}: Ändere ein beliebiges offenes Ergebnis und sieh sofort, wo ${name} in der Gruppe und im Rennen um die besten Dritten steht. Kostenlos, ohne Anmeldung.`,
    h1: "Szenario-Rechner für Gruppendritte",
    back: "← Zurück",
    forecast: "📊 Wahrscheinlichkeits-Version ansehen →",
  },
  fr: {
    title: "Calculateur de scénarios des troisièmes · Mondial 2026 (mon équipe a-t-elle encore une chance ?)",
    description:
      "Choisis les résultats restants de la phase de groupes et calcule en direct les 12 classements et quels 8 meilleurs troisièmes se qualifient — outil pour le nouveau format à 48 équipes du Mondial 2026.",
    teamTitle: (name: string) => `Comment ${name} peut-il encore se qualifier ? Calculateur de scénarios du Mondial 2026`,
    teamDesc: (name: string) =>
      `Scénarios de qualification en direct pour ${name} : modifie n'importe quel résultat restant et vois aussitôt où se situe ${name} dans le groupe et la course aux meilleurs troisièmes. Gratuit, sans inscription.`,
    h1: "Calculateur de scénarios des troisièmes",
    back: "← Retour",
    forecast: "📊 Voir la version probabilités →",
  },
} as const;

// 12 支热门队（北美主场三强 + 传统豪门 + 东亚），slug 与 DB 英文名对应
const HOT = [
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Japan",
  "South Korea",
  "England",
  "France",
  "Spain",
  "Portugal",
  "Germany",
];

// FAQ 富摘要（GEO/SEO）：承接"世界杯第三名怎么算 / 小组怎么出线"问答型搜索；纯规则、零博彩词。
const FAQ: Record<Locale, { q: string; a: string }[]> = {
  zh: [
    { q: "2026 世界杯怎么从小组出线？", a: "每组前 2 名直接晋级，12 个小组第三名中最好的 8 个也进 32 强。" },
    { q: "最佳第三名怎么排名？", a: "先比积分，再比净胜球、进球数（公平竞赛分与抽签为最后判据），前 8 名晋级。" },
    { q: "小组第三还有机会出线吗？", a: "有。12 个小组第三里有 8 个能进 32 强；用计算器改剩余赛果即可看你的队是否在安全线内。" },
  ],
  en: [
    { q: "How do teams qualify from a World Cup 2026 group?", a: "The top 2 of each group advance, plus the 8 best third-placed teams across the 12 groups reach the Round of 32." },
    { q: "How are the best third-placed teams ranked?", a: "By points, then goal difference, then goals scored (fair-play points and drawing of lots as final tiebreakers); the top 8 advance." },
    { q: "Can a third-placed team still advance?", a: "Yes — 8 of the 12 third-placed teams make the Round of 32. Flip the remaining results in the calculator to see if your team is above the line." },
  ],
  es: [
    { q: "¿Cómo se clasifica un equipo desde un grupo del Mundial 2026?", a: "Los 2 primeros de cada grupo avanzan, más los 8 mejores terceros de los 12 grupos llegan a dieciseisavos." },
    { q: "¿Cómo se ordenan los mejores terceros?", a: "Por puntos, luego diferencia de goles y goles a favor (juego limpio y sorteo como criterios finales); los 8 mejores avanzan." },
    { q: "¿Puede clasificar un tercero?", a: "Sí: 8 de los 12 terceros llegan a dieciseisavos. Cambia los resultados restantes en la calculadora para ver si tu equipo está por encima del corte." },
  ],
  pt: [
    { q: "Como uma seleção se classifica de um grupo da Copa 2026?", a: "Os 2 primeiros de cada grupo avançam, mais os 8 melhores terceiros dos 12 grupos chegam às 16-avas." },
    { q: "Como os melhores terceiros são classificados?", a: "Por pontos, depois saldo de gols e gols marcados (fair-play e sorteio como critérios finais); os 8 melhores avançam." },
    { q: "Um terceiro colocado ainda pode se classificar?", a: "Sim: 8 dos 12 terceiros vão às 16-avas. Mude os resultados restantes na calculadora para ver se sua seleção está acima da linha." },
  ],
  de: [
    { q: "Wie qualifiziert man sich aus einer WM-2026-Gruppe?", a: "Die besten 2 jeder Gruppe kommen weiter, plus die 8 besten Gruppendritten der 12 Gruppen ins Sechzehntelfinale." },
    { q: "Wie werden die besten Gruppendritten gereiht?", a: "Nach Punkten, dann Tordifferenz und erzielten Toren (Fair-Play und Losentscheid als letzte Kriterien); die Top 8 kommen weiter." },
    { q: "Kann ein Gruppendritter noch weiterkommen?", a: "Ja — 8 der 12 Gruppendritten erreichen das Sechzehntelfinale. Ändere die offenen Ergebnisse im Rechner, um zu sehen, ob dein Team über dem Strich liegt." },
  ],
  fr: [
    { q: "Comment se qualifie-t-on depuis un groupe du Mondial 2026 ?", a: "Les 2 premiers de chaque groupe avancent, plus les 8 meilleurs troisièmes des 12 groupes atteignent les seizièmes." },
    { q: "Comment classe-t-on les meilleurs troisièmes ?", a: "Aux points, puis différence de buts et buts marqués (fair-play et tirage au sort en derniers critères) ; les 8 meilleurs avancent." },
    { q: "Un troisième peut-il encore se qualifier ?", a: "Oui : 8 des 12 troisièmes atteignent les seizièmes. Modifie les résultats restants dans le calculateur pour voir si ton équipe est au-dessus de la barre." },
  ],
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}): Promise<Metadata> {
  const { team = "" } = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];
  if (team) {
    try {
      const data = await getForecast();
      const hit = findTeam(data, team);
      if (hit) {
        const nm = locale === "zh" ? hit.team.zh : teamName(hit.team.name, locale);
        const og = `/api/og?team=${teamSlug(hit.team.name)}&locale=${locale}`;
        return {
          title: c.teamTitle(nm),
          description: c.teamDesc(nm),
          // ?team= 变体合并到 /calculator（同一工具、不入 sitemap，避免近重复页）。
          alternates: localizedAlternates("/calculator", locale),
          openGraph: { images: [{ url: og, width: 1080, height: 1440 }] },
          twitter: { card: "summary_large_image", images: [og] },
        };
      }
    } catch {
      /* 降级为通用 meta */
    }
  }
  const fallbackOg = `${SITE}/api/og?mode=thirds&locale=${locale}`;
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/calculator", locale),
    openGraph: { type: "website", images: [{ url: fallbackOg, width: 1080, height: 1440 }] },
    twitter: { card: "summary_large_image", images: [fallbackOg] },
  };
}

export default async function CalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const { team = "" } = await searchParams;
  const locale = await getLocale();
  const c = COPY[locale];
  const data = await getForecast();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ[locale].map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: { "@type": "Answer", text: qa.a },
    })),
  };

  const groups = data.groups.map((g) => ({
    letter: g.letter,
    teams: g.table.map((t) => ({ id: t.id, name: t.name, zh: t.zh, flag: t.flag })),
  }));
  const remaining = data.matches.map((m) => ({
    id: m.id,
    homeId: m.homeId,
    awayId: m.awayId,
    likely: m.likely,
  }));

  const hit = team ? findTeam(data, team) : null;
  const requirements = hit ? await getAdvanceRequirements(hit.team.id) : null;
  const allTeams = data.groups
    .flatMap((g) => g.table)
    .map((t) => ({ name: t.name, zh: t.zh, slug: teamSlug(t.name), flag: t.flag }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const hotTeams = HOT.map((n) => allTeams.find((t) => t.name === n)).filter(
    (x): x is { name: string; zh: string; slug: string; flag: string | null } => !!x
  );

  // 页眉分享（任务 A）：选了队 → 该队 OG 卡（zh 带二维码）；未选 → 仅链接分享整页。
  const focusSlug = hit ? teamSlug(hit.team.name) : null;
  const shareUrl = focusSlug
    ? selfUrl(`/calculator?team=${focusSlug}`, locale)
    : selfUrl("/calculator", locale);
  const advPct = hit
    ? (hit.team.pAdvance > 1 ? hit.team.pAdvance : hit.team.pAdvance * 100).toFixed(0)
    : "";
  const nmShare = hit ? (locale === "zh" ? hit.team.zh : teamName(hit.team.name, locale)) : "";
  const SHARE_HIT: Record<Locale, string> = {
    zh: `${nmShare}出线概率 ${advPct}% · 自己改一版剩余赛果`,
    en: `${nmShare} chance to advance — flip remaining results yourself`,
    es: `${nmShare}: probabilidad de avanzar ${advPct}% · cambia tú los resultados restantes`,
    pt: `${nmShare}: chance de avançar ${advPct}% · mude você os resultados restantes`,
    de: `${nmShare}: Chance aufs Weiterkommen ${advPct}% · ändere selbst die Restergebnisse`,
    fr: `${nmShare} : probabilité de qualification ${advPct}% · modifie toi-même les résultats restants`,
  };
  const SHARE_GENERIC: Record<Locale, string> = {
    zh: "2026 世界杯出线计算器（我的队还有戏吗）",
    en: "World Cup 2026 scenario calculator",
    es: "Calculadora de escenarios del Mundial 2026",
    pt: "Calculadora de cenários da Copa 2026",
    de: "WM-2026-Szenario-Rechner",
    fr: "Calculateur de scénarios du Mondial 2026",
  };
  const shareText = hit ? SHARE_HIT[locale] : SHARE_GENERIC[locale];
  const shareOg = focusSlug
    ? `${SITE}/api/og?team=${focusSlug}&locale=${locale}&u=${encodeURIComponent(localeHref(locale, `/calculator?team=${focusSlug}`))}`
    : null;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <JsonLd data={faqJsonLd} />
      <div className="flex items-center justify-between gap-2">
        <Link href={localeHref(locale, "/")} className="shrink-0 text-xs text-muted">
          {c.back}
        </Link>
        <div className="flex items-center gap-2">
          <Link href={localeHref(locale, "/forecast")} className="shrink-0 text-xs text-green">
            {c.forecast}
          </Link>
          <HeaderShare
            locale={locale}
            shareUrl={shareUrl}
            text={shareText}
            ogUrl={shareOg}
            source="calculator"
          />
        </div>
      </div>
      <h1 className="font-head mb-4 mt-3 text-2xl font-bold">🧮 {c.h1}</h1>
      <CalculatorFocus
        locale={locale}
        hot={hotTeams}
        all={allTeams}
        focus={
          hit
            ? {
                name: hit.team.name,
                zh: hit.team.zh,
                flag: hit.team.flag,
                letter: hit.letter,
                rank: hit.rank,
                pAdvance: hit.team.pAdvance,
                pChampion: hit.team.pChampion,
                slug: teamSlug(hit.team.name),
              }
            : null
        }
      />
      {hit && requirements && (
        <AdvanceRequirements data={requirements} locale={locale} teamLabel={nmShare} />
      )}
      <ThirdCalculator
        locale={locale}
        groups={groups}
        played={data.played}
        remaining={remaining}
        rating={data.rating}
        focusLetter={hit?.letter ?? null}
        focusTeamId={hit?.team.id ?? null}
      />
    </main>
  );
}
