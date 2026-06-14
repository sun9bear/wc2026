import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { teamSlug } from "@/lib/prob/findTeam";
import { getSettledIndex } from "@/lib/seo/freshness";

const BASE = "https://www.wc2026.cool";
const LEGAL_LASTMOD = "2026-06-13"; // 法务/静态页内容最后修订（真实旧固定日期，与赛事新鲜页对比）

// 站点地图：静态页 + 全部比赛/球队详情页。
// lastModified 仅从真实的 matches.settled_at 派生（getSettledIndex）——不调概率管线、不伪造时间
// （经 CodeX 外审：避免 lastmod=now 的全站信任侵蚀）。库读失败则只回静态页，绝不让 sitemap 报错。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticBase: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/combo`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/watch`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/forecast`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/forecast/best-thirds`, changeFrequency: "hourly", priority: 0.85 },
    { url: `${BASE}/calculator`, changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE}/rules`, changeFrequency: "monthly", priority: 0.8, lastModified: "2026-06-14" },
    // 12 个按组着陆页（脉冲式搜索："Group A who advances" / "X 组出线形势"）
    ..."abcdefghijkl".split("").map((letter) => ({
      url: `${BASE}/calculator/group/${letter}`,
      changeFrequency: "hourly" as const,
      priority: 0.85,
    })),
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5, lastModified: LEGAL_LASTMOD },
    { url: `${BASE}/privacy`, changeFrequency: "monthly", priority: 0.3, lastModified: LEGAL_LASTMOD },
    { url: `${BASE}/disclaimer`, changeFrequency: "monthly", priority: 0.3, lastModified: LEGAL_LASTMOD },
  ];
  try {
    const idx = await getSettledIndex();
    const { data: teamData } = await supabase.from("teams").select("id, name, grp");
    // 静态页注入真实 lastModified：home/forecast=全站最近结算；group=该组最近结算（无则不带）。
    const statics: MetadataRoute.Sitemap = staticBase.map((e) => {
      if (
        e.url === `${BASE}/` ||
        e.url === `${BASE}/forecast` ||
        e.url === `${BASE}/forecast/best-thirds`
      ) {
        return idx.all ? { ...e, lastModified: idx.all } : e;
      }
      const gm = e.url.match(/\/calculator\/group\/([a-l])$/);
      if (gm) {
        const last = idx.byGroup[gm[1].toUpperCase()];
        return last ? { ...e, lastModified: last } : e;
      }
      return e;
    });
    // 48 个球队详情着陆页。只收 A-L 组（与 findTeam 对齐，避免 404）。lastModified=该队最近结算。
    const teams: MetadataRoute.Sitemap = (
      (teamData as { id: string; name: string; grp: string | null }[] | null) ?? []
    )
      .filter((t) => /[A-L]/.test(t.grp ?? ""))
      .map((t) => {
        const last = idx.byTeam[t.id];
        return {
          url: `${BASE}/team/${teamSlug(t.name)}`,
          changeFrequency: "hourly" as const,
          priority: 0.75,
          ...(last ? { lastModified: last } : {}),
        };
      });
    // 全部比赛详情页。lastModified=该场 settled_at（未结算省略，不伪造）。
    const matches: MetadataRoute.Sitemap = Object.entries(idx.byMatch).map(([id, settled]) => ({
      url: `${BASE}/match/${id}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
      ...(settled ? { lastModified: settled } : {}),
    }));
    return [...statics, ...teams, ...matches];
  } catch {
    return staticBase;
  }
}
