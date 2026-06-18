import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale, BCP47_LOCALE } from "@/i18n";
import { teamName } from "@/lib/football/teams";
import { localizedAlternates } from "@/lib/seo/canonical";
import { getForecast } from "@/lib/prob/pipeline";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
import { teamSlug } from "@/lib/prob/findTeam";
import { LocalTime } from "@/components/LocalTime";
import { Disclaimer } from "@/components/Disclaimer";
import { PageContainer } from "@/components/PageContainer";

export const maxDuration = 60;

// 按组 SEO 着陆页：/calculator/group/a … /l —— 承接"Group A who advances /
// X 组出线形势"类脉冲搜索，正文给可索引文字密度（AdSense 审核期内容厚度），
// CTA 导向 /calculator?team=（互动工具）。
const LETTERS = "abcdefghijkl".split("");

const COPY = {
  zh: {
    title: (x: string) => `${x} 组谁能出线？2026 世界杯 ${x} 组积分榜 + 晋级概率`,
    desc: (x: string) =>
      `${x} 组实时积分榜、各队出线概率（万次蒙特卡洛模拟）与剩余赛程。用出线计算器改任意赛果，立即看 ${x} 组与最佳第三名榜变化。`,
    h1: (x: string) => `${x} 组出线形势`,
    table: "实时积分榜",
    cols: ["排名", "球队", "赛", "积分", "净胜", "出线概率"],
    fixtures: "剩余赛程",
    cta: (zh: string) => `${zh}怎样才能出线？去算 →`,
    tool: "🧮 打开出线计算器（改任意赛果实时重算）",
    note: "出线概率来自万次蒙特卡洛模拟（公开预测数据 + Elo 融合），每小时更新。",
    latest: "最新赛果",
    lead: (x: string, leader: string, p: string) =>
      `2026 世界杯 ${x} 组：${leader} 以 ${p} 出线概率领跑；改动下方任意未赛赛果，即可看 ${x} 组与最佳第三名形势如何变化。`,
    back: "← 返回",
  },
  en: {
    title: (x: string) => `Group ${x}: who advances? — World Cup 2026 standings`,
    desc: (x: string) =>
      `Live Group ${x} table, every team's chance to advance (10,000 Monte Carlo simulations) and remaining fixtures. Flip any result in the scenario calculator and watch the best-thirds race update.`,
    h1: (x: string) => `Group ${x} — who advances?`,
    table: "Live standings",
    cols: ["#", "Team", "P", "Pts", "GD", "Advance"],
    fixtures: "Remaining fixtures",
    cta: (name: string) => `Can ${name} still advance? Find out →`,
    tool: "🧮 Open the scenario calculator (flip any result, live recompute)",
    note: "Advance chances come from 10,000 Monte Carlo simulations (public forecasting data + Elo blend), refreshed hourly.",
    latest: "Latest result",
    lead: (x: string, leader: string, p: string) =>
      `As of the 2026 World Cup, ${leader} leads Group ${x} with a ${p} chance to advance to the Round of 32; flip any remaining result below to see how the group and best-third race change.`,
    back: "← Back",
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：本页 name() 队名助手 / ItemList JsonLd / "出线规则详解"链接仍是 locale 三元（A4 清剿项），激活前 es/pt/de/fr 先回退英文分支（队名显英文名）。
  es: {
    title: (x: string) => `Grupo ${x}: ¿quién se clasifica? — Clasificación Mundial 2026`,
    desc: (x: string) =>
      `Tabla en vivo del Grupo ${x}, la probabilidad de cada selección de avanzar (10.000 simulaciones de Montecarlo) y los partidos restantes. Cambia cualquier resultado en la calculadora de escenarios y observa cómo cambia la carrera por los mejores terceros.`,
    h1: (x: string) => `Grupo ${x} — ¿quién se clasifica?`,
    table: "Clasificación en vivo",
    cols: ["#", "Equipo", "PJ", "Pts", "DG", "Avance"],
    fixtures: "Partidos restantes",
    cta: (name: string) => `¿Puede ${name} todavía clasificar? Descúbrelo →`,
    tool: "🧮 Abre la calculadora de escenarios (cambia cualquier resultado, recálculo en vivo)",
    note: "Las probabilidades de avance provienen de 10.000 simulaciones de Montecarlo (datos públicos de predicción + mezcla Elo), actualizadas cada hora.",
    latest: "Último resultado",
    lead: (x: string, leader: string, p: string) =>
      `Mundial 2026, Grupo ${x}: ${leader} encabeza con un ${p} de probabilidad de avanzar a los dieciseisavos; cambia cualquier resultado pendiente abajo para ver cómo cambia el grupo y la carrera por los mejores terceros.`,
    back: "← Atrás",
  },
  pt: {
    title: (x: string) => `Grupo ${x}: quem se classifica? — Classificação Copa 2026`,
    desc: (x: string) =>
      `Tabela ao vivo do Grupo ${x}, a chance de cada seleção avançar (10.000 simulações de Monte Carlo) e os jogos restantes. Mude qualquer resultado na calculadora de cenários e veja como muda a disputa pelos melhores terceiros.`,
    h1: (x: string) => `Grupo ${x} — quem se classifica?`,
    table: "Classificação ao vivo",
    cols: ["#", "Seleção", "J", "Pts", "SG", "Avanço"],
    fixtures: "Jogos restantes",
    cta: (name: string) => `${name} ainda pode se classificar? Descubra →`,
    tool: "🧮 Abra a calculadora de cenários (mude qualquer resultado, recálculo ao vivo)",
    note: "As chances de avanço vêm de 10.000 simulações de Monte Carlo (dados públicos de previsão + mistura Elo), atualizadas a cada hora.",
    latest: "Último resultado",
    lead: (x: string, leader: string, p: string) =>
      `Copa 2026, Grupo ${x}: ${leader} lidera com ${p} de chance de avançar aos 16-avos; mude qualquer resultado pendente abaixo para ver como muda o grupo e a disputa pelos melhores terceiros.`,
    back: "← Voltar",
  },
  de: {
    title: (x: string) => `Gruppe ${x}: Wer kommt weiter? — WM-2026-Tabelle`,
    desc: (x: string) =>
      `Live-Tabelle der Gruppe ${x}, die Chance jeder Mannschaft auf das Weiterkommen (10.000 Monte-Carlo-Simulationen) und die ausstehenden Spiele. Ändere ein beliebiges Ergebnis im Szenario-Rechner und beobachte, wie sich das Rennen um die besten Gruppendritten verändert.`,
    h1: (x: string) => `Gruppe ${x} — wer kommt weiter?`,
    table: "Live-Tabelle",
    cols: ["#", "Team", "Sp", "Pkt", "TD", "Chance"],
    fixtures: "Ausstehende Spiele",
    cta: (name: string) => `Kann ${name} noch weiterkommen? Finde es heraus →`,
    tool: "🧮 Szenario-Rechner öffnen (beliebiges Ergebnis ändern, Live-Neuberechnung)",
    note: "Die Weiterkommen-Chancen stammen aus 10.000 Monte-Carlo-Simulationen (öffentliche Prognosedaten + Elo-Mix), stündlich aktualisiert.",
    latest: "Letztes Ergebnis",
    lead: (x: string, leader: string, p: string) =>
      `WM 2026, Gruppe ${x}: ${leader} führt mit ${p} Chance auf das Weiterkommen ins Sechzehntelfinale; ändere unten ein beliebiges offenes Ergebnis, um zu sehen, wie sich die Gruppe und das Rennen um die besten Dritten verändern.`,
    back: "← Zurück",
  },
  fr: {
    title: (x: string) => `Groupe ${x} : qui se qualifie ? — Classement Mondial 2026`,
    desc: (x: string) =>
      `Classement en direct du Groupe ${x}, la probabilité de chaque sélection de se qualifier (10 000 simulations de Monte-Carlo) et les matchs restants. Modifie n'importe quel résultat dans le calculateur de scénarios et observe l'évolution de la course aux meilleurs troisièmes.`,
    h1: (x: string) => `Groupe ${x} — qui se qualifie ?`,
    table: "Classement en direct",
    cols: ["#", "Équipe", "J", "Pts", "Diff", "Qualif."],
    fixtures: "Matchs restants",
    cta: (name: string) => `${name} peut-il encore se qualifier ? Découvre-le →`,
    tool: "🧮 Ouvre le calculateur de scénarios (modifie n'importe quel résultat, recalcul en direct)",
    note: "Les probabilités de qualification proviennent de 10 000 simulations de Monte-Carlo (données publiques de prévision + mélange Elo), actualisées chaque heure.",
    latest: "Dernier résultat",
    lead: (x: string, leader: string, p: string) =>
      `Mondial 2026, Groupe ${x} : ${leader} est en tête avec ${p} de probabilité de se qualifier pour les seizièmes ; modifie n'importe quel résultat à venir ci-dessous pour voir comment évoluent le groupe et la course aux meilleurs troisièmes.`,
    back: "← Retour",
  },
} as const;

export function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ letter: string }>;
}): Promise<Metadata> {
  const { letter } = await params;
  const X = letter.toUpperCase();
  if (!LETTERS.includes(letter)) return {};
  const locale = await getLocale();
  const c = COPY[locale];
  return {
    title: c.title(X),
    description: c.desc(X),
    alternates: localizedAlternates(`/calculator/group/${letter}`, locale),
  };
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  if (!LETTERS.includes(letter)) notFound();
  const X = letter.toUpperCase();
  const locale = await getLocale();
  const c = COPY[locale];
  const data = await getForecast();

  const group = data.groups.find((g) => g.letter === X);
  if (!group) notFound();
  const idx = await getSettledIndex().catch(() => null);
  const lastResult = idx?.byGroup[X] ?? null; // 真实 settled_at（该组最近一场结算），非伪新鲜
  const ids = new Set(group.table.map((t) => t.id));
  const fixtures = data.matches.filter((m) => ids.has(m.homeId) && ids.has(m.awayId));
  const name = (t: { name: string; zh: string }) =>
    locale === "zh" ? t.zh : teamName(t.name, locale);
  const pct = (x: number) => `${((x > 1 ? x : x * 100)).toFixed(0)}%`;

  // ItemList 实体：该组出线概率排名（只填真实字段）。
  const JSONLD_NAME: Record<Locale, string> = {
    zh: `2026 世界杯 ${X} 组出线形势`,
    en: `World Cup 2026 Group ${X} — chance to advance`,
    es: `Mundial 2026 Grupo ${X} — probabilidad de avanzar`,
    pt: `Copa 2026 Grupo ${X} — chance de avançar`,
    de: `WM 2026 Gruppe ${X} — Chance aufs Weiterkommen`,
    fr: `Mondial 2026 Groupe ${X} — probabilité de se qualifier`,
  };
  const advDesc: Record<Locale, (p: string) => string> = {
    zh: (p) => `出线概率 ${p}`,
    en: (p) => `${p} chance to advance`,
    es: (p) => `${p} de probabilidad de avanzar`,
    pt: (p) => `${p} de chance de avançar`,
    de: (p) => `${p} Chance aufs Weiterkommen`,
    fr: (p) => `${p} de probabilité de se qualifier`,
  };
  const groupJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: JSONLD_NAME[locale] ?? JSONLD_NAME.en,
    itemListElement: group.table.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: name(t),
      description: (advDesc[locale] ?? advDesc.en)(pct(t.pAdvance)),
    })),
  };

  const RULES_LINK: Record<Locale, string> = {
    zh: "📖 出线规则详解（第三名怎么算）",
    en: "📖 How qualification works (third-place rules)",
    es: "📖 Cómo funciona la clasificación (reglas del tercer puesto)",
    pt: "📖 Como funciona a classificação (regras do terceiro lugar)",
    de: "📖 So funktioniert die Qualifikation (Regeln für Gruppendritte)",
    fr: "📖 Comment fonctionne la qualification (règles du troisième)",
  };

  return (
    <PageContainer tier="wide">
      <JsonLd data={groupJsonLd} />
      <div className="flex items-center justify-between">
        <Link href={localeHref(locale, "/calculator")} className="text-xs text-muted">
          {c.back}
        </Link>
      </div>
      <h1 className="font-head mb-1 mt-3 text-2xl font-bold">🧮 {c.h1(X)}</h1>
      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份；EN-first）。 */}
      {group.table[0] && (
        <p className="mt-1 text-sm leading-relaxed">
          {c.lead(X, name(group.table[0]), pct(group.table[0].pAdvance))}
        </p>
      )}
      {lastResult && (
        <p className="mt-1 text-[11px] text-muted">
          {c.latest} · {new Date(lastResult).toLocaleDateString(BCP47_LOCALE[locale] ?? "en-US")}
        </p>
      )}
      <p className="mb-4 mt-2 text-xs text-muted">{c.note}</p>

      <h2 className="font-head mb-2 text-sm font-semibold">{c.table}</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] text-muted">
              {c.cols.map((col) => (
                <th key={col} className="px-2 py-2 text-left font-normal">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.table.map((t, i) => (
              <tr key={t.id} className={i < 2 ? "text-text" : "text-muted"}>
                <td className="px-2 py-2 font-head">{i + 1}</td>
                <td className="px-2 py-2">
                  <Link
                    href={localeHref(locale, `/calculator?team=${teamSlug(t.name)}`)}
                    className="inline-flex items-center gap-1.5 hover:text-green"
                  >
                    {t.flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
                    )}
                    {name(t)}
                  </Link>
                </td>
                <td className="px-2 py-2 font-head">{t.played}</td>
                <td className="px-2 py-2 font-head">{t.pts}</td>
                <td className="px-2 py-2 font-head">{t.gd > 0 ? `+${t.gd}` : t.gd}</td>
                <td className="px-2 py-2 font-head text-green">{pct(t.pAdvance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fixtures.length > 0 && (
        <>
          <h2 className="font-head mb-2 mt-6 text-sm font-semibold">{c.fixtures}</h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 text-sm">
            {fixtures.map((m) => (
              <li key={m.id}>
                <Link
                  href={localeHref(locale, `/match/${m.id}`)}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 transition hover:border-green/50"
                >
                  <span>
                    {name(m.home)} vs {name(m.away)}
                  </span>
                  <span className="text-xs text-muted">
                    <LocalTime iso={m.kickoff} locale={locale} mode="datetime" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 space-y-2 text-sm">
        {group.table[2] && (
          <Link
            href={localeHref(locale, `/calculator?team=${teamSlug(group.table[2].name)}`)}
            className="block rounded-lg border border-green/40 bg-surface p-3 text-green"
          >
            {c.cta(name(group.table[2]))}
          </Link>
        )}
        <Link href={localeHref(locale, "/calculator")} className="block rounded-lg border border-border bg-surface p-3">
          {c.tool}
        </Link>
        <Link href={localeHref(locale, "/rules")} className="block rounded-lg border border-border bg-surface-2 p-3 text-muted">
          {RULES_LINK[locale] ?? RULES_LINK.en}
        </Link>
      </div>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </PageContainer>
  );
}
