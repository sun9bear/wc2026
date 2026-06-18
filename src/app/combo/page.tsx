import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { type Locale } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";
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

// 显式绝对自指 canonical（根 layout 不再设 canonical；CodeX 外审 M2 补齐 sitemap 内页覆盖）。
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: META_TITLE[locale],
    description: META_DESC[locale],
    alternates: localizedAlternates("/combo", locale),
  };
}

// 服务端壳：读取 locale 后下传客户端组件（客户端拿不到 next/headers）。
export default async function ComboPage() {
  const locale = await getLocale();
  return <ComboClient locale={locale} />;
}
