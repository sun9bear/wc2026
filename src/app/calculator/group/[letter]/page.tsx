import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale, BCP47_LOCALE } from "@/i18n";
import { teamName } from "@/lib/football/teams";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";
import { getForecast } from "@/lib/prob/pipeline";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
import { teamSlug } from "@/lib/prob/findTeam";
import { LocalTime } from "@/components/LocalTime";
import { PageContainer } from "@/components/PageContainer";

export const maxDuration = 60;

// 按组 SEO 着陆页：/calculator/group/a … /l —— 承接"Group A who advances /
// X 组出线形势"类脉冲搜索，正文给可索引文字密度（AdSense 审核期内容厚度），
// CTA 导向 /calculator?team=（互动工具）。
const LETTERS = "abcdefghijkl".split("");

const COPY = {
  zh: {
    title: (x: string, teams: string) =>
      teams
        ? `2026 世界杯 ${x} 组积分榜：${teams} — 出线形势`
        : `${x} 组谁能出线？2026 世界杯 ${x} 组积分榜 + 晋级概率`,
    desc: (x: string, teams: string, updated: string) =>
      `2026 世界杯 ${x} 组实时积分榜与出线场景${updated ? `（${updated}更新）` : ""}：${teams || "各队"}谁已出线、谁已出局、还差什么。万次蒙特卡洛模拟，每小时更新。`,
    h1: (x: string) => `${x} 组积分榜与出线形势`,
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
    scenarios: "出线场景",
    vQualified: (n: string) => `${n} 已基本锁定 32 强席位。`,
    vEliminated: (n: string) => `${n} 已基本无缘出线。`,
    vAlive: (n: string, p: string) => `${n} 仍有出线机会——目前出线概率 ${p}。`,
  },
  en: {
    title: (x: string, teams: string) =>
      teams
        ? `World Cup 2026 Group ${x} Standings — ${teams} & Who Advances`
        : `Group ${x}: who advances? — World Cup 2026 standings`,
    desc: (x: string, teams: string, updated: string) =>
      `Live Group ${x} standings and qualification scenarios${updated ? ` (updated ${updated})` : ""} for ${teams || "every team"} at the 2026 World Cup. Who advances, who's eliminated and what each team needs — 10,000 Monte Carlo simulations, refreshed hourly.`,
    h1: (x: string) => `Group ${x} Standings — Who Advances?`,
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
    scenarios: "Qualification scenarios",
    vQualified: (n: string) => `${n} has effectively qualified for the Round of 32.`,
    vEliminated: (n: string) => `${n} can no longer realistically advance.`,
    vAlive: (n: string, p: string) => `${n} can still advance — currently a ${p} chance.`,
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：本页 name() 队名助手 / ItemList JsonLd / "出线规则详解"链接仍是 locale 三元（A4 清剿项），激活前 es/pt/de/fr 先回退英文分支（队名显英文名）。
  es: {
    title: (x: string, teams: string) =>
      teams
        ? `Mundial 2026 Grupo ${x}: clasificación — ${teams} y quién avanza`
        : `Grupo ${x}: ¿quién se clasifica? — Clasificación Mundial 2026`,
    desc: (x: string, teams: string, updated: string) =>
      `Clasificación en vivo y escenarios del Grupo ${x}${updated ? ` (actualizado ${updated})` : ""} para ${teams || "cada selección"} en el Mundial 2026. Quién avanza, quién queda eliminado y qué necesita cada equipo — 10.000 simulaciones de Montecarlo, cada hora.`,
    h1: (x: string) => `Grupo ${x}: clasificación y quién avanza`,
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
    scenarios: "Escenarios de clasificación",
    vQualified: (n: string) => `${n} tiene prácticamente asegurada su plaza en los dieciseisavos.`,
    vEliminated: (n: string) => `${n} ya no tiene opciones realistas de clasificar.`,
    vAlive: (n: string, p: string) => `${n} aún puede clasificar — actualmente un ${p} de probabilidad.`,
  },
  pt: {
    title: (x: string, teams: string) =>
      teams
        ? `Copa 2026 Grupo ${x}: classificação — ${teams} e quem avança`
        : `Grupo ${x}: quem se classifica? — Classificação Copa 2026`,
    desc: (x: string, teams: string, updated: string) =>
      `Classificação ao vivo e cenários do Grupo ${x}${updated ? ` (atualizado ${updated})` : ""} para ${teams || "cada seleção"} na Copa 2026. Quem avança, quem está eliminado e o que cada seleção precisa — 10.000 simulações de Monte Carlo, a cada hora.`,
    h1: (x: string) => `Grupo ${x}: classificação e quem avança`,
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
    scenarios: "Cenários de classificação",
    vQualified: (n: string) => `${n} está praticamente garantida nos 16-avos.`,
    vEliminated: (n: string) => `${n} não tem mais chances realistas de avançar.`,
    vAlive: (n: string, p: string) => `${n} ainda pode avançar — atualmente ${p} de chance.`,
  },
  de: {
    title: (x: string, teams: string) =>
      teams
        ? `WM 2026 Gruppe ${x}: Tabelle — ${teams} & wer weiterkommt`
        : `Gruppe ${x}: Wer kommt weiter? — WM-2026-Tabelle`,
    desc: (x: string, teams: string, updated: string) =>
      `Live-Tabelle und Qualifikationsszenarien der Gruppe ${x}${updated ? ` (aktualisiert ${updated})` : ""} für ${teams || "jedes Team"} bei der WM 2026. Wer weiterkommt, wer ausscheidet und was jedes Team braucht — 10.000 Monte-Carlo-Simulationen, stündlich.`,
    h1: (x: string) => `Gruppe ${x}: Tabelle & wer weiterkommt`,
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
    scenarios: "Qualifikationsszenarien",
    vQualified: (n: string) => `${n} hat das Sechzehntelfinale praktisch sicher.`,
    vEliminated: (n: string) => `${n} kann realistisch nicht mehr weiterkommen.`,
    vAlive: (n: string, p: string) => `${n} kann noch weiterkommen — aktuell ${p} Chance.`,
  },
  fr: {
    title: (x: string, teams: string) =>
      teams
        ? `Mondial 2026 Groupe ${x} : classement — ${teams} et qui se qualifie`
        : `Groupe ${x} : qui se qualifie ? — Classement Mondial 2026`,
    desc: (x: string, teams: string, updated: string) =>
      `Classement en direct et scénarios du Groupe ${x}${updated ? ` (mis à jour ${updated})` : ""} pour ${teams || "chaque sélection"} au Mondial 2026. Qui se qualifie, qui est éliminé et ce qu'il faut à chaque équipe — 10 000 simulations de Monte-Carlo, chaque heure.`,
    h1: (x: string) => `Groupe ${x} : classement et qui se qualifie`,
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
    scenarios: "Scénarios de qualification",
    vQualified: (n: string) => `${n} a quasiment validé sa place en seizièmes.`,
    vEliminated: (n: string) => `${n} n'a plus de chance réaliste de se qualifier.`,
    vAlive: (n: string, p: string) => `${n} peut encore se qualifier — actuellement ${p} de probabilité.`,
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
  const alternates = localizedAlternates(`/calculator/group/${letter}`, locale);
  // A1：把真实队名 + 真实新鲜度（该组最近结算月份）注入标题/描述，精确匹配
  // "<队名> world cup 2026 group X standings…" 长尾查询。getForecast/getSettledIndex
  // 均已缓存（revalidate 900）；任一失败安全回退到无队名分支。
  try {
    const data = await getForecast();
    const group = data.groups.find((g) => g.letter === X);
    if (!group) return { title: c.title(X, ""), description: c.desc(X, "", ""), alternates };
    const nm = (t: { name: string; zh: string }) =>
      locale === "zh" ? t.zh : teamName(t.name, locale);
    const names = group.table.map(nm);
    const top2 = names.slice(0, 2).join(", ");
    const allTeams = names.join(", ");
    const last = await getSettledIndex()
      .then((idx) => idx.byGroup[X] ?? null)
      .catch(() => null);
    const updated = last
      ? (() => {
          const s = new Date(last).toLocaleDateString(BCP47_LOCALE[locale] ?? "en-US", {
            year: "numeric",
            month: "short",
          });
          return s.charAt(0).toUpperCase() + s.slice(1);
        })()
      : "";
    return { title: c.title(X, top2), description: c.desc(X, allTeams, updated), alternates };
  } catch {
    return { title: c.title(X, ""), description: c.desc(X, "", ""), alternates };
  }
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

  // BreadcrumbList：首页 › 出线计算器 › X 组（叠加在 ItemList 之上，独立 JsonLd 渲染）。
  const BC: Record<Locale, { home: string; calc: string; grp: (x: string) => string }> = {
    zh: { home: "首页", calc: "出线计算器", grp: (x) => `${x} 组` },
    en: { home: "Home", calc: "Calculator", grp: (x) => `Group ${x}` },
    es: { home: "Inicio", calc: "Calculadora", grp: (x) => `Grupo ${x}` },
    pt: { home: "Início", calc: "Calculadora", grp: (x) => `Grupo ${x}` },
    de: { home: "Startseite", calc: "Rechner", grp: (x) => `Gruppe ${x}` },
    fr: { home: "Accueil", calc: "Calculateur", grp: (x) => `Groupe ${x}` },
  };
  const bc = BC[locale] ?? BC.en;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: bc.home, item: selfUrl("/", locale) },
      { "@type": "ListItem", position: 2, name: bc.calc, item: selfUrl("/calculator", locale) },
      {
        "@type": "ListItem",
        position: 3,
        name: bc.grp(X),
        item: selfUrl(`/calculator/group/${letter}`, locale),
      },
    ],
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
      <JsonLd data={breadcrumbJsonLd} />
      <div className="flex items-center justify-between">
        <Link href={localeHref(locale, "/calculator")} className="text-xs text-muted">
          {c.back}
        </Link>
      </div>
      <h1 className="font-head mb-1 mt-3 text-2xl md:text-3xl font-bold">🧮 {c.h1(X)}</h1>
      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份；EN-first）。 */}
      {group.table[0] && (
        <p className="mt-1 text-sm md:text-base leading-relaxed">
          {c.lead(X, name(group.table[0]), pct(group.table[0].pAdvance))}
        </p>
      )}
      {lastResult && (
        <p className="mt-1 text-[11px] md:text-xs text-muted">
          {c.latest} · {new Date(lastResult).toLocaleDateString(BCP47_LOCALE[locale] ?? "en-US")}
        </p>
      )}
      <p className="mb-4 mt-2 text-xs md:text-sm text-muted">{c.note}</p>

      <h2 className="font-head mb-2 text-sm md:text-base font-semibold">{c.table}</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] md:text-xs text-muted">
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
                  {/* D3：积分榜队名链到球队着陆页（已索引、进 sitemap），把 48 个 /team 页提到分组枢纽下的深度 2。 */}
                  <Link
                    href={localeHref(locale, `/team/${teamSlug(t.name)}`)}
                    className="inline-flex items-center gap-1.5 hover:text-green"
                  >
                    {t.flag && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.flag} alt="" width={16} height={12} loading="lazy" decoding="async" className="h-3 w-4 rounded-[2px] object-cover" />
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

      {/* A2：服务端可抓取的逐队出线判定 —— 精确命中"can X advance / X 组出线场景"查询，也是 AI 直接引用的答案。 */}
      <h2 className="font-head mb-2 mt-6 text-sm md:text-base font-semibold">{c.scenarios}</h2>
      <ul className="space-y-1.5 text-sm md:text-base leading-relaxed">
        {group.table.map((t) => {
          const adv = t.pAdvance > 1 ? t.pAdvance / 100 : t.pAdvance;
          const line =
            adv >= 0.9995
              ? c.vQualified(name(t))
              : adv <= 0.0005
                ? c.vEliminated(name(t))
                : c.vAlive(name(t), pct(t.pAdvance));
          return (
            <li key={t.id} className="flex items-start gap-2">
              {t.flag && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.flag}
                  alt=""
                  width={16}
                  height={12}
                  loading="lazy"
                  decoding="async"
                  className="mt-1 h-3 w-4 shrink-0 rounded-[2px] object-cover"
                />
              )}
              <span>{line}</span>
            </li>
          );
        })}
      </ul>

      {fixtures.length > 0 && (
        <>
          <h2 className="font-head mb-2 mt-6 text-sm md:text-base font-semibold">{c.fixtures}</h2>
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
            className="block rounded-lg border border-green/40 bg-surface p-3 text-green transition-colors hover:border-green/50"
          >
            {c.cta(name(group.table[2]))}
          </Link>
        )}
        <Link href={localeHref(locale, "/calculator")} className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-green/50">
          {c.tool}
        </Link>
        <Link href={localeHref(locale, "/rules")} className="block rounded-lg border border-border bg-surface-2 p-3 text-muted">
          {RULES_LINK[locale] ?? RULES_LINK.en}
        </Link>
      </div>

    </PageContainer>
  );
}
