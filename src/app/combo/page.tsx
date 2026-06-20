import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref, type Locale, BCP47_LOCALE } from "@/i18n";
import { localizedAlternates, selfUrl, SITE_ORIGIN } from "@/lib/seo/canonical";
import { JsonLd } from "@/lib/seo/jsonLd";
import { PageContainer } from "@/components/PageContainer";
import { ComboClient } from "@/components/ComboClient";

// 串关页 title/description（6 语）。此前只设 alternates、继承通用标题被 GSC 判低质。
const META_TITLE: Record<Locale, string> = {
  zh: "串关玩法 · 环球足球预测 2026",
  en: "Combo predictions · World Cup 2026 Predictor",
  es: "Predicciones combinadas · Mundial 2026",
  pt: "Previsões combinadas · Copa 2026",
  de: "Kombi-Tipps · WM 2026",
  fr: "Prédictions combinées · Coupe du monde 2026",
};
const META_DESC: Record<Locale, string> = {
  zh: "把多场比赛预测组合起来，全部命中赢更多虚拟积分——2026 世界杯串关玩法。免费 · 仅供娱乐。",
  en: "Combine several match predictions — get them all right to win more virtual points. World Cup 2026 combo game. Free, for fun only.",
  es: "Combina varias predicciones del Mundial 2026 — acierta todas para ganar más puntos virtuales. Gratis, solo por diversión.",
  pt: "Combine várias previsões da Copa 2026 — acerte todas para ganhar mais pontos virtuais. Grátis, só diversão.",
  de: "Kombiniere mehrere WM-2026-Tipps — triff alle und gewinne mehr virtuelle Punkte. Kostenlos, nur zum Spaß.",
  fr: "Combine plusieurs pronostics de la Coupe du monde 2026 — réussis-les tous pour gagner plus de points virtuels. Gratuit, juste pour le plaisir.",
};

// A5：服务端可抓取正文（杀 GSC 低质根因——此前 body 全是客户端岛）。合规：不用 odds/bet/parlay/multiplier 等博彩词。
const BODY: Record<Locale, { h2: string; p1: string; p2: string; forecast: string; calc: string }> = {
  zh: {
    h2: "什么是串关玩法？",
    p1: "把多场 2026 世界杯比赛的预测组合成一注：同时押中多场的胜平负，全部命中就能赢得更多虚拟积分。免费、仅供娱乐——不涉及真钱、无需注册。",
    p2: "加入的比赛越多，可赢的虚拟积分越高，但每一场都必须押对。在上方挑选即将开打的比赛组成你的串关，再到实时预测页跟踪走势。",
    forecast: "📊 实时出线 & 夺冠概率",
    calc: "🧮 第三名出线计算器",
  },
  en: {
    h2: "What is a combo?",
    p1: "Combine your predictions for several 2026 World Cup matches into one combo: pick the outcome of multiple games, and if every pick is right you earn more virtual points. Free and for fun only — no real money, no sign-up.",
    p2: "The more matches you add, the bigger the virtual-point reward, but every pick must be correct. Build your combo from the upcoming fixtures above, then track them on the live forecast.",
    forecast: "📊 Live advancement & title probabilities",
    calc: "🧮 Third-place qualification calculator",
  },
  es: {
    h2: "¿Qué es un combo?",
    p1: "Combina tus predicciones de varios partidos del Mundial 2026 en un combo: elige el resultado de varios juegos y, si aciertas todos, ganas más puntos virtuales. Gratis y solo por diversión — sin dinero real, sin registro.",
    p2: "Cuantos más partidos añadas, mayor es la recompensa en puntos virtuales, pero cada elección debe ser correcta. Arma tu combo con los próximos partidos de arriba y síguelos en el pronóstico en vivo.",
    forecast: "📊 Probabilidades de avance y título en vivo",
    calc: "🧮 Calculadora de terceros",
  },
  pt: {
    h2: "O que é um combo?",
    p1: "Combine suas previsões de vários jogos da Copa 2026 em um combo: escolha o resultado de vários jogos e, se acertar todos, ganha mais pontos virtuais. Grátis e só por diversão — sem dinheiro real, sem cadastro.",
    p2: "Quanto mais jogos você adiciona, maior a recompensa em pontos virtuais, mas cada palpite precisa estar certo. Monte seu combo com os próximos jogos acima e acompanhe na previsão ao vivo.",
    forecast: "📊 Probabilidades de avanço e título ao vivo",
    calc: "🧮 Calculadora de terceiros",
  },
  de: {
    h2: "Was ist ein Kombi?",
    p1: "Kombiniere deine Tipps für mehrere WM-2026-Spiele zu einem Kombi: Wähle den Ausgang mehrerer Spiele, und wenn jeder Tipp stimmt, gewinnst du mehr virtuelle Punkte. Kostenlos und nur zum Spaß — kein echtes Geld, keine Anmeldung.",
    p2: "Je mehr Spiele du hinzufügst, desto höher die virtuelle Punktebelohnung, aber jeder Tipp muss stimmen. Stelle dein Kombi aus den anstehenden Spielen oben zusammen und verfolge sie in der Live-Prognose.",
    forecast: "📊 Live-Chancen auf Weiterkommen & Titel",
    calc: "🧮 Gruppendritten-Rechner",
  },
  fr: {
    h2: "Qu'est-ce qu'un combo ?",
    p1: "Combine tes pronostics de plusieurs matchs du Mondial 2026 en un combo : choisis l'issue de plusieurs matchs, et si tous tes choix sont bons, tu gagnes plus de points virtuels. Gratuit et juste pour le plaisir — sans argent réel, sans inscription.",
    p2: "Plus tu ajoutes de matchs, plus la récompense en points virtuels est élevée, mais chaque choix doit être correct. Compose ton combo avec les matchs à venir ci-dessus, puis suis-les dans le pronostic en direct.",
    forecast: "📊 Probabilités de qualification et titre en direct",
    calc: "🧮 Calculateur des troisièmes",
  },
};

// 显式绝对自指 canonical（根 layout 不再设 canonical；CodeX 外审 M2 补齐 sitemap 内页覆盖）。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: META_TITLE[locale],
    description: META_DESC[locale],
    alternates: localizedAlternates("/combo", locale),
  };
}

// 服务端壳：下传客户端工具 + A5 可抓取正文(H2 在 ComboClient 的 H1 之下)+ WebApplication JSON-LD。
export default async function ComboPage() {
  const locale = await getLocale();
  const b = BODY[locale];
  const comboJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: META_TITLE[locale],
    description: META_DESC[locale],
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    url: selfUrl("/combo", locale),
    inLanguage: BCP47_LOCALE[locale],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
  };
  return (
    <>
      <JsonLd data={comboJsonLd} />
      <ComboClient locale={locale} />
      <PageContainer tier="standard">
        <section className="border-t border-border pt-6">
          <h2 className="font-head text-lg font-semibold md:text-xl">{b.h2}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text/90 md:text-base">{b.p1}</p>
          <p className="mt-2 text-sm leading-relaxed text-text/90 md:text-base">{b.p2}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <Link href={localeHref(locale, "/forecast")} className="text-sm text-green hover:underline">
              {b.forecast} →
            </Link>
            <Link href={localeHref(locale, "/calculator")} className="text-sm text-green hover:underline">
              {b.calc} →
            </Link>
          </div>
        </section>
      </PageContainer>
    </>
  );
}
