import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase/client";

const BASE = "https://www.wc2026.cool";

// 站点地图：静态页 + 全部比赛详情页（库读失败则只回静态页，绝不让 sitemap 报错）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/combo`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/leaderboard`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/watch`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/disclaimer`, changeFrequency: "monthly", priority: 0.3 },
  ];
  try {
    const { data } = await supabase.from("matches").select("id").order("kickoff_at");
    const matches = (((data as { id: string }[] | null) ?? [])).map((m) => ({
      url: `${BASE}/match/${m.id}`,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    }));
    return [...statics, ...matches];
  } catch {
    return statics;
  }
}
