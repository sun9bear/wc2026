"use client";

import { getDict } from "@/i18n";
import { useLocale } from "@/i18n/LocaleContext";

// 合规免责声明组件：文案取自 i18n 文案模块（不硬编码），且必须通过雷词 lint。
// locale 取自 LocaleProvider（根 layout 下发的权威 locale，覆盖全部 6 语种）——
// 不再读 NEXT_LOCALE cookie：① 旧逻辑只认 zh|en，es/pt/de/fr 会错显英文；
// ② 让中间件不必为此在每个响应写 Set-Cookie（Set-Cookie 会硬阻断边缘缓存）。
export function Disclaimer() {
  const locale = useLocale();
  return <p className="text-muted text-[11px]">{getDict(locale).disclaimer}</p>;
}
