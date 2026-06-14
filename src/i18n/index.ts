import { zh } from "./messages/zh";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { pt } from "./messages/pt";
import { de } from "./messages/de";
import { fr } from "./messages/fr";
import type { Locale } from "./locales";

// locale 配置/工具集中在叶子模块 ./locales（无字典依赖，中间件 proxy.ts 可安全引入）。
// 此处重新导出，保持 `@/i18n` 为全站统一入口（既有 39 处 import 路径不变）。
export type { Locale } from "./locales";
export {
  DEFAULT_LOCALE,
  LOCALES,
  PREFIXED_LOCALES,
  BCP47_LOCALE,
  NATIVE_LABEL,
  isLocale,
  localeFromAcceptLanguage,
  localeHref,
  stripLocale,
} from "./locales";

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

// Record<Locale, Dict> 强制各 locale 文案结构完整一致（缺键即编译报错）。
const dicts: Record<Locale, Dict> = { zh, en, es, pt, de, fr };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts.en;
}
