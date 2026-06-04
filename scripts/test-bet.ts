/**
 * 端到端验证下注流程：匿名登录 → POST /api/bet → 读回选项池/倍率变化。
 * 需 dev server 在 localhost:3000 运行。运行：npx tsx scripts/test-bet.ts
 */
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

async function waitForServer(url: string, tries = 30): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok || r.status === 404) return;
    } catch {
      /* not ready */
    }
    await new Promise((res) => setTimeout(res, 1500));
  }
  throw new Error("dev server 未就绪");
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(url, anon);

  console.log("等待 dev server…");
  await waitForServer("http://localhost:3000/");

  const { data: sels } = await sb
    .from("selections")
    .select("id, label, pooled_stake, current_multiplier")
    .limit(1);
  const sel = sels?.[0] as
    | { id: string; label: string; pooled_stake: number; current_multiplier: number }
    | undefined;
  if (!sel) throw new Error("没有选项数据（先跑 seed-markets）");
  console.log("下注前选项:", sel);

  const { data: auth, error: ae } = await sb.auth.signInAnonymously();
  if (ae) throw ae;
  console.log("匿名登录 OK, user:", auth.user?.id);

  const res = await fetch("http://localhost:3000/api/bet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.session?.access_token}`,
    },
    body: JSON.stringify({ selectionId: sel.id, stake: 200 }),
  });
  const json = await res.json();
  console.log("下注响应:", res.status, json);

  const { data: after } = await sb
    .from("selections")
    .select("id, pooled_stake, current_multiplier")
    .eq("id", sel.id)
    .single();
  console.log("下注后该选项:", after);
}

main().catch((e) => {
  console.error("✗ 失败:", e?.message ?? e);
  process.exit(1);
});
