/**
 * 倍率池冷启动灌注：用 The Odds API 多机构共识概率给每场未开赛比赛的
 * 三个选项灌虚拟底注，使初始倍率 ≈ 1/p（呈现 1.5/3.8/6.2 的有信息分布），
 * 替代零参与时千篇一律的 3.00。
 *
 * 数学：池式公式 multiplier=(T+kN)/(S_i+k)（k=100,N=3）。取每场总底注 T=2000，
 * 则 S_i = p_i·(T+kN) − k = p_i·2300 − 100（负值截 0），倍率恰为 1/p_i。
 * T≈2000 ≈ 20-40 笔真实预测的量级——真实参与几十笔内即可显著拉动倍率，
 * 种子不会淹没社区信号（SentimentBar 口径已标注"社区与模型综合"）。
 *
 * 只动未开赛场次；派分按 multiplier_at_bet 记录，种子不影响已有结算。
 * 运行：npx tsx scripts/seed-pools.ts
 */
import { createClient } from "@supabase/supabase-js";
import { devigBook, consensus } from "../src/lib/prob/devig";
import { normalizeTeamName } from "../src/lib/prob/names";

process.loadEnvFile(".env.local");

const K = 100;
const N = 3;
const T = 2000;

interface OddsEvent {
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: { markets: { key: string; outcomes: { name: string; price: number }[] }[] }[];
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sk = process.env.SUPABASE_SECRET_KEY;
  const oddsKey = process.env.THE_ODDS_API_KEY;
  if (!url || !sk || !oddsKey) throw new Error("缺少环境变量（检查 .env.local）");
  const sb = createClient(url, sk);

  // 1) 市场共识概率索引
  const r = await fetch(
    `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds/?apiKey=${oddsKey}&regions=eu&markets=h2h&oddsFormat=decimal`
  );
  if (!r.ok) throw new Error(`odds api ${r.status}`);
  const events = (await r.json()) as OddsEvent[];
  const probIdx = new Map<string, { home: number; draw: number; away: number }>();
  for (const e of events) {
    const prices: { home: number; draw: number; away: number }[] = [];
    for (const b of e.bookmakers ?? []) {
      const m = b.markets?.find((x) => x.key === "h2h");
      if (!m) continue;
      let home = 0,
        draw = 0,
        away = 0;
      for (const o of m.outcomes ?? []) {
        if (o.name === e.home_team) home = o.price;
        else if (o.name === e.away_team) away = o.price;
        else draw = o.price;
      }
      if (devigBook(home, draw, away)) prices.push({ home, draw, away });
    }
    const { p, books } = consensus(prices);
    if (p && books >= 2) {
      probIdx.set(`${normalizeTeamName(e.home_team)}|${normalizeTeamName(e.away_team)}`, p);
    }
  }
  console.log(`市场共识：${probIdx.size} 场有 ≥2 家机构报价`);

  // 2) 未开赛比赛 + 1x2 选项
  const { data } = await sb
    .from("matches")
    .select(
      "id, kickoff_at, status, home:home_team_id(name), away:away_team_id(name), markets(id, type, selections(id, code, pooled_stake))"
    )
    .eq("status", "scheduled");
  type Row = {
    id: string;
    kickoff_at: string;
    home: { name: string } | null;
    away: { name: string } | null;
    markets: { id: string; type: string; selections: { id: string; code: string; pooled_stake: number }[] }[];
  };
  const now = Date.now();
  let seeded = 0,
    skippedNoOdds = 0,
    skippedStarted = 0;
  for (const m of ((data as Row[] | null) ?? [])) {
    if (new Date(m.kickoff_at).getTime() <= now) {
      skippedStarted++;
      continue;
    }
    const mk = (m.markets ?? []).find((x) => x.type === "1x2");
    if (!mk) continue;
    const key = `${normalizeTeamName(m.home?.name ?? "")}|${normalizeTeamName(m.away?.name ?? "")}`;
    const p = probIdx.get(key);
    if (!p) {
      skippedNoOdds++;
      continue;
    }
    const probs: Record<string, number> = { home: p.home, draw: p.draw, away: p.away };
    const stakes: Record<string, number> = {};
    for (const code of ["home", "draw", "away"]) {
      stakes[code] = Math.max(0, Math.round(probs[code] * (T + K * N) - K));
    }
    const total = Object.values(stakes).reduce((a, b) => a + b, 0);
    for (const s of mk.selections) {
      const stake = stakes[s.code] ?? 0;
      const multiplier = Math.min(50, Math.max(1.1, Math.round(((total + K * N) / (stake + K)) * 100) / 100));
      const { error } = await sb
        .from("selections")
        .update({ pooled_stake: stake, current_multiplier: multiplier })
        .eq("id", s.id);
      if (error) throw new Error(`update ${s.id}: ${error.message}`);
    }
    seeded++;
    console.log(
      `✓ ${m.home?.name} vs ${m.away?.name}: ${(probs.home * 100).toFixed(0)}/${(probs.draw * 100).toFixed(0)}/${(probs.away * 100).toFixed(0)} → ×${((total + 300) / (stakes.home + 100)).toFixed(2)}/${((total + 300) / (stakes.draw + 100)).toFixed(2)}/${((total + 300) / (stakes.away + 100)).toFixed(2)}`
    );
  }
  console.log(`完成：灌注 ${seeded} 场；无报价跳过 ${skippedNoOdds}；已开赛跳过 ${skippedStarted}`);
}

main().catch((e) => {
  console.error("✗ 灌注失败:", e);
  process.exit(1);
});
