import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "@/i18n/server";
import { localeHref, BCP47_LOCALE } from "@/i18n";
import { selfUrl, SITE_ORIGIN } from "@/lib/seo/canonical";
import { JsonLd } from "@/lib/seo/jsonLd";
import { PageContainer } from "@/components/PageContainer";
import { BlogBody } from "@/components/BlogBody";
import { EventBadge } from "@/components/EventBadge";
import { getPublishedBlogBySlug, blogAlternates, toBlogLocale } from "@/lib/blog/published";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bl = toBlogLocale(await getLocale());
  const post = await getPublishedBlogBySlug(slug, bl).catch(() => null);
  // 缺数据 → 走 Next not-found 边界 → 自动 noindex（Google 不收录）。
  // 注：loading.tsx 的 Suspense 流式使 HTTP 状态仍为 200（软 404），noindex 已消解 SEO 危害；要真 404 须移除全站 loading.tsx（牺牲加载骨架）。
  if (!post) notFound();
  return { title: post.title, description: post.excerpt, alternates: blogAlternates(`/blog/${slug}`, bl) };
}

export default async function BlogDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bl = toBlogLocale(await getLocale());
  const post = await getPublishedBlogBySlug(slug, bl).catch(() => null);
  if (!post) notFound();

  const url = selfUrl(`/blog/${slug}`, bl);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    inLanguage: BCP47_LOCALE[bl],
    url,
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    author: { "@id": `${SITE_ORIGIN}/#org` },
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    image: [`${SITE_ORIGIN}/og.png`], // B5：NewsArticle 富结果要求 image（站点社交图，真实资产）
    ...(post.publishedAt ? { datePublished: post.publishedAt } : {}),
    ...(post.updatedAt ? { dateModified: post.updatedAt } : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: bl === "zh" ? "首页" : "Home", item: selfUrl("/", bl) },
      { "@type": "ListItem", position: 2, name: bl === "zh" ? "事件解读" : "Blog", item: selfUrl("/blog", bl) },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <PageContainer tier="prose">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Link href={localeHref(bl, "/blog")} className="text-xs text-muted">
        {bl === "zh" ? "← 事件解读" : "← Blog"}
      </Link>
      <div className="mb-2 mt-3 flex items-center gap-2">
        <EventBadge type={post.eventType} locale={bl} />
        {post.publishedAt && (
          <time className="text-xs text-muted" dateTime={post.publishedAt}>
            {post.publishedAt.slice(0, 10)}
          </time>
        )}
        {post.updatedAt && post.updatedAt.slice(0, 10) !== post.publishedAt?.slice(0, 10) && (
          <time className="text-xs text-muted" dateTime={post.updatedAt}>
            {(bl === "zh" ? "更新于 " : "Updated ") + post.updatedAt.slice(0, 10)}
          </time>
        )}
      </div>
      <h1 className="font-head mb-4 text-2xl font-bold md:text-3xl">{post.title}</h1>
      <article>
        <BlogBody md={post.body} assets={post.assets} locale={bl} />
      </article>
    </PageContainer>
  );
}
