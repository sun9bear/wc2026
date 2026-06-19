import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { PageContainer } from "@/components/PageContainer";
import { Disclaimer } from "@/components/Disclaimer";
import { listPublishedBlog, blogAlternates, toBlogLocale, type BlogLocale } from "@/lib/blog/published";

export const dynamic = "force-dynamic"; // 读 published，随发布即时更新
export const maxDuration = 60;

const T: Record<BlogLocale, { title: string; desc: string; h1: string; intro: string; empty: string; back: string }> = {
  en: {
    title: "Event Commentary — World Cup 2026 Blog",
    desc: "Data-driven World Cup 2026 match commentary: how each result shifts every team's chances to advance and win the title.",
    h1: "Event Commentary",
    intro: "Match-by-match analysis powered by our probability model — what each result did to the teams' chances.",
    empty: "No articles yet — check back after the next matches.",
    back: "← Home",
  },
  zh: {
    title: "事件解读 —— 2026 世界杯",
    desc: "数据驱动的 2026 世界杯赛事解读：每场结果如何改变各队的出线与夺冠概率。",
    h1: "事件解读",
    intro: "用我们的概率模型逐场拆解——每个结果如何改变球队的出线与夺冠概率。",
    empty: "还没有文章——下一轮比赛后再来看。",
    back: "← 首页",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const bl = toBlogLocale(await getLocale());
  const c = T[bl];
  return { title: c.title, description: c.desc, alternates: blogAlternates("/blog", bl) };
}

export default async function BlogIndex() {
  const bl = toBlogLocale(await getLocale());
  const c = T[bl];
  const items = await listPublishedBlog(bl).catch(() => []);
  return (
    <PageContainer tier="prose">
      <Link href={localeHref(bl, "/")} className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mb-2 mt-3 text-2xl font-bold md:text-3xl">{c.h1}</h1>
      <p className="text-sm leading-relaxed text-muted md:text-base">{c.intro}</p>
      {items.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{c.empty}</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((it) => (
            <li key={it.slug}>
              <Link
                href={localeHref(bl, `/blog/${it.slug}`)}
                className="block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-green/50"
              >
                <h2 className="font-head text-base font-semibold md:text-lg">{it.title}</h2>
                {it.excerpt && <p className="mt-1 text-sm text-text/80">{it.excerpt}</p>}
                {it.publishedAt && (
                  <time className="mt-2 block text-xs text-muted" dateTime={it.publishedAt}>
                    {it.publishedAt.slice(0, 10)}
                  </time>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </PageContainer>
  );
}
