import { NextRequest, NextResponse, after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePlayerBlurbZh, generatePlayerBlurbEn } from "@/lib/players/blurb";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AI 球员短评生成（安全版，不进排名分）。受 CRON_SECRET 保护（三写法）。
// 缺任一语种即处理、最久未尝试优先；并发 CONCURRENCY。
// 用 after() 立即回 200 + 后台生成：cron-job.org 免费档客户端 30s 硬超时，而单条 AI 调用最长 ~15s，
// force 全量重生整轮可能超 30s；故 auth 后即返回，生成在响应后台跑满 maxDuration(60s)，cron 端永不超时。
// 仅更新 ai_* 列，不动 buzz 列（与 player-buzz cron 互不覆盖）。?force=1 全量重生。
const CONCURRENCY = 6;

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

  const force = new URL(req.url).searchParams.get("force") === "1";

  after(async () => {
    const [{ data: pData }, { data: mData }] = await Promise.all([
      db.from("players").select("id, name, team_name, position").eq("is_active", true),
      db.from("player_metrics").select("player_id, ai_blurb, ai_blurb_en, ai_updated_at"),
    ]);
    const players =
      (pData as { id: string; name: string; team_name: string; position: string | null }[] | null) ?? [];
    const have = new Map(
      (
        (mData as
          | { player_id: string; ai_blurb: string | null; ai_blurb_en: string | null; ai_updated_at: string | null }[]
          | null) ?? []
      ).map((m) => [m.player_id, m] as const)
    );
    const staleAt = (id: string) => {
      const m = have.get(id);
      return m?.ai_updated_at ? Date.parse(m.ai_updated_at) : 0;
    };

    // 缺任一语种即需处理；最久未尝试优先（轮转，不卡在前几名）。
    const todo = players
      .filter((p) => {
        if (force) return true;
        const m = have.get(p.id);
        return !m?.ai_blurb || !m?.ai_blurb_en;
      })
      .sort((a, b) => staleAt(a.id) - staleAt(b.id));

    const now = new Date().toISOString();
    const deadline = Date.now() + 50_000; // 后台跑，留足 maxDuration(60s) 余量
    let idx = 0;
    async function worker(): Promise<void> {
      while (idx < todo.length && Date.now() < deadline) {
        const p = todo[idx++];
        const [zh, en] = await Promise.all([
          generatePlayerBlurbZh(p.name, p.team_name, p.position ?? ""),
          generatePlayerBlurbEn(p.name, p.team_name, p.position ?? ""),
        ]);
        if (!zh && !en) continue;
        const patch: Record<string, unknown> = { player_id: p.id, ai_updated_at: now };
        if (zh) patch.ai_blurb = zh;
        if (en) patch.ai_blurb_en = en;
        await db.from("player_metrics").upsert(patch, { onConflict: "player_id" });
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  });

  // 立即返回：生成已在 after() 后台排队，cron-job.org 拿到秒级成功。
  return NextResponse.json({ ok: true, queued: true });
}
