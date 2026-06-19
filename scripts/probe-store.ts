/**
 * P3c 落库验证（经隧道，事务回滚，零生产影响）：取一场真实已结算比赛 → buildBlogRow → BEGIN/INSERT/ROLLBACK，
 * 确认行 shape/类型/FK/uuid[]/jsonb 都被 blog_entries 接受。不提交，结束即回滚。
 * 用法：先起隧道，再 npx tsx scripts/probe-store.ts
 */
import { Client } from "pg";

async function main(): Promise<void> {
  process.loadEnvFile(".env.local");
  const { buildBlogRow } = await import("../src/lib/blog/store");

  const u = new URL(process.env.SUPABASE_DB_URL as string);
  u.hostname = "127.0.0.1";
  u.port = "55432";
  const c = new Client({ connectionString: u.toString(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12000 });
  await c.connect();

  const m = (
    await c.query(
      "select m.id, m.home_team_id hid, m.away_team_id aid, ht.name home, at.name away from matches m join teams ht on ht.id=m.home_team_id join teams at on at.id=m.away_team_id where m.status='settled' limit 1"
    )
  ).rows[0];
  if (!m) {
    console.log("无已结算比赛，跳过");
    await c.end();
    return;
  }

  // 合成 candidate + draft（用真实 match_id / team_ids，满足 FK 与 uuid[]）
  const cand = {
    matchId: m.id,
    eventType: "upset",
    priority: 40,
    trendingHeat: null,
    delta: {
      matchId: m.id,
      kickoffAt: "2026-06-17T23:00:00.000Z",
      settledAt: "2026-06-18T01:10:00.000Z",
      match: { home: m.home, away: m.away, score: "1-0", stage: "Group Stage", group: "L" },
      match1x2: { before: { home: 0.18, draw: 0.25, away: 0.57 }, actual: "home_win" },
      teams: [
        { teamId: m.hid, team: m.home, side: "home", pAdvance: { before: 0.25, after: 0.67 }, pChampion: { before: 0, after: 0 } },
        { teamId: m.aid, team: m.away, side: "away", pAdvance: { before: 0.62, after: 0.21 }, pChampion: { before: 0, after: 0 } },
      ],
    },
  } as unknown as Parameters<typeof buildBlogRow>[0];
  const draft = {
    matchId: m.id,
    eventType: "upset",
    topicSensitive: false,
    status: "needs_review",
    statusReason: "gray_rollout",
    en: { locale: "en", payload: { demand: { source: "template", query: "probe", keywords: [], heat: null } }, article: { title: "T", excerpt: "E", body: "B", keywords: ["k"], topic_flag: null }, parseError: null, hard: { pass: true, reasons: [], offendingNumbers: [], bannedTerms: [] }, soft: null },
    zh: { locale: "zh", payload: { demand: { source: "template", query: "探针", keywords: [], heat: null } }, article: { title: "标", excerpt: "摘", body: "正", keywords: ["k"], topic_flag: null }, parseError: null, hard: { pass: true, reasons: [], offendingNumbers: [], bannedTerms: [] }, soft: null },
  } as unknown as Parameters<typeof buildBlogRow>[1];

  const row = buildBlogRow(cand, draft, new Date().toISOString());
  console.log("buildBlogRow 输出键:", Object.keys(row).join(", "));
  console.log("  slug:", row.slug_en, "| match_id:", row.match_id, "| team_ids:", JSON.stringify(row.team_ids), "| status:", row.status);

  await c.query("BEGIN");
  try {
    await c.query(
      `insert into blog_entries
        (slug_en,slug_zh,title_en,title_zh,excerpt_en,excerpt_zh,body_en,body_zh,match_id,team_ids,event_type,prob_delta,demand_signal,review,status,topic_flag,published_at,updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::uuid[],$11,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16,$17,$18)`,
      [
        row.slug_en, row.slug_zh, row.title_en, row.title_zh, row.excerpt_en, row.excerpt_zh, row.body_en, row.body_zh,
        row.match_id, row.team_ids, row.event_type,
        JSON.stringify(row.prob_delta), JSON.stringify(row.demand_signal), JSON.stringify(row.review),
        row.status, row.topic_flag, row.published_at, row.updated_at,
      ]
    );
    const cnt = (await c.query("select count(*)::int n, status, array_length(team_ids,1) tnum from blog_entries where slug_en=$1 group by status, team_ids", [row.slug_en])).rows[0];
    console.log("事务内插入校验:", JSON.stringify(cnt), "✓ 行被 blog_entries 接受（类型/FK/uuid[]/jsonb 均 OK）");
    await c.query("ROLLBACK");
    console.log("已 ROLLBACK —— 生产库零写入。");
  } catch (e) {
    await c.query("ROLLBACK");
    console.error("INSERT 失败（已回滚）:", (e as Error).message);
    process.exit(1);
  }
  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
