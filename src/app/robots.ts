import type { MetadataRoute } from "next";

// 爬虫规则：放行内容页，屏蔽 API 与个人页（无 SEO 价值）。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/me"] }],
    sitemap: "https://www.wc2026.cool/sitemap.xml",
  };
}
