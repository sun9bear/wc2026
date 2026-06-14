// Locale 配置（纯叶子模块：无 next/headers、无文案字典依赖 → 中间件 proxy.ts 可安全引入，不撑大 edge 包）。
// 全站 locale 的【单一真理源】。扩语种 = 在这里加 + 补各页文案；路由/链接逻辑遍历本配置，无需再硬编码。
export type Locale = "zh" | "en" | "es" | "pt" | "de" | "fr";

// 默认 locale = 根路径（无前缀）。x-default / canonical 兜底方向。
export const DEFAULT_LOCALE: Locale = "en";

// 全部受支持 locale（含默认）。运行时校验来源 + LangToggle 下拉遍历顺序。
export const LOCALES: readonly Locale[] = ["en", "zh", "es", "pt", "de", "fr"];

// 带 URL 前缀的 locale（DEFAULT_LOCALE 留根、无前缀）。
// P2-2 已激活 es/pt/de/fr：改这一处，localeHref/stripLocale/getLocale/proxy 自动生效。
// 注意 proxy.ts 的 matcher 是静态字面量（读不到本数组），加前缀 locale 时须手动同步那条正则。
export const PREFIXED_LOCALES: readonly Locale[] = ["zh", "es", "pt", "de", "fr"];

// 运行时类型守卫：把不可信字符串（请求头 / cookie / URL 段）收窄为 Locale。
export function isLocale(v: string | null | undefined): v is Locale {
  return v != null && (LOCALES as readonly string[]).includes(v);
}

// locale → BCP-47 日期/数字格式码（Intl.DateTimeFormat 等用）。
// 口吻对齐 §4②：es 用拉美(es-419 倾向，取 es-ES 通用书面)、pt 用巴西(pt-BR)。
export const BCP47_LOCALE: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
  de: "de-DE",
  fr: "fr-FR",
};

// 各 locale 母语自称（LangToggle 下拉用；与字典 langLabel 一致，但此处零字典依赖、客户端轻量）。
export const NATIVE_LABEL: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  fr: "Français",
};

// 从 Accept-Language 头猜测 locale —— 仅在无 x-locale 头/NEXT_LOCALE cookie 时兜底
// （页面内容由 URL 唯一决定，绝不据此重定向；保留 DEFAULT_LOCALE 优先级，非默认按 LOCALES 顺序匹配）。
export function localeFromAcceptLanguage(accept: string | null | undefined): Locale {
  const a = accept ?? "";
  for (const l of LOCALES) {
    if (l === DEFAULT_LOCALE) continue;
    if (new RegExp(`(^|[,;\\s])${l}\\b|${l}-`, "i").test(a)) return l;
  }
  return DEFAULT_LOCALE;
}

// locale-无关裸路径 → 带 locale 前缀的站内链接。DEFAULT_LOCALE 留根，其余加 /<locale> 前缀。
// 唯一前缀真理点——页面/组件内链、JSON-LD、OG、sitemap 全部经此构造，避免散落的字符串拼接。
// path 必须以 "/" 开头且为 locale-无关裸路径。
export function localeHref(locale: Locale, path: string): string {
  if (!PREFIXED_LOCALES.includes(locale)) return path;
  const prefix = `/${locale}`;
  return path === "/" ? prefix : `${prefix}${path}`;
}

// 剥掉任一已知 locale 前缀，得到 locale-无关裸路径（"/zh/forecast"→"/forecast"，"/zh"→"/"）。
// 供 LangToggle 等已知当前 URL 的客户端在切换 locale 时重建链接。
export function stripLocale(pathname: string): string {
  for (const loc of PREFIXED_LOCALES) {
    const prefix = `/${loc}`;
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}
