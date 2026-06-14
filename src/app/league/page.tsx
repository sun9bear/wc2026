import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import type { Locale } from "@/i18n";
import { LeagueClient } from "@/components/LeagueClient";

export const dynamic = "force-dynamic";

const TITLE: Record<Locale, string> = {
  zh: "好友擂台 · 环球足球预测 2026",
  en: "Friends League · WC2026 Predictor",
  es: "Liga de amigos · WC2026 Predictor",
  pt: "Liga de amigos · WC2026 Predictor",
  de: "Freunde-Liga · WC2026 Predictor",
  fr: "Ligue entre amis · WC2026 Predictor",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: TITLE[locale] ?? TITLE.en, robots: { index: false } };
}

// 擂台仅私域分发（微信群/好友），不进搜索索引（robots noindex）。
export default async function LeaguePage() {
  const locale = await getLocale();
  return <LeagueClient locale={locale} />;
}
