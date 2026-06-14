// Locale 配置（纯叶子模块：无 next/headers、无文案字典依赖 → 中间件 proxy.ts 可安全引入，不撑大 edge 包）。
// 全站 locale 的【单一真理源】。扩语种 = 在这里加 + 补各页文案；路由/链接逻辑遍历本配置，无需再硬编码。
export type Locale = "zh" | "en";

// 默认 locale = 根路径（无前缀）。x-default / canonical 兜底方向。
export const DEFAULT_LOCALE: Locale = "en";

// 全部受支持 locale（含默认）。运行时校验来源。
export const LOCALES: readonly Locale[] = ["en", "zh"];

// 带 URL 前缀的 locale（DEFAULT_LOCALE 留根、无前缀）。
// P2-2：未来激活 es/pt/de/fr 时加进此数组 + Locale 类型 + proxy matcher + 文案，
// localeHref/stripLocale/getLocale/proxy 会自动生效（无需再改路由逻辑）。
export const PREFIXED_LOCALES: readonly Locale[] = ["zh"];

// 运行时类型守卫：把不可信字符串（请求头 / cookie / URL 段）收窄为 Locale。
export function isLocale(v: string | null | undefined): v is Locale {
  return v != null && (LOCALES as readonly string[]).includes(v);
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
