import type { Metadata } from "next";
import type { Locale } from "@/i18n";
import { localeHref } from "@/i18n";

// 站点绝对根（与 layout.tsx metadataBase、生产 www 308 方向一致）。
export const SITE_ORIGIN = "https://www.wc2026.cool";

// 给定 locale-无关裸路径（如 "/forecast"，根用 "/"）与当前 locale，产出 Next Metadata 的 alternates：
//   - canonical：本 locale 的 self-canonical（各 locale 独立——en→根 URL、zh→/zh URL）
//   - languages：reciprocal hreflang —— en / zh-Hans / x-default(→en 根)
// 全站唯一真理点，杜绝各页硬编码 host 字符串与漏写/写错 hreflang。
export function localizedAlternates(path: string, locale: Locale): Metadata["alternates"] {
  const enUrl = SITE_ORIGIN + localeHref("en", path);
  const zhUrl = SITE_ORIGIN + localeHref("zh", path);
  return {
    canonical: locale === "zh" ? zhUrl : enUrl,
    languages: {
      en: enUrl,
      "zh-Hans": zhUrl,
      "x-default": enUrl,
    },
  };
}

// 本 locale 的绝对自指 URL（OG url、JSON-LD url/@id 等需与 canonical 一致时用）。
export function selfUrl(path: string, locale: Locale): string {
  return SITE_ORIGIN + localeHref(locale, path);
}
