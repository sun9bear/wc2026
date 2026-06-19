// P2.3 一级需求信号：赛程 query 模板。真实赛事天然被搜（"A vs B" / "X 出线"）——免费、必到，
// 是需求门控的骨干；Trending/GDELT 只是按热度加权的"加分项"（见 BLOG-EVENT-COMMENTARY-DESIGN §4）。
// 同时产出标题要含的目标搜索词 + 关键词（locale 相关）。

import { teamName } from "@/lib/football/teams";
import type { Locale } from "@/i18n/locales";
import type { BlogEventType } from "./getProbDelta";

export type EventKind = BlogEventType | "market_swing";

export interface DemandSignal {
  source: "template" | "trends";
  query: string; // 目标搜索词（标题须自然含它）
  keywords: string[]; // 附加关键词
  heat: number | null; // 来自 Trending 加权；null = 仅基线（真实赛事的固有需求）
}

/** 为某场比赛 + 事件类型生成目标搜索词 + 关键词；trendingHeat 非 null 时标记来源为 trends。 */
export function fixtureDemand(
  homeEn: string,
  awayEn: string,
  event: EventKind,
  locale: Locale,
  trendingHeat: number | null = null
): DemandSignal {
  const h = teamName(homeEn, locale);
  const a = teamName(awayEn, locale);
  const isQual = event === "clinched" || event === "eliminated";
  let query: string;
  const keywords: string[] = [];
  if (locale === "zh") {
    query = `${h} vs ${a}`;
    keywords.push(`${h} ${a}`, `${h} ${a} 比分`, `${h} 世界杯`, `${a} 世界杯`);
    if (isQual) keywords.push(`${h} 出线`, `${a} 出线`);
    if (event === "upset") keywords.push(`${h} ${a} 爆冷`);
    if (event === "market_swing") keywords.push(`${h} ${a} 预测`);
  } else {
    query = `${h.toLowerCase()} vs ${a.toLowerCase()}`;
    keywords.push(`${h} vs ${a}`, `${h} ${a} result`, `${h} world cup`, `${a} world cup`);
    if (isQual) keywords.push(`${h} qualified`, `${a} qualified`);
    if (event === "upset") keywords.push(`${h} ${a} upset`);
    if (event === "market_swing") keywords.push(`${h} vs ${a} prediction`);
  }
  return { source: trendingHeat != null ? "trends" : "template", query, keywords, heat: trendingHeat };
}
