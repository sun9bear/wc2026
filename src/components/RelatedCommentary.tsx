import Link from "next/link";
import { localeHref, type Locale } from "@/i18n";
import type { BlogListItem } from "@/lib/blog/published";

// P5：match/team 详情页的「相关事件解读」入口。纯展示——无数据则不渲染（fail-closed）。
// 文章仅 en/zh，标题已按 blogLocale 取好；链接沿用当前 locale 前缀（blog 详情页对 es/pt/de/fr 回落 en）。

const HEADING: Record<Locale, string> = {
  zh: "相关事件解读",
  en: "Related commentary",
  es: "Análisis relacionado",
  pt: "Análise relacionada",
  de: "Verwandte Analysen",
  fr: "Analyses liées",
};

export function RelatedCommentary({ items, locale }: { items: BlogListItem[]; locale: Locale }) {
  if (!items.length) return null;
  return (
    <section className="mt-6">
      <h2 className="font-head mb-2 text-sm font-semibold md:text-base">{HEADING[locale] ?? HEADING.en}</h2>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.slug}>
            <Link
              href={localeHref(locale, `/blog/${it.slug}`)}
              className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-green/50"
            >
              <span className="text-sm font-medium md:text-base">{it.title}</span>
              {it.excerpt && <span className="mt-0.5 block text-xs text-muted">{it.excerpt}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
