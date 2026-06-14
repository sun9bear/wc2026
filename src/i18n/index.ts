import { zh } from "./messages/zh";
import { en } from "./messages/en";

// 语言与文案字典（通用，可在服务端/客户端引入；不含 next/headers）。
export type Locale = "zh" | "en";

export interface Dict {
  appName: string;
  tagline: string;
  disclaimer: string;
  nav: { predict: string; combo: string; calc: string; forecast: string; ranking: string; me: string };
  filter: { all: string; upcoming: string; done: string; empty: string };
  footer: {
    calculator: string;
    watch: string;
    about: string;
    privacy: string;
    terms: string;
    note: string;
  };
  langLabel: string;
  hero: {
    calcHook: string;
    calcSub: string;
    calcCta: string;
    valueProp: string;
    focusTitle: string;
    focusCta: string;
    pointsBanner: string;
    watchLink: string;
    comboLink: string;
    leagueLink: string;
    todaySchedule: string;
  };
  status: { finished: string; live: string };
  common: { back: string; loading: string };
  match: {
    previewTag: string;
    hotTakeTag: string;
    recapTag: string;
    previewFold: string;
    hotTakeFold: string;
    resultPrefix: string;
    settledSuffix: string;
    locked: string;
    livePicks: string;
    sentimentTitle: string;
    sentimentEmpty: string;
    home: string;
    draw: string;
    away: string;
    stake: string;
    payout: string;
    submit: string;
    submitting: string;
    successA: string;
    balanceWord: string;
    enterFail: string;
    submitFail: string;
    hotMost: string;
    coldMost: string;
  };
  combo: {
    title: string;
    desc: string;
    empty: string;
    selectedA: string;
    selectedB: string;
    payout: string;
    submit: string;
    least2: string;
    submitting: string;
    successA: string;
    successB: string;
  };
  me: {
    title: string;
    empty: string;
    emptyCta: string;
    balanceLabel: string;
    hitRate: string;
    wins: string;
    total: string;
    pending: string;
    achievements: string;
    checkinTitle: string;
    checkinDesc: string;
    checkinBtn: string;
    checkinDone: string;
    checkinStreak: string;
    checkinOkA: string;
    checkinAlready: string;
    checkinFail: string;
  };
  leaderboard: { title: string; empty: string };
  tiers: Record<string, string>;
  ach: Record<string, { label: string; desc: string }>;
}

// Record<Locale, Dict> 强制 zh / en 两套文案结构完整一致（缺键即编译报错）。
const dicts: Record<Locale, Dict> = { zh, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts.zh;
}

// 站内链接 locale 化：en 留根（无前缀），zh 加 /zh 前缀。path 必须以 "/" 开头且为 locale-无关裸路径。
// 唯一前缀真理点——页面/组件内链、JSON-LD、OG、sitemap 全部经此构造，避免散落的字符串拼接。
export function localeHref(locale: Locale, path: string): string {
  if (locale !== "zh") return path;
  return path === "/" ? "/zh" : `/zh${path}`;
}

// 剥掉 /zh 前缀得到 locale-无关裸路径（"/zh/forecast"→"/forecast"，"/zh"→"/"）。
// 供 LangToggle 等已知当前 URL 的客户端在切换 locale 时重建链接。
export function stripLocale(pathname: string): string {
  if (pathname === "/zh") return "/";
  if (pathname.startsWith("/zh/")) return pathname.slice(3);
  return pathname;
}
