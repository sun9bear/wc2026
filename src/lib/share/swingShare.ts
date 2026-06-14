// 「爆冷瞬间」分享文案（纯函数，客户端安全）：比赛页 MatchSwingShare 与结算抽屉 SettleDrawer 共用，
// 把合规敏感的分享文案集中在单一审计点。type-only 引入 MatchSwing（编译期擦除，不进客户端包）。

import type { MatchSwing } from "@/lib/prob/getMatchSwing";
import { localeHref } from "@/i18n";

export const SITE = "https://www.wc2026.cool";
// matchId 比赛页的绝对分享 URL。locale 决定 /zh 前缀（en→/match/x，zh→/zh/match/x），
// 让中文分享深链进 /zh/*。所有调用方（MatchSwingShare/SettleDrawer）手头都有 locale，可直接传。
export const matchUrl = (matchId: string, locale: "zh" | "en") =>
  `${SITE}${localeHref(locale, `/match/${matchId}`)}`;

export interface SwingShareParts {
  title: string;
  text: string;
  heroName: string;
  before: number; // 0-100 整数
  after: number;
  score: string;
  up: boolean; // 主角概率方向（涨/跌）
}

/** 摆动分享的标题/正文/展示字段。personal=true 时第一人称炫耀（本人押中）；by 为分享者署名（已合规校验）。 */
export function swingShareParts(
  swing: MatchSwing,
  locale: "zh" | "en",
  personal: boolean,
  by?: string
): SwingShareParts {
  const heroName = locale === "zh" ? swing.hero.zh : swing.hero.name;
  const before = Math.round(swing.hero.before * 100);
  const after = Math.round(swing.hero.after * 100);
  const up = swing.hero.delta >= 0;
  const score =
    locale === "zh"
      ? `${swing.homeZh} ${swing.homeScore}-${swing.awayScore} ${swing.awayZh}`
      : `${swing.homeName} ${swing.homeScore}-${swing.awayScore} ${swing.awayName}`;
  const title =
    locale === "zh" ? "wc2026.cool · 世界杯实时模型" : "wc2026.cool · live World Cup model";
  const text =
    locale === "zh"
      ? personal
        ? `🎯 我猜中了这场爆冷！${score}，${heroName}出线概率 ${before}%→${after}%`
        : `🔥 ${score}！${heroName}出线概率 ${before}%→${after}%`
      : personal
        ? `🎯 I called this upset! ${score} — ${heroName}'s chance to advance ${before}%→${after}%`
        : `🔥 ${score}! ${heroName}'s chance to advance ${before}%→${after}%`;
  const signed = by ? `${text}${locale === "zh" ? ` —— ${by}` : ` — ${by}`}` : text;
  return { title, text: signed, heroName, before, after, score, up };
}
