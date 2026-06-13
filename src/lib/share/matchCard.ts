// 比赛 OG 图卡 URL 构造（客户端安全，零服务端依赖）：页眉分享入口与卡内分享共用同一份逻辑，
// 避免两处 querystring 漂移。kickoff 用浏览器本地时区格式化（静态图烤的是「分享者本地时间」）。
// 合规：所有用户可控文本（队名/短评/比分行）由 /api/og 路由再过一道雷词闸 fail-closed，本文件只拼串。

const SITE = "https://www.wc2026.cool";

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
  locale: "zh" | "en";
  kickoffLabel?: string | null; // 已按浏览器时区格式化的开球时间
  homeFlag?: string | null;
  awayFlag?: string | null;
  aiTake?: string | null;
  scoreTop3?: ScoreCell[] | null; // 任务 E：最可能比分 Top-3
  qrPath?: string | null; // 任务 D：二维码要编码的站内路径（如 /match/abc）；仅 zh 卡渲染
  fmt?: "portrait" | "square";
}

/** 开球时间 → 浏览器本地时区缩写格式（"6/13 周六 20:00 GMT+8"）。无效返回 ""。 */
export function formatKickoff(iso: string | null | undefined, locale: "zh" | "en"): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(iso));
  } catch {
    return "";
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

/** 构造 /api/og?mode=match 卡片 URL（竖版默认）。 */
export function buildMatchOgUrl(p: MatchCardParams): string {
  const enc = encodeURIComponent;
  const fmt = p.fmt ?? "portrait";
  const sl = encodeScoreline(p.scoreTop3);
  return (
    `${SITE}/api/og?mode=match&fmt=${fmt}&h=${enc(p.home)}&a=${enc(p.away)}` +
    `&hp=${p.hp}&dp=${p.dp}&ap=${p.ap}&locale=${p.locale}` +
    (p.homeFlag && p.homeFlag.startsWith("http") ? `&hf=${enc(p.homeFlag)}` : "") +
    (p.awayFlag && p.awayFlag.startsWith("http") ? `&af=${enc(p.awayFlag)}` : "") +
    (p.kickoffLabel ? `&t=${enc(p.kickoffLabel)}` : "") +
    (p.aiTake ? `&q=${enc(p.aiTake)}` : "") +
    (sl ? `&sl=${enc(sl)}` : "") +
    (p.qrPath ? `&u=${enc(p.qrPath)}` : "")
  );
}
