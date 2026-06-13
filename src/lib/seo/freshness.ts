import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/client";

// SEO 新鲜度信号 —— 仅从持久、真实的 matches.settled_at 派生（赛果落库 = 真实内容变化）。
// 经 CodeX 外审：不要用 matches/teams.updated_at（无此列）、不要用 getForecast().updatedAt
// （= new Date()，伪新鲜），sitemap 无状态也无处"保留上次值"。此处用 max(settled_at) 解决，
// 零 DDL、不触发概率管线。供 sitemap lastModified、页面可见"最新赛果"、JSON-LD dateModified 共用。

export type SettledIndex = {
  all: string | null; // 全站最近一场结算时间
  byTeam: Record<string, string | null>; // teamId -> 该队最近结算时间
  byGroup: Record<string, string | null>; // 组字母 A-L -> 该组最近结算时间
  byMatch: Record<string, string | null>; // matchId -> 该场 settled_at（未结算为 null）
};

const maxIso = (a: string | null, b: string | null): string | null =>
  !a ? b : !b ? a : a >= b ? a : b;

type MatchRow = {
  id: string;
  settled_at: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
};

async function computeSettledIndex(): Promise<SettledIndex> {
  const idx: SettledIndex = { all: null, byTeam: {}, byGroup: {}, byMatch: {} };
  const [{ data: matchData }, { data: teamData }] = await Promise.all([
    supabase.from("matches").select("id, settled_at, home_team_id, away_team_id"),
    supabase.from("teams").select("id, grp"),
  ]);
  // teams.grp 形如 "A 组" —— 统一用 /[A-L]/ 提取裸字母（与 findTeam/sitemap 一致）。
  const grpOf = new Map<string, string>();
  for (const t of (teamData as { id: string; grp: string | null }[] | null) ?? []) {
    const letter = (t.grp ?? "").match(/[A-L]/)?.[0];
    if (letter) grpOf.set(t.id, letter);
  }
  for (const m of (matchData as MatchRow[] | null) ?? []) {
    const s = m.settled_at ?? null;
    idx.byMatch[m.id] = s;
    if (!s) continue;
    idx.all = maxIso(idx.all, s);
    for (const tid of [m.home_team_id, m.away_team_id]) {
      if (!tid) continue;
      idx.byTeam[tid] = maxIso(idx.byTeam[tid] ?? null, s);
    }
    // byGroup 仅在「组赛」（同组两队对阵）时更新——淘汰赛涉及组内球队但不改组内积分榜/出线情景
    // （CodeX 外审 MAJOR）。组赛两队同组 → hg===ag；淘汰赛跨组 → 跳过，不误标该组页"最新赛果"。
    const hg = m.home_team_id ? grpOf.get(m.home_team_id) : undefined;
    const ag = m.away_team_id ? grpOf.get(m.away_team_id) : undefined;
    if (hg && ag && hg === ag) idx.byGroup[hg] = maxIso(idx.byGroup[hg] ?? null, s);
  }
  return idx;
}

// CodeX round-2 修正：unstable_cache 必须带 revalidate + tag，否则 Next 永久缓存导致首读后失鲜。
export const getSettledIndex = unstable_cache(computeSettledIndex, ["seo-settled-index-v1"], {
  revalidate: 600,
  tags: ["seo-freshness"],
});
