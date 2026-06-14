"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./index";

// 客户端 locale 来源：x-locale 请求头是 server-only（中间件注入），客户端组件读不到，
// 而 per-locale URL 下客户端 <Link>/router.push 必须知道当前 locale 才能加对 /zh 前缀。
// 故由根 layout（已 await getLocale()）把权威 locale 经此 Context 下发给整棵客户端子树。
const LocaleContext = createContext<Locale>("en");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
