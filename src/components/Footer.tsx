import Link from "next/link";
import { getDict, localeHref, type Locale } from "@/i18n";
import { LangToggle } from "@/components/LangToggle";

// blog「事件解读」频道入口（六语内联标签；给每页一条到 /blog 的入站爬取路径）。
const BLOG_LABEL: Record<Locale, string> = {
  zh: "事件解读",
  en: "Blog",
  es: "Análisis",
  pt: "Análise",
  de: "Analysen",
  fr: "Analyses",
};

// 全站页脚：合规链接 + 语言切换 + 中性声明（AdSense 审核与用户都会找这些）。
export function Footer({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  return (
    <footer className="mx-auto w-full max-w-5xl px-4 pb-8 pt-12 text-center text-[11px] leading-relaxed text-muted md:text-xs">
      <nav className="mb-3 flex flex-wrap items-center justify-center gap-3">
        <Link href={localeHref(locale, "/blog")} className="transition-colors hover:text-text">
          {BLOG_LABEL[locale] ?? BLOG_LABEL.en}
        </Link>
        <span className="opacity-40">·</span>
        <Link href={localeHref(locale, "/calculator")} className="transition-colors hover:text-text">
          {t.footer.calculator}
        </Link>
        <span className="opacity-40">·</span>
        <Link href={localeHref(locale, "/watch")} className="transition-colors hover:text-text">
          {t.footer.watch}
        </Link>
        <span className="opacity-40">·</span>
        <Link href={localeHref(locale, "/about")} className="transition-colors hover:text-text">
          {t.footer.about}
        </Link>
        <span className="opacity-40">·</span>
        <Link href={localeHref(locale, "/privacy")} className="transition-colors hover:text-text">
          {t.footer.privacy}
        </Link>
        <span className="opacity-40">·</span>
        <Link href={localeHref(locale, "/disclaimer")} className="transition-colors hover:text-text">
          {t.footer.terms}
        </Link>
      </nav>
      <div className="mb-3 flex justify-center">
        <LangToggle locale={locale} label={t.langLabel} />
      </div>
      <p>{t.footer.note}</p>
    </footer>
  );
}
