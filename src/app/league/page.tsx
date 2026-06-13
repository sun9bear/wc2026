import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { LeagueClient } from "@/components/LeagueClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return locale === "zh"
    ? { title: "好友擂台 · 环球足球预测 2026", robots: { index: false } }
    : { title: "Friends League · WC2026 Predictor", robots: { index: false } };
}

// 擂台仅私域分发（微信群/好友），不进搜索索引（robots noindex）。
export default async function LeaguePage() {
  const locale = await getLocale();
  return <LeagueClient locale={locale} />;
}
