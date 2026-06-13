import { getServerSupabase } from "@/lib/supabase/server";
import { defaultName } from "@/lib/identity/defaultName";

// 擂台榜单查询（任务 5）：service key 服务端读取，客户端绝不直读 leagues/league_members。
// 供 /league/[code] 页面（服务端直调）与 GET /api/league/[code] 共用。

export interface LeagueMember {
  nickname: string;
  points: number;
  won: number;
  total: number;
  hitRate: number;
  isOwner: boolean;
}

export interface LeagueBoard {
  code: string;
  name: string;
  createdAt: string;
  members: LeagueMember[];
}

const MEMBER_CAP = 200;

export async function getLeagueBoard(
  code: string,
  locale: "zh" | "en" = "zh"
): Promise<LeagueBoard | null> {
  const db = getServerSupabase();

  const { data: lgRow } = await db
    .from("leagues")
    .select("id, code, name, owner_id, created_at")
    .eq("code", code)
    .maybeSingle();
  const lg = lgRow as {
    id: string;
    code: string;
    name: string;
    owner_id: string;
    created_at: string;
  } | null;
  if (!lg) return null;

  const { data: memRows } = await db
    .from("league_members")
    .select("user_id")
    .eq("league_id", lg.id)
    .order("joined_at", { ascending: true })
    .limit(MEMBER_CAP);
  const userIds = ((memRows as { user_id: string }[] | null) ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return { code: lg.code, name: lg.name, createdAt: lg.created_at, members: [] };

  const { data: profRows } = await db
    .from("profiles")
    .select("user_id, nickname, points_balance")
    .in("user_id", userIds);
  const profs = new Map(
    ((profRows as { user_id: string; nickname: string | null; points_balance: number }[] | null) ?? []).map(
      (p) => [p.user_id, p]
    )
  );

  const { data: betRows } = await db
    .from("bets")
    .select("user_id, status")
    .in("user_id", userIds)
    .in("status", ["won", "lost"]);
  const agg = new Map<string, { won: number; total: number }>();
  for (const b of (betRows as { user_id: string; status: string }[] | null) ?? []) {
    const a = agg.get(b.user_id) ?? { won: 0, total: 0 };
    a.total++;
    if (b.status === "won") a.won++;
    agg.set(b.user_id, a);
  }

  const members: LeagueMember[] = userIds
    .map((uid) => {
      const p = profs.get(uid);
      const a = agg.get(uid) ?? { won: 0, total: 0 };
      return {
        nickname: p?.nickname || defaultName(uid, locale),
        points: Number(p?.points_balance ?? 0),
        won: a.won,
        total: a.total,
        hitRate: a.total > 0 ? Math.round((a.won / a.total) * 100) : 0,
        isOwner: uid === lg.owner_id,
      };
    })
    .sort((x, y) => y.points - x.points);

  return { code: lg.code, name: lg.name, createdAt: lg.created_at, members };
}
