import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { teamSlug } from "@/lib/prob/findTeam";
import { getSettledIndex } from "@/lib/seo/freshness";
import { LOCALES, localeHref } from "@/i18n";
import { hreflangLanguages } from "@/lib/seo/canonical";

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

// 站点地图：静态页 + 全部比赛/球队详情页，每页双 locale。
// 库读失败则只回静态页（仍含双 locale + hreflang），绝不让 sitemap 报错（CodeX 外审 fail-closed）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticBase: Entry[] = [
    { path: "/", changeFrequency: "hourly", priority: 1 },
    { path: "/combo", changeFrequency: "hourly", priority: 0.9 },
    { path: "/leaderboard", changeFrequency: "hourly", priority: 0.8 },
    { path: "/watch", changeFrequency: "weekly", priority: 0.7 },
    { path: "/forecast", changeFrequency: "hourly", priority: 0.9 },
    { path: "/forecast/best-thirds", changeFrequency: "hourly", priority: 0.85 },
    { path: "/calculator", changeFrequency: "daily", priority: 0.85 },
    { path: "/rules", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-06-14" },
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
      if (e.path === "/" || e.path === "/forecast" || e.path === "/forecast/best-thirds") {
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
    return expand([...statics, ...teams, ...matches]);
  } catch {
    return expand(staticBase);
  }
}
