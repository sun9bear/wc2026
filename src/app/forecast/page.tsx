import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/PageContainer";
import { LocalTime } from "@/components/LocalTime";
import { getLocale } from "@/i18n/server";
import { getForecast, type ForecastData } from "@/lib/prob/pipeline";
import { getTeamAdvanceTrends } from "@/lib/prob/getTrends";
import { Sparkline } from "@/components/Sparkline";
import { TrackedLink } from "@/components/TrackedLink";
import { JsonLd } from "@/lib/seo/jsonLd";
import { getSettledIndex } from "@/lib/seo/freshness";
import { localeHref, type Locale } from "@/i18n";
import { teamName, groupName } from "@/lib/football/teams";
import { localizedAlternates, selfUrl, SITE_ORIGIN } from "@/lib/seo/canonical";

export const maxDuration = 60; // 首次计算含外部抓取+万次模拟

const COPY = {
  zh: {
    title: "2026 世界杯出线概率 · 夺冠概率（实时模型）",
    description:
      "基于实力评分与公开预测数据的万次模拟：每队出线概率、夺冠概率、最佳第三名形势与每场胜平负概率，赛后自动更新。",
    h1: "出线 & 夺冠概率",
    updated: "更新于",
    champions: "🏆 夺冠概率 Top 12",
    groups: "小组出线概率",
    thirds: "最佳第三名形势（前 8 晋级）",
    thirdsNote: "按当前真实战绩排名；线下为暂时出局",
    matches: "近期比赛胜平负概率",
    draw: "平局",
    calculatorCta: "🧮 自己动手算：第三名出线计算器 →",
    method:
      "方法：多源公开数据（队伍实力评分、公开预测数据共识）融合 + 泊松比分模型 + 10,000 次蒙特卡洛模拟；排名判据按 2026 官方新规（相互战绩优先），不含公平竞赛分（无红黄牌数据，以实力评分近似末位判据）。",
    fun: "全部概率仅供娱乐参考，不构成任何建议。",
    aiTag: "AI 短评 · 仅供娱乐",
    swing: "📈 出线概率异动",
    swingSub: "近期模型出线概率变化最大的球队",
    swingEmpty: "概率快照追踪中，攒够 2–3 天数据后显示走势。",
    predict: "预测 →",
    likely: "最可能比分",
    thirdsMore: "查看最佳第三名完整排名与 32 强对阵 →",
  },
  en: {
    title: "World Cup 2026 Advancement & Title Probabilities (Live Model)",
    description:
      "10,000-run simulation from team strength ratings and public forecasting data: every team's chance to advance, win the title, third-place picture and per-match win probabilities.",
    h1: "Advancement & Title Probabilities",
    updated: "Updated",
    champions: "🏆 Title chances — Top 12",
    groups: "Chance to advance by group",
    thirds: "Best third-placed race (top 8 advance)",
    thirdsNote: "Ranked on actual results so far; below the line = currently out",
    matches: "Upcoming match win probabilities",
    draw: "Draw",
    calculatorCta: "🧮 Try it yourself: third-place scenario calculator →",
    method:
      "Method: fusion of public data (team strength ratings, public forecast consensus) + Poisson score model + 10,000 Monte Carlo runs; 2026 official tiebreakers (head-to-head first), fair-play points approximated by strength rating.",
    fun: "All probabilities are for entertainment only.",
    aiTag: "AI note · for fun only",
    swing: "📈 Biggest advancement swings",
    swingSub: "Teams whose chance to advance moved most recently",
    swingEmpty: "Tracking snapshots — trends appear once 2–3 days of data build up.",
    predict: "Predict →",
    likely: "Likely scores",
    thirdsMore: "Full best third-placed ranking & Round-of-32 matchups →",
  },
  // P2-2 staged：es/pt/de/fr 暂不被渲染（locale 仍 zh|en），激活加宽 Locale 后 COPY[locale] 自动启用。
  // 注：本页 GEO 答案段 / variableMeasured / note 仍有 locale 三元（A4 清剿项），激活前 es/pt/de/fr 先回退英文分支。
  es: {
    title: "Probabilidades de clasificación y título · Mundial 2026 (modelo en vivo)",
    description:
      "Simulación de 10.000 corridas basada en valoraciones de fuerza de los equipos y datos públicos de predicción: la probabilidad de cada selección de avanzar, ganar el título, el panorama de los mejores terceros y las probabilidades de victoria por partido.",
    h1: "Probabilidades de clasificación y título",
    updated: "Actualizado",
    champions: "🏆 Probabilidad de título — Top 12",
    groups: "Probabilidad de avanzar por grupo",
    thirds: "Carrera por los mejores terceros (avanzan los 8 primeros)",
    thirdsNote: "Clasificados según los resultados reales hasta ahora; bajo la línea = eliminados por ahora",
    matches: "Probabilidades de victoria en los próximos partidos",
    draw: "Empate",
    calculatorCta: "🧮 Pruébalo tú mismo: calculadora de escenarios de terceros →",
    method:
      "Método: fusión de datos públicos (valoraciones de fuerza de los equipos, consenso de predicciones públicas) + modelo de marcador de Poisson + 10.000 simulaciones de Montecarlo; criterios de desempate oficiales de 2026 (enfrentamiento directo primero), puntos de juego limpio aproximados por la valoración de fuerza.",
    fun: "Todas las probabilidades son solo para entretenimiento.",
    aiTag: "Nota IA · solo por diversión",
    swing: "📈 Mayores cambios en la clasificación",
    swingSub: "Equipos cuya probabilidad de avanzar más se movió recientemente",
    swingEmpty: "Registrando datos — las tendencias aparecen cuando se acumulan 2–3 días de datos.",
    predict: "Predecir →",
    likely: "Marcadores probables",
    thirdsMore: "Clasificación completa de mejores terceros y cruces de dieciseisavos →",
  },
  pt: {
    title: "Probabilidades de classificação e título · Copa 2026 (modelo ao vivo)",
    description:
      "Simulação de 10.000 rodadas a partir das avaliações de força das seleções e dados públicos de previsão: a chance de cada seleção avançar, ganhar o título, o panorama dos melhores terceiros e as probabilidades de vitória por jogo.",
    h1: "Probabilidades de classificação e título",
    updated: "Atualizado",
    champions: "🏆 Chances de título — Top 12",
    groups: "Chance de avançar por grupo",
    thirds: "Disputa pelos melhores terceiros (os 8 primeiros avançam)",
    thirdsNote: "Classificados pelos resultados reais até agora; abaixo da linha = fora por enquanto",
    matches: "Probabilidades de vitória nos próximos jogos",
    draw: "Empate",
    calculatorCta: "🧮 Faça você mesmo: calculadora de cenários dos terceiros →",
    method:
      "Método: fusão de dados públicos (avaliações de força das seleções, consenso de previsões públicas) + modelo de placar de Poisson + 10.000 simulações de Monte Carlo; critérios de desempate oficiais de 2026 (confronto direto primeiro), pontos de fair play aproximados pela avaliação de força.",
    fun: "Todas as probabilidades são apenas para entretenimento.",
    aiTag: "Nota de IA · só por diversão",
    swing: "📈 Maiores variações na classificação",
    swingSub: "Seleções cuja chance de avançar mais mudou recentemente",
    swingEmpty: "Registrando dados — as tendências aparecem quando se acumulam 2–3 dias de dados.",
    predict: "Prever →",
    likely: "Placares prováveis",
    thirdsMore: "Classificação completa dos melhores terceiros e confrontos dos 16-avos →",
  },
  de: {
    title: "Weiterkommen- & Titel-Wahrscheinlichkeiten · WM 2026 (Live-Modell)",
    description:
      "Simulation mit 10.000 Läufen auf Basis von Team-Stärkewerten und öffentlichen Prognosedaten: die Chance jeder Mannschaft auf das Weiterkommen, den Titelgewinn, das Bild der Gruppendritten und die Siegwahrscheinlichkeiten pro Spiel.",
    h1: "Weiterkommen- & Titel-Wahrscheinlichkeiten",
    updated: "Aktualisiert",
    champions: "🏆 Titelchancen — Top 12",
    groups: "Weiterkommen-Chance nach Gruppe",
    thirds: "Rennen um die besten Gruppendritten (Top 8 kommen weiter)",
    thirdsNote: "Nach den bisherigen tatsächlichen Ergebnissen gereiht; unter der Linie = derzeit ausgeschieden",
    matches: "Siegwahrscheinlichkeiten der nächsten Spiele",
    draw: "Unentschieden",
    calculatorCta: "🧮 Selbst ausprobieren: Szenario-Rechner für Gruppendritte →",
    method:
      "Methode: Fusion öffentlicher Daten (Team-Stärkewerte, Konsens öffentlicher Prognosen) + Poisson-Ergebnismodell + 10.000 Monte-Carlo-Läufe; offizielle Tiebreaker 2026 (direkter Vergleich zuerst), Fair-Play-Punkte durch den Stärkewert angenähert.",
    fun: "Alle Wahrscheinlichkeiten dienen nur der Unterhaltung.",
    aiTag: "KI-Notiz · nur zum Spaß",
    swing: "📈 Größte Bewegungen beim Weiterkommen",
    swingSub: "Teams, deren Weiterkommen-Chance sich zuletzt am stärksten verändert hat",
    swingEmpty: "Snapshots werden erfasst — Trends erscheinen, sobald 2–3 Tage Daten vorliegen.",
    predict: "Tippen →",
    likely: "Wahrscheinliche Ergebnisse",
    thirdsMore: "Vollständige Rangliste der besten Gruppendritten & Sechzehntelfinal-Duelle →",
  },
  fr: {
    title: "Probabilités de qualification et de titre · Mondial 2026 (modèle en direct)",
    description:
      "Simulation de 10 000 tirages à partir des notes de force des équipes et de données publiques de prévision : la probabilité de chaque sélection de se qualifier, de remporter le titre, le tableau des meilleurs troisièmes et les probabilités de victoire par match.",
    h1: "Probabilités de qualification et de titre",
    updated: "Mis à jour",
    champions: "🏆 Chances de titre — Top 12",
    groups: "Probabilité de qualification par groupe",
    thirds: "Course aux meilleurs troisièmes (les 8 premiers se qualifient)",
    thirdsNote: "Classés selon les résultats réels à ce jour ; sous la ligne = actuellement éliminés",
    matches: "Probabilités de victoire des prochains matchs",
    draw: "Match nul",
    calculatorCta: "🧮 Essaie toi-même : calculateur de scénarios des troisièmes →",
    method:
      "Méthode : fusion de données publiques (notes de force des équipes, consensus de prévisions publiques) + modèle de score de Poisson + 10 000 tirages de Monte-Carlo ; départages officiels 2026 (confrontation directe d'abord), points de fair-play approximés par la note de force.",
    fun: "Toutes les probabilités sont fournies à titre de divertissement uniquement.",
    aiTag: "Note IA · juste pour le fun",
    swing: "📈 Plus grandes variations de qualification",
    swingSub: "Équipes dont la probabilité de qualification a le plus bougé récemment",
    swingEmpty: "Enregistrement des données — les tendances apparaissent une fois 2–3 jours de données accumulés.",
    predict: "Prédire →",
    likely: "Scores probables",
    thirdsMore: "Classement complet des meilleurs troisièmes et affiches des seizièmes →",
  },
} as const;

const SCORERS_CTA: Record<Locale, string> = {
  zh: "⚽ 射手榜 · 金靴争夺 →",
  en: "⚽ Top scorers · Golden Boot race →",
  es: "⚽ Goleadores · Bota de Oro →",
  pt: "⚽ Artilheiros · Chuteira de Ouro →",
  de: "⚽ Torjäger · Goldener Schuh →",
  fr: "⚽ Buteurs · Soulier d'or →",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: COPY[locale].title,
    description: COPY[locale].description,
    alternates: localizedAlternates("/forecast", locale),
  };
}

function pct(p: number, digits = 0): string {
  return (p * 100).toFixed(digits) + "%";
}

function Bar({ p }: { p: { home: number; draw: number; away: number } }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="bg-green" style={{ width: `${p.home * 100}%` }} />
      <div className="bg-white/25" style={{ width: `${p.draw * 100}%` }} />
      <div className="bg-[#f97316]" style={{ width: `${p.away * 100}%` }} />
    </div>
  );
}

function TeamName({
  t,
  locale,
}: {
  t: { name: string; zh: string; flag: string | null };
  locale: Locale;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {t.flag && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.flag} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
      )}
      {locale === "zh" ? t.zh : teamName(t.name, locale)}
    </span>
  );
}

export default async function ForecastPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const zhFirst = locale === "zh";
  let data: ForecastData | null = null;
  try {
    data = await getForecast();
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <PageContainer tier="wide">
        <h1 className="font-head text-2xl md:text-3xl font-bold">📊 {c.h1}</h1>
        <p className="mt-4 text-sm md:text-base text-muted">数据暂不可用，请稍后再试 / Data temporarily unavailable.</p>
      </PageContainer>
    );
  }

  const note = zhFirst ? data.noteZh : data.noteEn;
  const upcoming = data.matches.slice(0, 12);

  // Dataset 实体（独家万次模拟概率，dateModified 用真实 settled_at；仅填合法/真实字段）。
  const idx = await getSettledIndex().catch(() => null);
  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: c.title,
    description: c.description,
    url: selfUrl("/forecast", locale),
    creator: { "@type": "Organization", name: "wc2026.cool", url: `${SITE_ORIGIN}/` },
    isAccessibleForFree: true,
    license: selfUrl("/disclaimer", locale), // GSC 推荐字段：数据使用条款（指向免责声明/条款页，locale 化）
    variableMeasured: (
      {
        zh: ["出线概率", "夺冠概率"],
        en: ["chance to advance", "chance to win the title"],
        es: ["probabilidad de avanzar", "probabilidad de ganar el título"],
        pt: ["chance de avançar", "chance de ganhar o título"],
        de: ["Chance aufs Weiterkommen", "Chance auf den Titel"],
        fr: ["probabilité de se qualifier", "probabilité de gagner le titre"],
      } as Record<Locale, string[]>
    )[locale],
    ...(idx?.all ? { dateModified: idx.all } : {}),
  };

  // 出线概率异动：近 4 天 |Δp_advance| 最大的 6 队，队名/旗从 forecast data 映射。
  // 快照表未建/无数据时安全降级为空 → 板块显示"追踪中"双语 note。
  const teamMap = new Map(data.groups.flatMap((g) => g.table).map((t) => [t.id, t] as const));
  let swings: {
    team: NonNullable<ReturnType<typeof teamMap.get>>;
    series: number[];
    delta: number;
  }[] = [];
  try {
    const trends = await getTeamAdvanceTrends();
    swings = trends
      .filter((tr) => Math.abs(tr.delta) >= 0.02 && teamMap.has(tr.teamId))
      .slice(0, 6)
      .map((tr) => ({ team: teamMap.get(tr.teamId)!, series: tr.series, delta: tr.delta }));
  } catch {
    swings = [];
  }

  return (
    <PageContainer tier="wide">
      <JsonLd data={datasetJsonLd} />
      <h1 className="font-head text-2xl md:text-3xl font-bold">📊 {c.h1}</h1>
      <p className="mt-1 text-[11px] md:text-xs text-muted">
        {c.updated} <LocalTime iso={data.updatedAt} locale={locale} mode="datetime" />
      </p>
      <Link
        href={localeHref(locale, "/scorers")}
        className="mt-3 inline-block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
      >
        {SCORERS_CTA[locale]}
      </Link>

      {/* 前置可提取答案（GEO：答案前置 + 统计数字 + 年份信号；EN-first，爬虫见英文）。 */}
      {data.simOk && data.champions[0] && (() => {
        const top = data.champions[0];
        const topName = locale === "zh" ? top.zh : teamName(top.name, locale);
        const tp = pct(top.p, 1);
        const nAdv = data.groups
          .flatMap((g) => g.table)
          .filter((t) => (t.pAdvance > 1 ? t.pAdvance : t.pAdvance * 100) >= 50).length;
        const GEO: Record<Locale, string> = {
          zh: `2026 世界杯小组赛阶段：万次蒙特卡洛模拟显示 ${topName} 以 ${tp} 夺冠概率领跑，目前 ${nAdv} 支球队出线（晋级 32 强）概率超过 50%。`,
          en: `At the 2026 World Cup group stage, a 10,000-run Monte Carlo simulation puts ${topName} on top with a ${tp} chance to win the title; ${nAdv} teams currently have a 50%+ chance to reach the Round of 32.`,
          es: `Fase de grupos del Mundial 2026: una simulación de Montecarlo de 10.000 corridas sitúa a ${topName} en cabeza con un ${tp} de probabilidad de ganar el título; ${nAdv} selecciones tienen ahora un 50%+ de probabilidad de alcanzar los dieciseisavos.`,
          pt: `Fase de grupos da Copa 2026: uma simulação de Monte Carlo de 10.000 rodadas coloca ${topName} na liderança com ${tp} de chance de ganhar o título; ${nAdv} seleções têm agora 50%+ de chance de chegar aos 16-avos.`,
          de: `Gruppenphase der WM 2026: Eine Monte-Carlo-Simulation mit 10.000 Durchläufen sieht ${topName} mit ${tp} Titelchance vorn; ${nAdv} Teams haben derzeit über 50% Chance, das Sechzehntelfinale zu erreichen.`,
          fr: `Phase de groupes du Mondial 2026 : une simulation de Monte-Carlo de 10 000 tirages place ${topName} en tête avec ${tp} de probabilité de remporter le titre ; ${nAdv} équipes ont actuellement plus de 50% de chances d'atteindre les seizièmes.`,
        };
        return (
          <p className="mt-3 text-sm md:text-base leading-relaxed">{GEO[locale] ?? GEO.en}</p>
        );
      })()}

      {note && (
        <div className="fade-up mt-3 rounded-lg border border-border bg-surface p-3">
          <div className="mb-1 text-[10px] md:text-xs text-muted">{c.aiTag}</div>
          <p className="text-sm md:text-base leading-relaxed">{note}</p>
        </div>
      )}

      {data.simOk && (
        <section className="mt-6">
          <h2 className="font-head mb-2 text-sm md:text-base font-semibold">{c.champions}</h2>
          <div className="space-y-1.5">
            {data.champions.map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                <span className="w-32 shrink-0 truncate">
                  <TeamName t={t} locale={locale} />
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full bg-green"
                    style={{ width: `${Math.min(100, t.p * 400)}%` }}
                  />
                </div>
                <span className="font-head w-12 shrink-0 text-right text-green">{pct(t.p, 1)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-7">
        <h2 className="font-head mb-1 text-sm md:text-base font-semibold">{c.swing}</h2>
        <p className="mb-2 text-[10px] md:text-xs text-muted">{c.swingSub}</p>
        {swings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface p-3 text-xs text-muted">
            {c.swingEmpty}
          </p>
        ) : (
          <div className="space-y-1.5">
            {swings.map(({ team, series, delta }) => {
              const up = delta >= 0;
              const color = up ? "#1be27f" : "#ff5436";
              return (
                <div
                  key={team.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-surface p-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-xs">
                    <TeamName t={team} locale={locale} />
                  </span>
                  <span className="shrink-0">
                    <Sparkline lines={[{ values: series, color }]} width={88} height={28} />
                  </span>
                  <span className="shrink-0 text-right leading-tight">
                    <span className="font-head block text-sm text-green">
                      {pct(series[series.length - 1])}
                    </span>
                    <span className="text-[10px] md:text-xs" style={{ color }}>
                      {up ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(1)}pp
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-7">
        <h2 className="font-head mb-2 text-sm md:text-base font-semibold">{c.matches}</h2>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {upcoming.map((m) => (
            <TrackedLink
              key={m.id}
              href={localeHref(locale, `/match/${m.id}`)}
              event="forecast_match_cta_click"
              props={{ matchId: m.id }}
              className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-green/50"
            >
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <TeamName t={m.home} locale={locale} />
                <span className="text-[10px] md:text-xs text-muted">
                  <LocalTime iso={m.kickoff} locale={locale} mode="datetime" />
                </span>
                <TeamName t={m.away} locale={locale} />
              </div>
              <Bar p={m.p} />
              <div className="mt-1 flex justify-between text-[10px] md:text-xs text-muted">
                <span className="text-green">{pct(m.p.home)}</span>
                <span>
                  {c.draw} {pct(m.p.draw)}
                </span>
                <span className="text-[#f97316]">{pct(m.p.away)}</span>
              </div>
              {m.topScores.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] md:text-xs text-muted">
                  <span className="opacity-70">{c.likely}</span>
                  {m.topScores.slice(0, 3).map((s) => (
                    <span key={`${s.h}-${s.a}`} className="tabular-nums">
                      <span className="font-head text-green">
                        {s.h}-{s.a}
                      </span>{" "}
                      {pct(s.p)}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-1.5 text-right text-[11px] md:text-xs font-semibold text-green">
                {c.predict}
              </div>
            </TrackedLink>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <h2 className="font-head mb-2 text-sm md:text-base font-semibold">{c.thirds}</h2>
        <p className="mb-2 text-[10px] md:text-xs text-muted">{c.thirdsNote}</p>
        <div className="rounded-lg border border-border bg-surface p-3">
          {data.thirds.map((t) => (
            <Link
              key={t.id}
              href={localeHref(locale, `/calculator/group/${t.letter.toLowerCase()}`)}
              className={`flex items-center justify-between py-1 text-sm transition hover:text-green ${
                t.rank === 8 ? "border-b border-dashed border-green/60 pb-2" : ""
              } ${t.rank > 8 ? "opacity-50" : ""}`}
            >
              <span className="inline-flex items-center gap-2">
                <span className="font-head w-5 text-right text-xs text-muted">{t.rank}</span>
                <TeamName t={t} locale={locale} />
                <span className="text-[10px] md:text-xs text-muted">{t.letter}</span>
              </span>
              <span className="text-[11px] md:text-xs text-muted">
                {t.pts}pts · GD{t.gd >= 0 ? "+" : ""}
                {t.gd}
              </span>
            </Link>
          ))}
        </div>
        <Link
          href={localeHref(locale, "/calculator")}
          className="mt-3 inline-block rounded-md border border-green/50 px-3 py-2 text-sm font-semibold text-green"
        >
          {c.calculatorCta}
        </Link>
        <Link
          href={localeHref(locale, "/forecast/best-thirds")}
          className="mt-2 block text-xs md:text-sm text-muted transition hover:text-green"
        >
          {c.thirdsMore}
        </Link>
      </section>

      {data.simOk && (
        <section className="mt-7">
          <h2 className="font-head mb-2 text-sm md:text-base font-semibold">{c.groups}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.groups.map((g) => (
              <div key={g.letter} className="rounded-lg border border-border bg-surface p-3">
                <div className="font-head mb-1.5 text-xs font-semibold text-muted">
                  {groupName(g.letter, locale)}
                </div>
                {g.table.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-0.5 text-sm">
                    <span className="truncate">
                      <TeamName t={t} locale={locale} />
                    </span>
                    <span className="shrink-0 text-[11px] md:text-xs">
                      <span className="text-muted">{t.pts}pts · </span>
                      <span className="font-head text-green">{pct(t.pAdvance)}</span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-8 space-y-2 text-center text-[10px] md:text-xs leading-relaxed text-muted">
        <p>{c.method}</p>
        <p>{c.fun}</p>
      </footer>
    </PageContainer>
  );
}
