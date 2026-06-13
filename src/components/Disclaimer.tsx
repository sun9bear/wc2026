"use client";

import { useEffect, useState } from "react";
import { getDict, type Locale } from "@/i18n";

// 合规免责声明组件：文案取自 i18n 文案模块（不硬编码），且必须通过雷词 lint。
// 客户端读 NEXT_LOCALE cookie（proxy.ts 保证首访即写入），调用方无需层层传 locale。
export function Disclaimer() {
  const [locale, setLocale] = useState<Locale>("zh");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=(zh|en)/);
    if (m) setLocale(m[1] as Locale);
    else if (!/^zh/i.test(navigator.language)) setLocale("en");
  }, []);
  return <p className="text-muted text-[11px]">{getDict(locale).disclaimer}</p>;
}
