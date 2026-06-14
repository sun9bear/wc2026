// 「爆冷瞬间」分享文案（纯函数，客户端安全）：比赛页 MatchSwingShare 与结算抽屉 SettleDrawer 共用，
// 把合规敏感的分享文案集中在单一审计点。type-only 引入 MatchSwing（编译期擦除，不进客户端包）。

import type { MatchSwing } from "@/lib/prob/getMatchSwing";
import { localeHref, type Locale } from "@/i18n";
import { teamName } from "@/lib/football/teams";

export const SITE = "https://www.wc2026.cool";
// matchId 比赛页的绝对分享 URL。locale 决定 /zh 等前缀（en→/match/x，zh→/zh/match/x），
// 让各语种分享深链进对应前缀树。所有调用方（MatchSwingShare/SettleDrawer）手头都有 locale，可直接传。
export const matchUrl = (matchId: string, locale: Locale) =>
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
const SWING_TITLE: Record<Locale, string> = {
  zh: "wc2026.cool · 世界杯实时模型",
  en: "wc2026.cool · live World Cup model",
  es: "wc2026.cool · modelo en vivo del Mundial",
  pt: "wc2026.cool · modelo ao vivo da Copa",
  de: "wc2026.cool · Live-WM-Modell",
  fr: "wc2026.cool · modèle en direct de la Coupe du monde",
};

export function swingShareParts(
  swing: MatchSwing,
  locale: Locale,
  personal: boolean,
  by?: string
): SwingShareParts {
  const heroName = locale === "zh" ? swing.hero.zh : teamName(swing.hero.name, locale);
  const before = Math.round(swing.hero.before * 100);
  const after = Math.round(swing.hero.after * 100);
  const up = swing.hero.delta >= 0;
  const score =
    locale === "zh"
      ? `${swing.homeZh} ${swing.homeScore}-${swing.awayScore} ${swing.awayZh}`
      : `${teamName(swing.homeName, locale)} ${swing.homeScore}-${swing.awayScore} ${teamName(swing.awayName, locale)}`;
  const title = SWING_TITLE[locale];
  // 出线概率摆动文案（避博彩词：用 probabilidad/chance/Chance/probabilité + avanzar/Weiterkommen/qualification）。
  const body = (): string => {
    switch (locale) {
      case "zh":
        return personal
          ? `🎯 我猜中了这场爆冷！${score}，${heroName}出线概率 ${before}%→${after}%`
          : `🔥 ${score}！${heroName}出线概率 ${before}%→${after}%`;
      case "es":
        return personal
          ? `🎯 ¡Acerté esta sorpresa! ${score} — probabilidad de ${heroName} de avanzar ${before}%→${after}%`
          : `🔥 ${score} — probabilidad de ${heroName} de avanzar ${before}%→${after}%`;
      case "pt":
        return personal
          ? `🎯 Acertei essa zebra! ${score} — chance de ${heroName} avançar ${before}%→${after}%`
          : `🔥 ${score} — chance de ${heroName} avançar ${before}%→${after}%`;
      case "de":
        return personal
          ? `🎯 Diese Überraschung getippt! ${score} — ${heroName}s Chance aufs Weiterkommen ${before}%→${after}%`
          : `🔥 ${score} — ${heroName}s Chance aufs Weiterkommen ${before}%→${after}%`;
      case "fr":
        return personal
          ? `🎯 J'avais prédit cette surprise ! ${score} — probabilité de qualification de ${heroName} ${before}%→${after}%`
          : `🔥 ${score} — probabilité de qualification de ${heroName} ${before}%→${after}%`;
      default:
        return personal
          ? `🎯 I called this upset! ${score} — ${heroName}'s chance to advance ${before}%→${after}%`
          : `🔥 ${score}! ${heroName}'s chance to advance ${before}%→${after}%`;
    }
  };
  const text = body();
  const signed = by ? `${text}${locale === "zh" ? ` —— ${by}` : ` — ${by}`}` : text;
  return { title, text: signed, heroName, before, after, score, up };
}
