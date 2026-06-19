import type { MetadataRoute } from "next";

// 爬虫规则：放行内容页，屏蔽 API、个人页与管理后台（无 SEO 价值/内部页）。
// disallow 覆盖各 locale 的 /me 与 /admin（前缀不匹配 /es/me 等），避免薄/内部页耗抓取、被引用。
const DISALLOW = [
  "/api/",
  "/me", "/zh/me", "/es/me", "/pt/me", "/de/me", "/fr/me",
  "/admin", "/zh/admin", "/es/admin", "/pt/admin", "/de/admin", "/fr/admin",
];

// GEO：显式欢迎主流 LLM 爬虫（日志显示 ClaudeBot+ChatGPT-User 占抓取大头）。
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_BOTS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: "https://www.wc2026.cool/sitemap.xml",
  };
}
