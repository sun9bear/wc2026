/**
 * P2.3+P2.5 候选队列探针：经隧道(pg)读真实快照 → 跑真实 classifyProbDelta + buildSettledCandidate +
 * buildInputPayload，打印候选队列 + 一条完整 INPUT payload(en/zh)。验证融合链路在真实数据上的产出。
 * 用法：先起隧道  node scripts/socks5-forward.mjs 55432 aws-1-us-west-1.pooler.supabase.com 5432 127.0.0.1 11080
 *       再         npx tsx scripts/probe-candidates.ts
 */
import { Client } from "pg";

const num = (x: unknown): number | null => (x == null ? null : Number(x));

async function main(): Promise<void> {
  process.loadEnvFile(".env.local");
  // 动态 import：在 loadEnvFile 之后，避免 supabase client 在 env 就绪前初始化（本探针只调纯函数，不走 PostgREST）。
  const { classifyProbDelta } = await import("../src/lib/blog/getProbDelta");
  const { buildSettledCandidate, buildInputPayload } = await import("../src/lib/blog/scoreCandidate");

  const u = new URL(process.env.SUPABASE_DB_URL as string);
  u.hostname = "127.0.0.1";
  u.port = "55432";
  const c = new Client({ connectionString: u.toString(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12000 });
  await c.connect();

  const ms = (
    await c.query(
      "select m.id, m.stage, m.kickoff_at, m.settled_at, m.home_score, m.away_score, ht.id hid, ht.name home, ht.grp hgrp, at.id aid, at.name away from matches m join teams ht on ht.id=m.home_team_id join teams at on at.id=m.away_team_id where m.status='settled' order by m.settled_at desc nulls last limit 12"
    )
  ).rows;

  const before = async (tid: string, k: string) =>
    (await c.query("select p_advance,p_champion from prob_team_snapshots where team_id=$1 and created_at<$2 order by created_at desc limit 1", [tid, k])).rows[0];
  const after = async (tid: string, s: string) =>
    (await c.query("select p_advance,p_champion from prob_team_snapshots where team_id=$1 and created_at>=$2 order by created_at asc limit 1", [tid, s])).rows[0];
  const m1x2 = async (id: string, k: string) =>
    (await c.query("select p_home,p_draw,p_away from prob_match_snapshots where match_id=$1 and created_at<$2 order by created_at desc limit 1", [id, k])).rows[0];

  const cands: ReturnType<typeof buildSettledCandidate>[] = [];
  for (const m of ms) {
    const hb = await before(m.hid, m.kickoff_at);
    const ha = await after(m.hid, m.settled_at);
    const ab = await before(m.aid, m.kickoff_at);
    const aa = await after(m.aid, m.settled_at);
    const mb = await m1x2(m.id, m.kickoff_at);
    const settled = m.home_score != null && m.away_score != null;
    const actual = settled ? (m.home_score > m.away_score ? "home_win" : m.home_score < m.away_score ? "away_win" : "draw") : null;
    const delta = {
      matchId: m.id,
      kickoffAt: new Date(m.kickoff_at).toISOString(),
      settledAt: m.settled_at ? new Date(m.settled_at).toISOString() : null,
      match: { home: m.home, away: m.away, score: settled ? `${m.home_score}-${m.away_score}` : null, stage: m.stage, group: (m.hgrp || "").match(/[A-L]/)?.[0] ?? null },
      match1x2: { before: mb ? { home: Number(mb.p_home), draw: Number(mb.p_draw), away: Number(mb.p_away) } : null, actual },
      teams: [
        { teamId: m.hid, team: m.home, side: "home", pAdvance: { before: num(hb?.p_advance), after: num(ha?.p_advance) }, pChampion: { before: num(hb?.p_champion), after: num(ha?.p_champion) } },
        { teamId: m.aid, team: m.away, side: "away", pAdvance: { before: num(ab?.p_advance), after: num(aa?.p_advance) }, pChampion: { before: num(ab?.p_champion), after: num(aa?.p_champion) } },
      ],
    } as Parameters<typeof classifyProbDelta>[0];
    const cls = classifyProbDelta(delta);
    const cand = buildSettledCandidate(delta, cls, null);
    if (cand) cands.push(cand);
  }
  const ranked = cands.filter((x): x is NonNullable<typeof x> => x != null).sort((a, b) => b.priority - a.priority);

  console.log(`候选队列: ${ranked.length}/${ms.length} 场入选\n`);
  for (const x of ranked) console.log(`  [pri ${String(x.priority).padStart(3)}] ${x.eventType.padEnd(10)} ${x.delta.match.home} ${x.delta.match.score} ${x.delta.match.away}`);

  if (ranked.length) {
    console.log("\n=== 样例 INPUT payload (EN, 队首) ===");
    console.log(JSON.stringify(buildInputPayload(ranked[0], "en"), null, 2));
    console.log("\n=== 样例 (ZH, match/demand/links 节选) ===");
    const z = buildInputPayload(ranked[0], "zh");
    console.log(JSON.stringify({ match: z.match, demand: z.demand, links: z.links }, null, 2));
  }
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
