import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchPageviews } from "@/lib/players/buzz";
import { getScorers } from "@/lib/football/getScorers";
import { normalizeName } from "@/lib/players/perfScore";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// 射手名 → slug（ASCII kebab，去重音/标点）。
function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// 热度同步：每 ~12h 抓各候选维基 pageviews 近 7 日合计 → player_metrics.buzz_raw。
// 受 CRON_SECRET 保护（与 cron/settle 同三写法）。外部 cron-job.org 调用即可。
// 软降级：单条抓不到记 0，不影响整体；仅更新 buzz_* 列，不动 ai_blurb 列。
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET 未配置" }, { status: 500 });
  const bearer = req.headers.get("authorization") === `Bearer ${secret}`;
  const plain =
    req.headers.get("cron_secret") === secret || req.headers.get("x-cron-secret") === secret;
  if (!bearer && !plain) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SECRET_KEY;
  if (!url || !sk) return NextResponse.json({ error: "服务未配置" }, { status: 500 });
  const db = createClient(url, sk, { auth: { persistSession: false } });

  // 射手自动补充：射手榜中不在候选的球员入库（source='scorers'，按归一化名去重；让名单跟着赛事走）。
  let supplemented = 0;
  try {
    const scorers = await getScorers();
    if (scorers.length) {
      const { data: existing } = await db.from("players").select("name");
      const have = new Set(
        ((existing as { name: string }[] | null) ?? []).map((e) => normalizeName(e.name))
      );
      for (const s of scorers) {
        const key = normalizeName(s.playerName);
        // 仅补充进球 ≥3 的标杆射手（金靴竞争者=球迷话题人物）；避免冷门角色球员涌入稀释榜单。
        if (!key || have.has(key) || (s.goals ?? 0) < 3) continue;
        const { error } = await db.from("players").upsert(
          { slug: slugify(s.playerName), name: s.playerName, team_name: s.teamName, source: "scorers", is_active: true },
          { onConflict: "slug", ignoreDuplicates: true }
        );
        if (!error) {
          have.add(key);
          supplemented++;
        }
      }
    }
  } catch {
    /* 射手补充失败不影响热度同步 */
  }

  const [{ data: pData }, { data: mData }] = await Promise.all([
    db.from("players").select("id, wiki_title").eq("is_active", true),
    db.from("player_metrics").select("player_id, buzz_updated_at"),
  ]);
  const players = (pData as { id: string; wiki_title: string | null }[] | null) ?? [];
  // 「最久未更新优先」：从未抓到(无时间戳)排最前，保证尾部球员也能轮到（解决全量超时下的覆盖盲区）。
  const staleAt = new Map(
    ((mData as { player_id: string; buzz_updated_at: string | null }[] | null) ?? []).map(
      (m) => [m.player_id, m.buzz_updated_at ? Date.parse(m.buzz_updated_at) : 0] as const
    )
  );
  const ordered = [...players].sort((a, b) => (staleAt.get(a.id) ?? 0) - (staleAt.get(b.id) ?? 0));

  const now = new Date().toISOString();
  const deadline = Date.now() + 45_000; // 留足 maxDuration(60s) 余量，杜绝 504 超时
  let updated = 0;
  for (const p of ordered) {
    if (Date.now() > deadline) break;
    if (!p.wiki_title) continue;
    const views = await fetchPageviews(p.wiki_title);
    // views=0 多为抓取失败/429 → 跳过，保留上次好值（绝不把已有热度清成 0）。
    if (views > 0) {
      const { error } = await db
        .from("player_metrics")
        .upsert(
          { player_id: p.id, buzz_raw: views, buzz_updated_at: now },
          { onConflict: "player_id" }
        );
      if (!error) updated++;
    }
    await new Promise((r) => setTimeout(r, 150)); // 节流，避免 wikimedia 突发 429
  }

  return NextResponse.json({ ok: true, supplemented, updated, total: players.length });
}
