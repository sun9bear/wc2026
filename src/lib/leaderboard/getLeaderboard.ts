import { getServerSupabase } from "@/lib/supabase/server";
import { rankTier } from "@/lib/ranks/rankTier";
import { defaultName } from "@/lib/identity/defaultName";

export interface LeaderRow {
  rank: number;
  name: string;
  points: number;
  tierCode: string;
  tierLabel: string;
}

interface ProfileRow {
  user_id: string;
  nickname: string | null;
  points_balance: number;
}

// 服务端读取（service_role 绕过 RLS），按积分降序排名。
// locale 决定无昵称用户的趣味默认名语言——英文访客/Googlebot 必须拿英文名（不能漏中文到可索引页）。
export async function getLeaderboard(locale: "zh" | "en", limit = 50): Promise<LeaderRow[]> {
  const { data } = await getServerSupabase()
    .from("profiles")
    .select("user_id, nickname, points_balance")
    .order("points_balance", { ascending: false })
    .limit(limit);

  const rows = (data as ProfileRow[] | null) ?? [];
  return rows.map((r, i) => {
    const t = rankTier(Number(r.points_balance));
    return {
      rank: i + 1,
      name: r.nickname ?? defaultName(r.user_id, locale),
      points: Number(r.points_balance),
      tierCode: t.code,
      tierLabel: t.label,
    };
  });
}
