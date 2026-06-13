import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";
import { teamSlug } from "@/lib/prob/findTeam";

const BASE = "https://www.wc2026.cool";

// 站点地图：静态页 + 全部比赛详情页（库读失败则只回静态页，绝不让 sitemap 报错）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/combo`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/watch`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/forecast`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/calculator`, changeFrequency: "daily", priority: 0.85 },
    // 12 个按组着陆页（脉冲式搜索："Group A who advances" / "X 组出线形势"）
    ..."abcdefghijkl".split("").map((letter) => ({
      url: `${BASE}/calculator/group/${letter}`,
      changeFrequency: "hourly" as const,
      priority: 0.85,
    })),
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, changeFrequency: "monthly", priority: 0.3 },
  ];
  try {
    const [{ data: matchData }, { data: teamData }] = await Promise.all([
      supabase.from("matches").select("id").order("kickoff_at"),
      supabase.from("teams").select("name, grp"),
    ]);
    const matches = (((matchData as { id: string }[] | null) ?? [])).map((m) => ({
      url: `${BASE}/match/${m.id}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    }));
    // 48 个球队详情着陆页（强 SEO：「<队名> world cup chances」类长尾）。
    // 只收有 A-L 组的队——与 findTeam 可解析集合对齐，避免 sitemap 出 404（占位/附加赛 TBD 行）。
    const teams = (((teamData as { name: string; grp: string | null }[] | null) ?? []))
      .filter((t) => /[A-L]/.test(t.grp ?? ""))
      .map((t) => ({
        url: `${BASE}/team/${teamSlug(t.name)}`,
        changeFrequency: "hourly" as const,
        priority: 0.75,
      }));
    return [...statics, ...teams, ...matches];
  } catch {
    return statics;
  }
}
