import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { teamSlug } from "@/lib/prob/findTeam";
import { getSettledIndex } from "@/lib/seo/freshness";
import { LOCALES, localeHref } from "@/i18n";
import { hreflangLanguages } from "@/lib/seo/canonical";
import { PLAYERS } from "@/data/players.seed";

const BASE = "https://www.wc2026.cool";
const LEGAL_LASTMOD = "2026-06-13"; // 法务/静态页内容最后修订（真实旧固定日期，与赛事新鲜页对比）

// 逻辑页（locale-无关裸路径），lastModified 仅从真实 settled_at 派生（getSettledIndex）。
type Entry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  lastModified?: string;
};

// 每个逻辑页展开成 6 条 URL（en 根 + zh/es/pt/de/fr 前缀），互带 6 路 reciprocal hreflang。
// Next 会把 alternates.languages 序列化为 <xhtml:link rel="alternate" hreflang=...>。
function expand(entries: Entry[]): MetadataRoute.Sitemap {
  const out: MetadataRoute.Sitemap = [];
  for (const e of entries) {
    const common = {
      changeFrequency: e.changeFrequency,
      priority: e.priority,
      ...(e.lastModified ? { lastModified: e.lastModified } : {}),
      alternates: { languages: hreflangLanguages(e.path) },
    };
    for (const l of LOCALES) {
      out.push({ url: BASE + localeHref(l, e.path), ...common });
    }
  }
  return out;
}

// blog 仅 en/zh：单独构建（不走 expand 的 6 语展开），hreflang 只吐 en + zh-Hans + x-default（fail-closed）。
async function blogSitemap(): Promise<MetadataRoute.Sitemap> {
  const langs = (path: string) => ({
    en: BASE + localeHref("en", path),
    "zh-Hans": BASE + localeHref("zh", path),
    "x-default": BASE + localeHref("en", path),
  });
  const out: MetadataRoute.Sitemap = [];
  for (const l of ["en", "zh"] as const) {
    out.push({
      url: BASE + localeHref(l, "/blog"),
      changeFrequency: "daily",
      priority: 0.7,
      alternates: { languages: langs("/blog") },
    });
  }
  try {
    const { data } = await supabase
      .from("blog_entries")
      .select("slug_en, updated_at, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);
    for (const r of (data as { slug_en: string; updated_at: string | null; published_at: string | null }[] | null) ?? []) {
      const path = `/blog/${r.slug_en}`;
      const lastModified = r.updated_at ?? r.published_at ?? undefined;
      for (const l of ["en", "zh"] as const) {
        out.push({
          url: BASE + localeHref(l, path),
          changeFrequency: "weekly",
          priority: 0.6,
          ...(lastModified ? { lastModified } : {}),
          alternates: { languages: langs(path) },
        });
      }
    }
  } catch {
    /* fail-soft：库读失败仍保留 /blog 索引页 */
  }
  return out;
}

// 站点地图：静态页 + 全部比赛/球队详情页，每页双 locale。
// 库读失败则只回静态页（仍含双 locale + hreflang），绝不让 sitemap 报错（CodeX 外审 fail-closed）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blog = await blogSitemap(); // blog 自带 fail-soft，单独构建（en/zh）
  const staticBase: Entry[] = [
    { path: "/", changeFrequency: "hourly", priority: 1 },
    { path: "/combo", changeFrequency: "hourly", priority: 0.9 },
    { path: "/leaderboard", changeFrequency: "hourly", priority: 0.8 },
    { path: "/watch", changeFrequency: "weekly", priority: 0.7 },
    { path: "/forecast", changeFrequency: "hourly", priority: 0.9 },
    { path: "/forecast/best-thirds", changeFrequency: "hourly", priority: 0.85 },
    { path: "/scorers", changeFrequency: "hourly", priority: 0.8 },
    { path: "/popularity", changeFrequency: "daily", priority: 0.7 },
    // 球员详情着陆页（41 名策展球星 × 6 语）
    ...PLAYERS.map((p) => ({
      path: `/player/${p.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    { path: "/calculator", changeFrequency: "daily", priority: 0.85 },
    { path: "/rules", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-06-14" },
    { path: "/methodology", changeFrequency: "monthly", priority: 0.6, lastModified: "2026-06-19" },
    // 12 个按组着陆页（脉冲式搜索："Group A who advances" / "X 组出线形势"）
    ..."abcdefghijkl".split("").map((letter) => ({
      path: `/calculator/group/${letter}`,
      changeFrequency: "hourly" as const,
      priority: 0.85,
    })),
    { path: "/about", changeFrequency: "monthly", priority: 0.5, lastModified: LEGAL_LASTMOD },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.3, lastModified: LEGAL_LASTMOD },
    { path: "/disclaimer", changeFrequency: "monthly", priority: 0.3, lastModified: LEGAL_LASTMOD },
  ];
  try {
    const idx = await getSettledIndex();
    const { data: teamData } = await supabase.from("teams").select("id, name, grp");
    // 静态页注入真实 lastModified：home/forecast=全站最近结算；group=该组最近结算（无则不带）。
    const statics: Entry[] = staticBase.map((e) => {
      if (
        e.path === "/" ||
        e.path === "/forecast" ||
        e.path === "/forecast/best-thirds" ||
        e.path === "/calculator"
      ) {
        return idx.all ? { ...e, lastModified: idx.all } : e;
      }
      const gm = e.path.match(/^\/calculator\/group\/([a-l])$/);
      if (gm) {
        const last = idx.byGroup[gm[1].toUpperCase()];
        return last ? { ...e, lastModified: last } : e;
      }
      return e;
    });
    // 48 个球队详情着陆页。只收 A-L 组（与 findTeam 对齐，避免 404）。lastModified=该队最近结算。
    const teams: Entry[] = (
      (teamData as { id: string; name: string; grp: string | null }[] | null) ?? []
    )
      .filter((t) => /[A-L]/.test(t.grp ?? ""))
      .map((t) => {
        const last = idx.byTeam[t.id];
        return {
          path: `/team/${teamSlug(t.name)}`,
          changeFrequency: "hourly" as const,
          priority: 0.75,
          ...(last ? { lastModified: last } : {}),
        };
      });
    // 全部比赛详情页。lastModified=该场 settled_at（未结算省略，不伪造）。
    const matches: Entry[] = Object.entries(idx.byMatch).map(([id, settled]) => ({
      path: `/match/${id}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
      ...(settled ? { lastModified: settled } : {}),
    }));
    return [...expand([...statics, ...teams, ...matches]), ...blog];
  } catch {
    return [...expand(staticBase), ...blog];
  }
}
