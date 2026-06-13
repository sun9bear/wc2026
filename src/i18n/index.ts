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
}

// Record<Locale, Dict> 强制 zh / en 两套文案结构完整一致（缺键即编译报错）。
const dicts: Record<Locale, Dict> = { zh, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts.zh;
}
