import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale, BCP47_LOCALE } from "@/i18n";
import { localizedAlternates, selfUrl, SITE_ORIGIN } from "@/lib/seo/canonical";
import { getSettledIndex } from "@/lib/seo/freshness";
import { JsonLd } from "@/lib/seo/jsonLd";
import { PageContainer } from "@/components/PageContainer";
import { Disclaimer } from "@/components/Disclaimer";

export const maxDuration = 60;

// C1：方法论页（GEO/E-E-A-T）——给每个概率一个可被 LLM 引用的出处 + 稳定 URL。
// 内容来自 forecast 页脚的 c.method，扩展成完整 TechArticle（author/publisher/datePublished/dateModified）。

const PUBLISHED = "2026-06-11"; // 模型自站点上线起生效

type Section = { h: string; body: string };
type Copy = {
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: Section[];
  forecastCta: string;
  rulesCta: string;
};

const COPY: Record<Locale, Copy> = {
  zh: {
    title: "模型方法论 —— 2026 世界杯预测怎么算的",
    description:
      "wc2026.cool 如何预测 2026 世界杯：球队实力（Elo）评分 + 公开预测共识、泊松比分模型、万次蒙特卡洛模拟与 2026 官方排名判据，并说明模型的局限与更新频率。",
    h1: "方法论 —— 预测是怎么算出来的",
    intro:
      "wc2026.cool 上的每一个概率都来自同一个透明模型。下面说明它如何运作、用了哪些数据，以及它没有考虑什么。",
    sections: [
      {
        h: "数据来源",
        body: "每支球队有一个 Elo 量纲上的实力评分，并融合公开的预测共识。我们不发布或转售任何数据提供方的专有评分或市场数据；评分只是模型的输入因子，不是官方排名。",
      },
      {
        h: "模型",
        body: "对每一场剩余比赛，双方评分（加上美国、墨西哥、加拿大三个东道主的主场修正）确定各队的期望进球；泊松比分模型据此生成完整的比分概率矩阵。随后对全部剩余小组赛与淘汰赛跑 10,000 次蒙特卡洛模拟，估算每队的出线概率与夺冠概率。",
      },
      {
        h: "积分与排名判据",
        body: "小组积分榜与最佳第三名排名采用 2026 世界杯官方规则：先比积分，再比相互战绩，然后是净胜球与进球数。12 个小组第三名中最好的 8 个晋级 32 强。",
      },
      {
        h: "局限",
        body: "模型看不到伤病、停赛、首发阵容或比赛中的临场事件。国际足联的公平竞赛判据（黄/红牌）不在我们的数据里，以实力评分近似。所有数字仅供娱乐参考，不构成任何建议。",
      },
      {
        h: "多久更新一次",
        body: "模型每小时重算一次，并在每场结果出来后更新，因此概率、积分榜与最可能比分都会在终场后几分钟内保持最新。",
      },
    ],
    forecastCta: "📊 查看实时出线 & 夺冠概率 →",
    rulesCta: "📖 2026 世界杯赛制与出线规则 →",
  },
  en: {
    title: "How the model works — World Cup 2026 forecast methodology",
    description:
      "How wc2026.cool forecasts the 2026 World Cup: team strength (Elo) ratings + public forecasting consensus, a Poisson score model, 10,000 Monte Carlo simulations and the official 2026 tie-breakers. Limitations and update cadence explained.",
    h1: "Methodology — how the forecast works",
    intro:
      "Every probability on wc2026.cool comes from one transparent model. Here is exactly how it works, what data it uses, and what it does not account for.",
    sections: [
      {
        h: "Data sources",
        body: "Each team has a strength rating on an Elo scale, blended with public forecasting consensus. We do not publish or resell any provider's proprietary ratings or market data; the rating is a model input, not an official ranking.",
      },
      {
        h: "The model",
        body: "For every remaining match, the two teams' ratings (plus a host-nation adjustment for the USA, Mexico and Canada) set the expected goals for each side, and a Poisson score model turns those into a full scoreline probability matrix. We then run 10,000 Monte Carlo simulations of all remaining group and knockout matches to estimate each team's chance to advance and to win the title.",
      },
      {
        h: "Standings & tie-breakers",
        body: "Group tables and the best-third-placed race use the official 2026 World Cup rules: points first, then head-to-head results, then goal difference and goals scored. The eight best of the twelve third-placed teams advance to the Round of 32.",
      },
      {
        h: "Limitations",
        body: "The model does not see injuries, suspensions, line-ups or in-match events. FIFA's fair-play tie-breaker (yellow/red cards) isn't in our data, so it is approximated by the strength rating. All numbers are estimates for entertainment only and are not advice of any kind.",
      },
      {
        h: "How often it updates",
        body: "The model is recomputed every hour and after each result, so probabilities, standings and most-likely scores stay current within minutes of full-time.",
      },
    ],
    forecastCta: "📊 See live advancement & title probabilities →",
    rulesCta: "📖 World Cup 2026 format & qualification rules →",
  },
  es: {
    title: "Cómo funciona el modelo — metodología del pronóstico del Mundial 2026",
    description:
      "Cómo wc2026.cool pronostica el Mundial 2026: valoraciones de fuerza (Elo) + consenso de predicciones públicas, un modelo de marcador de Poisson, 10.000 simulaciones de Montecarlo y los desempates oficiales de 2026. Con limitaciones y frecuencia de actualización.",
    h1: "Metodología — cómo se calcula el pronóstico",
    intro:
      "Cada probabilidad en wc2026.cool proviene de un único modelo transparente. Aquí se explica exactamente cómo funciona, qué datos usa y qué no tiene en cuenta.",
    sections: [
      {
        h: "Fuentes de datos",
        body: "Cada selección tiene una valoración de fuerza en escala Elo, combinada con el consenso de predicciones públicas. No publicamos ni revendemos valoraciones propietarias ni datos de mercado de ningún proveedor; la valoración es un dato de entrada del modelo, no un ranking oficial.",
      },
      {
        h: "El modelo",
        body: "Para cada partido restante, las valoraciones de ambos equipos (más un ajuste de local para EE. UU., México y Canadá) fijan los goles esperados de cada lado, y un modelo de marcador de Poisson los convierte en una matriz completa de probabilidades de resultado. Luego ejecutamos 10.000 simulaciones de Montecarlo de todos los partidos restantes para estimar la probabilidad de cada selección de avanzar y de ganar el título.",
      },
      {
        h: "Clasificación y desempates",
        body: "Las tablas de grupo y la carrera por los mejores terceros usan las reglas oficiales del Mundial 2026: primero los puntos, luego el enfrentamiento directo, después la diferencia de goles y los goles marcados. Los ocho mejores de los doce terceros avanzan a los dieciseisavos.",
      },
      {
        h: "Limitaciones",
        body: "El modelo no ve lesiones, sanciones, alineaciones ni eventos durante el partido. El desempate de juego limpio de la FIFA (tarjetas) no está en nuestros datos, así que se aproxima por la valoración de fuerza. Todas las cifras son estimaciones solo para entretenimiento y no constituyen ningún consejo.",
      },
      {
        h: "Con qué frecuencia se actualiza",
        body: "El modelo se recalcula cada hora y tras cada resultado, por lo que las probabilidades, las clasificaciones y los marcadores más probables se mantienen actualizados pocos minutos después del final.",
      },
    ],
    forecastCta: "📊 Ver probabilidades en vivo de avance y título →",
    rulesCta: "📖 Formato y reglas de clasificación del Mundial 2026 →",
  },
  pt: {
    title: "Como o modelo funciona — metodologia da previsão da Copa 2026",
    description:
      "Como o wc2026.cool prevê a Copa 2026: avaliações de força (Elo) + consenso de previsões públicas, um modelo de placar de Poisson, 10.000 simulações de Monte Carlo e os critérios de desempate oficiais de 2026. Com limitações e frequência de atualização.",
    h1: "Metodologia — como a previsão é calculada",
    intro:
      "Cada probabilidade no wc2026.cool vem de um único modelo transparente. Veja exatamente como ele funciona, quais dados usa e o que não leva em conta.",
    sections: [
      {
        h: "Fontes de dados",
        body: "Cada seleção tem uma avaliação de força em escala Elo, combinada com o consenso de previsões públicas. Não publicamos nem revendemos avaliações proprietárias ou dados de mercado de nenhum provedor; a avaliação é um dado de entrada do modelo, não um ranking oficial.",
      },
      {
        h: "O modelo",
        body: "Para cada jogo restante, as avaliações das duas seleções (mais um ajuste de mando para EUA, México e Canadá) definem os gols esperados de cada lado, e um modelo de placar de Poisson os transforma em uma matriz completa de probabilidades de placar. Em seguida, rodamos 10.000 simulações de Monte Carlo de todos os jogos restantes para estimar a chance de cada seleção avançar e ganhar o título.",
      },
      {
        h: "Classificação e desempates",
        body: "As tabelas de grupo e a disputa pelos melhores terceiros usam as regras oficiais da Copa 2026: primeiro os pontos, depois o confronto direto, então o saldo de gols e os gols marcados. Os oito melhores dos doze terceiros avançam aos 16-avos.",
      },
      {
        h: "Limitações",
        body: "O modelo não vê lesões, suspensões, escalações ou eventos durante o jogo. O critério de fair play da FIFA (cartões) não está nos nossos dados, então é aproximado pela avaliação de força. Todos os números são estimativas apenas para entretenimento e não constituem nenhum conselho.",
      },
      {
        h: "Com que frequência atualiza",
        body: "O modelo é recalculado a cada hora e após cada resultado, então probabilidades, classificações e placares mais prováveis permanecem atualizados poucos minutos após o apito final.",
      },
    ],
    forecastCta: "📊 Ver probabilidades ao vivo de avanço e título →",
    rulesCta: "📖 Formato e regras de classificação da Copa 2026 →",
  },
  de: {
    title: "Wie das Modell funktioniert — Methodik der WM-2026-Prognose",
    description:
      "Wie wc2026.cool die WM 2026 prognostiziert: Stärkewerte (Elo) + Konsens öffentlicher Prognosen, ein Poisson-Ergebnismodell, 10.000 Monte-Carlo-Simulationen und die offiziellen Tiebreaker 2026. Mit Grenzen und Aktualisierungsrhythmus.",
    h1: "Methodik — wie die Prognose berechnet wird",
    intro:
      "Jede Wahrscheinlichkeit auf wc2026.cool stammt aus einem einzigen transparenten Modell. Hier steht genau, wie es funktioniert, welche Daten es nutzt und was es nicht berücksichtigt.",
    sections: [
      {
        h: "Datenquellen",
        body: "Jedes Team hat einen Stärkewert auf einer Elo-Skala, kombiniert mit dem Konsens öffentlicher Prognosen. Wir veröffentlichen oder verkaufen keine proprietären Bewertungen oder Marktdaten eines Anbieters; der Wert ist eine Modelleingabe, kein offizielles Ranking.",
      },
      {
        h: "Das Modell",
        body: "Für jedes verbleibende Spiel legen die Werte beider Teams (plus eine Heimvorteil-Anpassung für die USA, Mexiko und Kanada) die erwarteten Tore jeder Seite fest, und ein Poisson-Ergebnismodell macht daraus eine vollständige Ergebnis-Wahrscheinlichkeitsmatrix. Dann führen wir 10.000 Monte-Carlo-Simulationen aller verbleibenden Spiele durch, um die Chance jedes Teams auf Weiterkommen und Titel zu schätzen.",
      },
      {
        h: "Tabelle & Tiebreaker",
        body: "Gruppentabellen und das Rennen um die besten Dritten folgen den offiziellen WM-2026-Regeln: zuerst Punkte, dann direkter Vergleich, danach Tordifferenz und erzielte Tore. Die acht besten der zwölf Gruppendritten kommen ins Sechzehntelfinale.",
      },
      {
        h: "Grenzen",
        body: "Das Modell sieht keine Verletzungen, Sperren, Aufstellungen oder Ereignisse während des Spiels. Der Fair-Play-Tiebreaker der FIFA (Karten) ist nicht in unseren Daten und wird durch den Stärkewert angenähert. Alle Zahlen sind Schätzungen, nur zur Unterhaltung, und keinerlei Beratung.",
      },
      {
        h: "Wie oft es aktualisiert wird",
        body: "Das Modell wird stündlich und nach jedem Ergebnis neu berechnet, sodass Wahrscheinlichkeiten, Tabellen und wahrscheinlichste Ergebnisse wenige Minuten nach Abpfiff aktuell bleiben.",
      },
    ],
    forecastCta: "📊 Live-Chancen auf Weiterkommen & Titel ansehen →",
    rulesCta: "📖 Format & Qualifikationsregeln der WM 2026 →",
  },
  fr: {
    title: "Comment fonctionne le modèle — méthodologie des pronostics du Mondial 2026",
    description:
      "Comment wc2026.cool pronostique le Mondial 2026 : notes de force (Elo) + consensus de prévisions publiques, un modèle de score de Poisson, 10 000 simulations de Monte-Carlo et les départages officiels 2026. Limites et fréquence de mise à jour expliquées.",
    h1: "Méthodologie — comment le pronostic est calculé",
    intro:
      "Chaque probabilité sur wc2026.cool provient d'un seul modèle transparent. Voici précisément comment il fonctionne, quelles données il utilise et ce qu'il ne prend pas en compte.",
    sections: [
      {
        h: "Sources de données",
        body: "Chaque sélection a une note de force sur une échelle Elo, combinée au consensus de prévisions publiques. Nous ne publions ni ne revendons les notes propriétaires ou données de marché d'aucun fournisseur ; la note est une donnée d'entrée du modèle, pas un classement officiel.",
      },
      {
        h: "Le modèle",
        body: "Pour chaque match restant, les notes des deux équipes (plus un ajustement à domicile pour les États-Unis, le Mexique et le Canada) fixent les buts attendus de chaque côté, et un modèle de score de Poisson les transforme en une matrice complète de probabilités de score. Nous lançons ensuite 10 000 simulations de Monte-Carlo de tous les matchs restants pour estimer la probabilité de chaque sélection de se qualifier et de remporter le titre.",
      },
      {
        h: "Classement & départages",
        body: "Les classements de groupe et la course aux meilleurs troisièmes suivent les règles officielles du Mondial 2026 : d'abord les points, puis la confrontation directe, ensuite la différence de buts et les buts marqués. Les huit meilleurs des douze troisièmes se qualifient pour les seizièmes.",
      },
      {
        h: "Limites",
        body: "Le modèle ne voit pas les blessures, suspensions, compositions ou événements en cours de match. Le départage fair-play de la FIFA (cartons) n'est pas dans nos données, il est donc approché par la note de force. Tous les chiffres sont des estimations à titre de divertissement uniquement et ne constituent aucun conseil.",
      },
      {
        h: "À quelle fréquence c'est mis à jour",
        body: "Le modèle est recalculé chaque heure et après chaque résultat, de sorte que les probabilités, les classements et les scores les plus probables restent à jour quelques minutes après le coup de sifflet final.",
      },
    ],
    forecastCta: "📊 Voir les probabilités en direct de qualification et de titre →",
    rulesCta: "📖 Format et règles de qualification du Mondial 2026 →",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = COPY[locale] ?? COPY.en;
  return {
    title: c.title,
    description: c.description,
    alternates: localizedAlternates("/methodology", locale),
  };
}

export default async function MethodologyPage() {
  const locale = await getLocale();
  const c = COPY[locale] ?? COPY.en;
  const idx = await getSettledIndex().catch(() => null);
  const dateModified = idx?.all && idx.all > PUBLISHED ? idx.all : PUBLISHED;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${selfUrl("/methodology", locale)}#article`,
    headline: c.h1,
    description: c.description,
    inLanguage: BCP47_LOCALE[locale],
    url: selfUrl("/methodology", locale),
    mainEntityOfPage: selfUrl("/methodology", locale),
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    author: { "@id": `${SITE_ORIGIN}/#org` },
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    datePublished: PUBLISHED,
    dateModified,
  };

  return (
    <PageContainer tier="prose">
      <JsonLd data={articleJsonLd} />
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        {locale === "zh" ? "← 返回" : "← Back"}
      </Link>
      <h1 className="font-head mb-2 mt-3 text-2xl font-bold md:text-3xl">{c.h1}</h1>
      <p className="text-sm leading-relaxed md:text-base">{c.intro}</p>

      {c.sections.map((s) => (
        <section key={s.h} className="mt-5">
          <h2 className="font-head mb-1.5 text-base font-semibold md:text-lg">{s.h}</h2>
          <p className="text-sm leading-relaxed text-text/90 md:text-base">{s.body}</p>
        </section>
      ))}

      <div className="mt-7 space-y-2">
        <Link
          href={localeHref(locale, "/forecast")}
          className="block rounded-lg border border-green/40 bg-surface p-3 text-sm text-green transition-colors hover:border-green/60"
        >
          {c.forecastCta}
        </Link>
        <Link
          href={localeHref(locale, "/rules")}
          className="block rounded-lg border border-border bg-surface p-3 text-sm text-muted transition-colors hover:border-green/50"
        >
          {c.rulesCta}
        </Link>
      </div>

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </PageContainer>
  );
}
