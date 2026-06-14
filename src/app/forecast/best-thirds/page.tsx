import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { getForecast, type ForecastData } from "@/lib/prob/pipeline";
import { JsonLd } from "@/lib/seo/jsonLd";
import { getSettledIndex } from "@/lib/seo/freshness";
import { R32, allocateThirds } from "@/lib/prob/bracket";
import { Disclaimer } from "@/components/Disclaimer";
import { localeHref } from "@/i18n";
import { localizedAlternates, selfUrl } from "@/lib/seo/canonical";

export const maxDuration = 60; // 复用 getForecast() 共享缓存（含外部抓取 + 万次模拟）

// 最佳第三名实时着陆页：12 个小组第三名横排（前 8 晋级 32 强）+ FIFA Annex C 的
// C(12,8)=495 行「第三名 → 小组第一」对阵映射。数据源 getForecast().thirds（排名判据与
// src/lib/prob/standings.ts 一致：积分→净胜→进球→评分→随机，跨组不可比、无相互战绩）。
// 规则全文见 /rules；改任意赛果实时重算见 /calculator。前置答案 EN-first（GEO）。

const COPY = {
  zh: {
    title: "2026 世界杯最佳第三名排名：12 组第三谁能出线（前 8 晋级）",
    description:
      "12 个小组第三名实时横排榜——按 2026 官方判据（积分 / 净胜 / 进球）排名，前 8 名晋级 32 强；含 FIFA Annex C 第三名对阵小组第一的映射，赛果落库后自动更新。",
    h1: "最佳第三名排名",
    updated: "更新于",
    intro:
      "12 个小组各有一支第三名球队，其中成绩最好的 8 支晋级 32 强。横排只比积分、净胜球、进球数（跨组不可比，无小组内相互战绩）。",
    rankH: "12 个小组第三名横排（前 8 晋级）",
    rankNote: "按当前真实战绩排名；虚线下方为暂时出局。点队名进对应小组页。",
    advanceLabel: "出线概率",
    mapH: "若当前形势成立：第三名 vs 小组第一对阵",
    mapNote:
      "8 个晋级的小组第三名按 FIFA Annex C 的 495 种组合表分配给 8 个小组第一，确保不与同组第一相遇。",
    ctaH: "想看你的队怎样才能挤进前 8？",
    ctaBody: "用出线计算器改任意未赛赛果，立即看最佳第三名榜如何变化。",
    calc: "🧮 打开第三名出线计算器 →",
    forecast: "📊 全部出线 & 夺冠概率 →",
    rules: "📖 2026 世界杯赛制与出线规则详解 →",
    back: "← 返回",
    method:
      "排名按 2026 官方新规（积分 → 净胜球 → 进球 → 公平竞赛分 → FIFA 排名 → 抽签）；公平竞赛分无红黄牌数据故跳过，FIFA 排名一档以模型实力评分（Elo）近似，最终以随机抽签兜底。出线概率来自万次蒙特卡洛模拟。",
    fun: "全部概率仅供娱乐参考，不构成任何建议。",
    na: "—",
    naMsg: "数据暂不可用，请稍后再试 / Data temporarily unavailable.",
  },
  en: {
    title: "World Cup 2026 best third-placed teams: who advances (top 8)",
    description:
      "Live ranking of the 12 third-placed teams — sorted by the 2026 official tiebreakers (points / goal difference / goals); the top 8 advance to the Round of 32. Includes FIFA's Annex C third-place to group-winner mapping, updated after each result.",
    h1: "Best third-placed teams",
    updated: "Updated",
    intro:
      "Each of the 12 groups has a third-placed team; the 8 best of them advance to the Round of 32. They are compared only on points, goal difference and goals scored (cross-group, with no head-to-head).",
    rankH: "All 12 third-placed teams ranked (top 8 advance)",
    rankNote: "Ranked on actual results so far; below the dashed line = currently out. Tap a team for its group page.",
    advanceLabel: "Chance to advance",
    mapH: "If the current standings hold: third-place Round-of-32 matchups",
    mapNote:
      "The 8 qualifying third-placed teams are assigned to 8 group winners via FIFA's 495-combination Annex C table, so a third never meets the winner of its own group.",
    ctaH: "Want to see how your team can sneak into the top 8?",
    ctaBody: "Flip any remaining result in the scenario calculator and watch the best third-placed race update live.",
    calc: "🧮 Open the third-place scenario calculator →",
    forecast: "📊 All advancement & title probabilities →",
    rules: "📖 2026 World Cup format & qualification rules →",
    back: "← Back",
    method:
      "Ranked by the 2026 official tiebreakers (points → goal difference → goals → fair-play → FIFA ranking → drawing of lots); fair-play card data is unavailable so that step is skipped, and the FIFA-ranking step is approximated by the model strength rating (Elo), with a random draw as the final fallback. Advancement chances come from a 10,000-run Monte Carlo simulation.",
    fun: "All probabilities are for entertainment only.",
    na: "—",
    naMsg: "数据暂不可用，请稍后再试 / Data temporarily unavailable.",
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：本页 GEO 答案段 / ItemList JsonLd / mapH 对阵行（"组第一 vs"）仍是 locale 三元（A4 清剿项），激活前 es/pt/de/fr 先回退英文分支。
  es: {
    title: "Mejores terceros del Mundial 2026: quiénes se clasifican (los 8 primeros)",
    description:
      "Ranking en vivo de los 12 equipos terceros — ordenados por los criterios de desempate oficiales de 2026 (puntos / diferencia de goles / goles); los 8 primeros avanzan a los dieciseisavos. Incluye el mapa del Anexo C de la FIFA que asigna cada tercero a un primero de grupo, actualizado tras cada resultado.",
    h1: "Mejores terceros",
    updated: "Actualizado",
    intro:
      "Cada uno de los 12 grupos tiene un equipo tercero; los 8 mejores avanzan a los dieciseisavos. Se comparan solo por puntos, diferencia de goles y goles marcados (entre grupos, sin enfrentamiento directo).",
    rankH: "Los 12 terceros clasificados (los 8 primeros avanzan)",
    rankNote: "Clasificados según los resultados reales hasta ahora; bajo la línea discontinua = eliminados por ahora. Toca un equipo para ver su grupo.",
    advanceLabel: "Probabilidad de avanzar",
    mapH: "Si la clasificación actual se mantiene: cruces de dieciseisavos de los terceros",
    mapNote:
      "Los 8 terceros clasificados se asignan a 8 primeros de grupo mediante la tabla de 495 combinaciones del Anexo C de la FIFA, de modo que un tercero nunca se enfrenta al primero de su propio grupo.",
    ctaH: "¿Quieres ver cómo tu equipo puede colarse entre los 8 primeros?",
    ctaBody: "Cambia cualquier resultado pendiente en la calculadora de escenarios y observa en vivo la carrera por los mejores terceros.",
    calc: "🧮 Abre la calculadora de escenarios de terceros →",
    forecast: "📊 Todas las probabilidades de clasificación y título →",
    rules: "📖 Formato y reglas de clasificación del Mundial 2026 →",
    back: "← Atrás",
    method:
      "Clasificados según los criterios de desempate oficiales de 2026 (puntos → diferencia de goles → goles → juego limpio → ranking FIFA → sorteo); los datos de tarjetas de juego limpio no están disponibles, por lo que ese paso se omite, y el paso del ranking FIFA se aproxima con la valoración de fuerza del modelo (Elo), con un sorteo aleatorio como último recurso. Las probabilidades de avance provienen de una simulación de Montecarlo de 10.000 corridas.",
    fun: "Todas las probabilidades son solo para entretenimiento.",
    na: "—",
    naMsg: "Datos no disponibles por el momento, inténtalo más tarde.",
  },
  pt: {
    title: "Melhores terceiros da Copa 2026: quem se classifica (os 8 primeiros)",
    description:
      "Ranking ao vivo das 12 seleções em terceiro — ordenadas pelos critérios de desempate oficiais de 2026 (pontos / saldo de gols / gols); os 8 primeiros avançam aos 16-avos. Inclui o mapa do Anexo C da FIFA que liga cada terceiro a um primeiro de grupo, atualizado após cada resultado.",
    h1: "Melhores terceiros",
    updated: "Atualizado",
    intro:
      "Cada um dos 12 grupos tem uma seleção em terceiro; as 8 melhores avançam aos 16-avos. Elas são comparadas apenas por pontos, saldo de gols e gols marcados (entre grupos, sem confronto direto).",
    rankH: "Os 12 terceiros classificados (os 8 primeiros avançam)",
    rankNote: "Classificados pelos resultados reais até agora; abaixo da linha tracejada = fora por enquanto. Toque numa seleção para ver seu grupo.",
    advanceLabel: "Chance de avançar",
    mapH: "Se a classificação atual se mantiver: confrontos dos 16-avos dos terceiros",
    mapNote:
      "As 8 seleções terceiras classificadas são atribuídas a 8 primeiros de grupo pela tabela de 495 combinações do Anexo C da FIFA, de modo que um terceiro nunca enfrenta o primeiro do próprio grupo.",
    ctaH: "Quer ver como sua seleção pode entrar no top 8?",
    ctaBody: "Mude qualquer resultado pendente na calculadora de cenários e acompanhe ao vivo a disputa pelos melhores terceiros.",
    calc: "🧮 Abra a calculadora de cenários dos terceiros →",
    forecast: "📊 Todas as probabilidades de classificação e título →",
    rules: "📖 Formato e regras de classificação da Copa 2026 →",
    back: "← Voltar",
    method:
      "Classificados pelos critérios de desempate oficiais de 2026 (pontos → saldo de gols → gols → fair play → ranking FIFA → sorteio); os dados de cartões de fair play não estão disponíveis, então essa etapa é ignorada, e a etapa do ranking FIFA é aproximada pela avaliação de força do modelo (Elo), com um sorteio aleatório como último recurso. As chances de avanço vêm de uma simulação de Monte Carlo de 10.000 rodadas.",
    fun: "Todas as probabilidades são apenas para entretenimento.",
    na: "—",
    naMsg: "Dados indisponíveis no momento, tente novamente mais tarde.",
  },
  de: {
    title: "Beste Gruppendritte der WM 2026: Wer kommt weiter (Top 8)",
    description:
      "Live-Rangliste der 12 Gruppendritten — sortiert nach den offiziellen Tiebreakern 2026 (Punkte / Tordifferenz / Tore); die besten 8 kommen ins Sechzehntelfinale. Inklusive der Anhang-C-Zuordnung der FIFA von Gruppendritten zu Gruppensiegern, nach jedem Ergebnis aktualisiert.",
    h1: "Beste Gruppendritte",
    updated: "Aktualisiert",
    intro:
      "Jede der 12 Gruppen hat einen Gruppendritten; die 8 besten kommen ins Sechzehntelfinale. Sie werden nur nach Punkten, Tordifferenz und erzielten Toren verglichen (gruppenübergreifend, ohne direkten Vergleich).",
    rankH: "Alle 12 Gruppendritten im Ranking (Top 8 kommen weiter)",
    rankNote: "Nach den bisherigen tatsächlichen Ergebnissen gereiht; unter der gestrichelten Linie = derzeit ausgeschieden. Tippe auf ein Team für seine Gruppenseite.",
    advanceLabel: "Weiterkommen-Chance",
    mapH: "Wenn die aktuelle Tabelle hält: Sechzehntelfinal-Duelle der Gruppendritten",
    mapNote:
      "Die 8 qualifizierten Gruppendritten werden über die 495-Kombinationen-Tabelle aus Anhang C der FIFA 8 Gruppensiegern zugeordnet, sodass ein Dritter nie auf den Sieger der eigenen Gruppe trifft.",
    ctaH: "Willst du sehen, wie es dein Team in die Top 8 schaffen kann?",
    ctaBody: "Ändere ein beliebiges offenes Ergebnis im Szenario-Rechner und verfolge live das Rennen um die besten Gruppendritten.",
    calc: "🧮 Den Szenario-Rechner für Gruppendritte öffnen →",
    forecast: "📊 Alle Weiterkommen- & Titel-Wahrscheinlichkeiten →",
    rules: "📖 Format & Qualifikationsregeln der WM 2026 →",
    back: "← Zurück",
    method:
      "Gereiht nach den offiziellen Tiebreakern 2026 (Punkte → Tordifferenz → Tore → Fair Play → FIFA-Rangliste → Losentscheid); Fair-Play-Kartendaten liegen nicht vor, daher entfällt dieser Schritt, und der FIFA-Ranglisten-Schritt wird durch den Modell-Stärkewert (Elo) angenähert, mit einem zufälligen Losentscheid als letzter Instanz. Die Weiterkommen-Chancen stammen aus einer Monte-Carlo-Simulation mit 10.000 Läufen.",
    fun: "Alle Wahrscheinlichkeiten dienen nur der Unterhaltung.",
    na: "—",
    naMsg: "Daten derzeit nicht verfügbar, bitte später erneut versuchen.",
  },
  fr: {
    title: "Meilleurs troisièmes du Mondial 2026 : qui se qualifie (les 8 premiers)",
    description:
      "Classement en direct des 12 équipes troisièmes — triées selon les départages officiels 2026 (points / différence de buts / buts) ; les 8 premières se qualifient pour les seizièmes. Inclut la table de l'Annexe C de la FIFA reliant chaque troisième à un premier de groupe, mise à jour après chaque résultat.",
    h1: "Meilleurs troisièmes",
    updated: "Mis à jour",
    intro:
      "Chacun des 12 groupes a une équipe troisième ; les 8 meilleures se qualifient pour les seizièmes. Elles sont comparées uniquement aux points, à la différence de buts et aux buts marqués (entre groupes, sans confrontation directe).",
    rankH: "Les 12 troisièmes classés (les 8 premiers se qualifient)",
    rankNote: "Classés selon les résultats réels à ce jour ; sous la ligne pointillée = actuellement éliminés. Touche une équipe pour voir son groupe.",
    advanceLabel: "Probabilité de qualification",
    mapH: "Si le classement actuel se maintient : affiches des seizièmes des troisièmes",
    mapNote:
      "Les 8 troisièmes qualifiés sont attribués à 8 premiers de groupe via la table de 495 combinaisons de l'Annexe C de la FIFA, afin qu'un troisième ne rencontre jamais le premier de son propre groupe.",
    ctaH: "Tu veux voir comment ton équipe peut se glisser dans le top 8 ?",
    ctaBody: "Modifie n'importe quel résultat à venir dans le calculateur de scénarios et suis en direct la course aux meilleurs troisièmes.",
    calc: "🧮 Ouvre le calculateur de scénarios des troisièmes →",
    forecast: "📊 Toutes les probabilités de qualification et de titre →",
    rules: "📖 Format et règles de qualification du Mondial 2026 →",
    back: "← Retour",
    method:
      "Classés selon les départages officiels 2026 (points → différence de buts → buts → fair-play → classement FIFA → tirage au sort) ; les données de cartons fair-play sont indisponibles, cette étape est donc ignorée, et l'étape du classement FIFA est approximée par la note de force du modèle (Elo), avec un tirage au sort aléatoire en dernier recours. Les probabilités de qualification proviennent d'une simulation de Monte-Carlo de 10 000 tirages.",
    fun: "Toutes les probabilités sont fournies à titre de divertissement uniquement.",
    na: "—",
    naMsg: "Données indisponibles pour le moment, réessaie plus tard.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: COPY[locale].title,
    description: COPY[locale].description,
    alternates: localizedAlternates("/forecast/best-thirds", locale),
  };
}

function pct(p: number, digits = 0): string {
  return (p * 100).toFixed(digits) + "%";
}

function TeamName({
  t,
  zhFirst,
}: {
  t: { name: string; zh: string; flag: string | null };
  zhFirst: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {t.flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
      )}
      {zhFirst ? t.zh : t.name}
    </span>
  );
}

export default async function BestThirdsPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const zhFirst = locale === "zh";
  let data: ForecastData | null = null;
  try {
    data = await getForecast();
  } catch {
    data = null;
  }

  if (!data || data.thirds.length === 0) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <h1 className="font-head text-2xl font-bold">🥉 {c.h1}</h1>
        <p className="mt-4 text-sm text-muted">{c.naMsg}</p>
      </main>
    );
  }

  const thirds = data.thirds;
  const idx = await getSettledIndex().catch(() => null);

  // 每队 Monte-Carlo 出线概率（仅 simOk 时有意义）：按 teamId 关联到小组表。
  const pAdvanceById = new Map<string, number>(
    data.groups.flatMap((g) => g.table).map((t) => [t.id, t.pAdvance] as const)
  );

  // 若当前前 8 第三名成立 → Annex C 槽位指派（slot 组第一 ↔ 第三名来源组）。
  // allocateThirds 需正好 8 个去重组字母；任何 8/12 组合都在 495 行表内。出错则不渲染该块。
  const qualifiedLetters = thirds.filter((t) => t.rank <= 8).map((t) => t.letter);
  let thirdFixtures: { match: number; winner: string; source: string }[] = [];
  try {
    if (qualifiedLetters.length === 8 && new Set(qualifiedLetters).size === 8) {
      const alloc = allocateThirds(qualifiedLetters); // slot -> source group
      thirdFixtures = R32.filter((f) => f.away.kind === "third")
        .map((f) => {
          const slot = f.away.kind === "third" ? f.away.slot : "";
          const winner = f.home.kind === "winner" ? f.home.group : slot;
          return { match: f.match, winner, source: alloc[slot] };
        })
        .filter((x) => Boolean(x.source))
        .sort((a, b) => a.match - b.match);
    }
  } catch {
    thirdFixtures = [];
  }

  // ItemList 结构化数据（排名实体；只填真字段，dateModified 用真实 settled_at）。
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: c.title,
    description: c.description,
    url: selfUrl("/forecast/best-thirds", locale),
    numberOfItems: thirds.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    ...(idx?.all ? { dateModified: idx.all } : {}),
    itemListElement: thirds.map((t) => ({
      "@type": "ListItem",
      position: t.rank,
      name: zhFirst ? t.zh : t.name,
    })),
  };

  const leader = thirds[0];
  const leaderName = zhFirst ? leader.zh : leader.name;
  const cut = thirds.find((t) => t.rank === 8);
  const cutName = cut ? (zhFirst ? cut.zh : cut.name) : c.na;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <JsonLd data={itemListJsonLd} />
      <Link href={localeHref(locale, "/forecast")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">🥉 {c.h1}</h1>
      {idx?.all && (
        <p className="mt-1 text-[11px] text-muted">
          {c.updated} {new Date(idx.all).toLocaleString(zhFirst ? "zh-CN" : "en-US")}
        </p>
      )}

      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份信号；EN-first，爬虫见英文）。 */}
      {cut && (
        <p className="mt-3 rounded-lg border border-green/30 bg-surface p-4 text-sm leading-relaxed">
          {zhFirst
            ? `2026 世界杯最佳第三名排名：${leaderName} 目前以 ${leader.pts} 分领跑 12 个小组第三名；成绩最好的 8 支晋级 32 强，当前出线分数线为 ${cut.pts} 分（${cutName}）。`
            : `At the 2026 World Cup, ${leaderName} currently leads the 12 third-placed teams with ${leader.pts} points; the best 8 advance to the Round of 32, with the cut-off at ${cut.pts} points (${cutName}).`}
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-text/90">{c.intro}</p>

      <section className="mt-6">
        <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.rankH}</h2>
        <p className="mb-2 text-[10px] text-muted">{c.rankNote}</p>
        <div className="rounded-lg border border-border bg-surface p-3">
          {thirds.map((t) => {
            const pa = pAdvanceById.get(t.id);
            return (
              <Link
                key={t.id}
                href={localeHref(locale, `/calculator/group/${t.letter.toLowerCase()}`)}
                className={`flex items-center justify-between py-1 text-sm transition hover:text-green ${
                  t.rank === 8 ? "border-b border-dashed border-green/60 pb-2" : ""
                } ${t.rank > 8 ? "opacity-50" : ""}`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="font-head w-5 text-right text-xs text-muted">{t.rank}</span>
                  <TeamName t={t} zhFirst={zhFirst} />
                  <span className="text-[10px] text-muted">{t.letter}</span>
                </span>
                <span className="text-[11px] text-muted">
                  {t.pts}pts · GD{t.gd >= 0 ? "+" : ""}
                  {t.gd}
                  {data.simOk && typeof pa === "number" && (
                    <span className="font-head ml-2 text-green">{pct(pa)}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {thirdFixtures.length > 0 && (
        <section className="mt-7">
          <h2 className="font-head mb-2 text-sm font-semibold text-green">{c.mapH}</h2>
          <p className="mb-2 text-[10px] text-muted">{c.mapNote}</p>
          <div className="space-y-1 rounded-lg border border-border bg-surface p-3 text-sm">
            {thirdFixtures.map((f) => (
              <div key={f.match} className="flex items-center justify-between py-0.5">
                <span>
                  {zhFirst
                    ? `${f.winner} 组第一 vs `
                    : `Winner Group ${f.winner} vs `}
                  <Link
                    href={localeHref(locale, `/calculator/group/${f.source.toLowerCase()}`)}
                    className="text-green transition hover:underline"
                  >
                    {zhFirst ? `${f.source} 组第三` : `3rd of Group ${f.source}`}
                  </Link>
                </span>
                <span className="font-head text-[10px] text-muted">M{f.match}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-head mb-1 text-sm font-semibold">{c.ctaH}</h2>
        <p className="text-sm leading-relaxed text-text/90">{c.ctaBody}</p>
        <div className="mt-3 space-y-2">
          <Link
            href={localeHref(locale, "/calculator")}
            className="block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
          >
            {c.calc}
          </Link>
          <Link
            href={localeHref(locale, "/forecast")}
            className="block rounded-md border border-border px-3 py-2 text-sm text-text/90"
          >
            {c.forecast}
          </Link>
          <Link
            href={localeHref(locale, "/rules")}
            className="block rounded-md border border-border px-3 py-2 text-sm text-text/90"
          >
            {c.rules}
          </Link>
        </div>
      </section>

      <footer className="mt-8 space-y-2 text-center text-[10px] leading-relaxed text-muted">
        <p>{c.method}</p>
        <p>{c.fun}</p>
        <Disclaimer />
      </footer>
    </main>
  );
}
