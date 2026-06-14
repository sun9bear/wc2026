// 比赛 OG 图卡 URL 构造（客户端安全，零服务端依赖）：页眉分享入口与卡内分享共用同一份逻辑，
// 避免两处 querystring 漂移。kickoff 用浏览器本地时区格式化（静态图烤的是「分享者本地时间」）。
// 合规：所有用户可控文本（队名/短评/比分行）由 /api/og 路由再过一道雷词闸 fail-closed，本文件只拼串。

import { localeHref, type Locale } from "@/i18n";

const SITE = "https://www.wc2026.cool";

// 非 zh/en locale 的 BCP-47 日期格式码（zh/en 走各自定制模板，见 formatKickoff）。
const KICKOFF_BCP47: Record<Exclude<Locale, "zh" | "en">, string> = {
  es: "es-ES",
  pt: "pt-BR",
  de: "de-DE",
  fr: "fr-FR",
};

export interface ScoreCell {
  h: number;
  a: number;
  p: number; // 0-1
}

export interface MatchCardParams {
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  locale: Locale;
  kickoffDate?: string | null; // 开球「日期 + 星期」段（已按浏览器时区格式化）
  kickoffTime?: string | null; // 开球「时区 + 时间」段（已按浏览器时区格式化）
  homeFlag?: string | null;
  awayFlag?: string | null;
  aiTake?: string | null;
  scoreTop3?: ScoreCell[] | null; // 任务 E：最可能比分 Top-3
  qrPath?: string | null; // 任务 D：二维码要编码的站内路径（如 /match/abc）；仅 zh 卡渲染
}

export interface KickoffParts {
  date: string; // 日期 + 星期：zh「6月13日 周六」/ en「Sat, Jun 13」
  time: string; // 时区 + 时间：zh「20:00 GMT+8」/ en「8:00 PM GMT+8」
}

/**
 * 开球时间 → 浏览器本地时区，拆成两段（日期+星期 / 时区+时间），换行点固定在日期/时间边界。
 * 用 formatToParts 干净取值再按固定模板拼，保证 zh/en 各自的顺序与分隔符可控。无效返回空段。
 */
export function formatKickoff(iso: string | null | undefined, locale: Locale): KickoffParts {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pick = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  try {
    if (locale !== "zh" && locale !== "en") {
      // es/pt/de/fr：用 BCP-47 自然排序（日期整串 .format，时间 24h + 时区缩写）。
      const bcp = KICKOFF_BCP47[locale];
      const date = new Intl.DateTimeFormat(bcp, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(d);
      const tp = new Intl.DateTimeFormat(bcp, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).formatToParts(d);
      return { date, time: `${pick(tp, "hour")}:${pick(tp, "minute")} ${pick(tp, "timeZoneName")}` };
    }
    if (locale === "zh") {
      const dp = new Intl.DateTimeFormat("zh-CN", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).formatToParts(d);
      const tp = new Intl.DateTimeFormat("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).formatToParts(d);
      return {
        date: `${pick(dp, "month")}月${pick(dp, "day")}日 ${pick(dp, "weekday")}`,
        time: `${pick(tp, "hour")}:${pick(tp, "minute")} ${pick(tp, "timeZoneName")}`,
      };
    }
    const dp = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      weekday: "short",
    }).formatToParts(d);
    const tp = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }).formatToParts(d);
    const period = pick(tp, "dayPeriod");
    return {
      date: `${pick(dp, "weekday")}, ${pick(dp, "month")} ${pick(dp, "day")}`,
      time: `${pick(tp, "hour")}:${pick(tp, "minute")}${period ? ` ${period}` : ""} ${pick(tp, "timeZoneName")}`,
    };
  } catch {
    return { date: "", time: "" };
  }
}

/** Top-3 比分 → "1-0:17,2-0:12,0-0:8"（h-a:整数百分比）。空/无效返回 ""。 */
export function encodeScoreline(top: ScoreCell[] | null | undefined): string {
  if (!top || top.length === 0) return "";
  return top
    .slice(0, 3)
    .filter((c) => Number.isFinite(c.h) && Number.isFinite(c.a) && Number.isFinite(c.p))
    .map((c) => `${c.h}-${c.a}:${Math.round(c.p * 100)}`)
    .filter((s) => !s.endsWith(":0")) // 0% 不上卡
    .join(",");
}

/** 构造 /api/og?mode=match 卡片 URL（统一 3:4 竖版；开球时间拆两段 t=日期 / t2=时间）。 */
export function buildMatchOgUrl(p: MatchCardParams): string {
  const enc = encodeURIComponent;
  const sl = encodeScoreline(p.scoreTop3);
  return (
    `${SITE}/api/og?mode=match&h=${enc(p.home)}&a=${enc(p.away)}` +
    `&hp=${p.hp}&dp=${p.dp}&ap=${p.ap}&locale=${p.locale}` +
    (p.homeFlag && p.homeFlag.startsWith("http") ? `&hf=${enc(p.homeFlag)}` : "") +
    (p.awayFlag && p.awayFlag.startsWith("http") ? `&af=${enc(p.awayFlag)}` : "") +
    (p.kickoffDate ? `&t=${enc(p.kickoffDate)}` : "") +
    (p.kickoffTime ? `&t2=${enc(p.kickoffTime)}` : "") +
    (p.aiTake ? `&q=${enc(p.aiTake)}` : "") +
    (sl ? `&sl=${enc(sl)}` : "") +
    (p.qrPath ? `&u=${enc(localeHref(p.locale, p.qrPath))}` : "")
  );
}
