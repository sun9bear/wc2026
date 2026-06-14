import type { Metadata } from "next";
import type { Locale } from "@/i18n";
import { LOCALES, localeHref } from "@/i18n";

// 站点绝对根（与 layout.tsx metadataBase、生产 www 308 方向一致）。
export const SITE_ORIGIN = "https://www.wc2026.cool";

// locale → hreflang 码（语言级，§4①）。zh 用 zh-Hans，其余用语言码。x-default→en 根另加。
export const HREFLANG: Record<Locale, string> = {
  en: "en",
  zh: "zh-Hans",
  es: "es",
  pt: "pt",
  de: "de",
  fr: "fr",
};

// 给定裸路径 → reciprocal hreflang languages map（6 路 + x-default→en 根）。全站唯一构造点。
export function hreflangLanguages(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[HREFLANG[l]] = SITE_ORIGIN + localeHref(l, path);
  languages["x-default"] = SITE_ORIGIN + localeHref("en", path);
  return languages;
}

// 给定 locale-无关裸路径（如 "/forecast"，根用 "/"）与当前 locale，产出 Next Metadata 的 alternates：
//   - canonical：本 locale 的 self-canonical（各 locale 独立——en→根、zh→/zh、es→/es…）
//   - languages：6 路 reciprocal hreflang（en / zh-Hans / es / pt / de / fr / x-default→en 根）
// 全站唯一真理点，杜绝各页硬编码 host 字符串与漏写/写错 hreflang。
export function localizedAlternates(path: string, locale: Locale): Metadata["alternates"] {
  return {
    canonical: SITE_ORIGIN + localeHref(locale, path),
    languages: hreflangLanguages(path),
  };
}

// 本 locale 的绝对自指 URL（OG url、JSON-LD url/@id 等需与 canonical 一致时用）。
export function selfUrl(path: string, locale: Locale): string {
  return SITE_ORIGIN + localeHref(locale, path);
}
