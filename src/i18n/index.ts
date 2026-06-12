import { zh } from "./messages/zh";
import { en } from "./messages/en";

// 语言与文案字典（通用，可在服务端/客户端引入；不含 next/headers）。
export type Locale = "zh" | "en";

export interface Dict {
  appName: string;
  tagline: string;
  disclaimer: string;
  nav: { predict: string; combo: string; ranking: string; me: string };
  filter: { all: string; upcoming: string; done: string; empty: string };
  footer: { watch: string; about: string; privacy: string; terms: string; note: string };
  langLabel: string;
}

// Record<Locale, Dict> 强制 zh / en 两套文案结构完整一致（缺键即编译报错）。
const dicts: Record<Locale, Dict> = { zh, en };

export function getDict(locale: Locale): Dict {
  return dicts[locale] ?? dicts.zh;
}
