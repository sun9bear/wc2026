/**
 * P3c 编排验证（mock LLM，无网络无 DB）：合成候选 + mock 生成/审核，验证
 * 生成→解析→硬闸→软闸→路由 status 的判定。覆盖：干净(灰度/自动发)、幻觉数字、题材 sensitive。
 * 用法：npx tsx scripts/probe-generate.ts
 */
import { generateForCandidate, type GenDeps } from "../src/lib/blog/generate";
import type { BlogCandidate } from "../src/lib/blog/scoreCandidate";

// 合成候选（Ghana 1-0 Panama 风格）：1x2 前 18/25/57、Ghana 出线 25→67、Panama 62→21、夺冠均≈0。
const cand: BlogCandidate = {
  matchId: "test-match",
  eventType: "upset",
  priority: 43,
  trendingHeat: null,
  delta: {
    matchId: "test-match",
    kickoffAt: "2026-06-17T23:00:00.000Z",
    settledAt: "2026-06-18T01:10:00.000Z",
    match: { home: "Ghana", away: "Panama", score: "1-0", stage: "Group Stage", group: "L" },
    match1x2: { before: { home: 0.175, draw: 0.253, away: 0.572 }, actual: "home_win" },
    teams: [
      { teamId: "h", team: "Ghana", side: "home", pAdvance: { before: 0.246, after: 0.674 }, pChampion: { before: 0, after: 0.0001 } },
      { teamId: "a", team: "Panama", side: "away", pAdvance: { before: 0.621, after: 0.208 }, pChampion: { before: 0.0017, after: 0.0005 } },
    ],
  },
};

// 干净文章（数字全可由 payload 派生：18/25/57、25→67、62→21、score 1-0；夺冠用文字"essentially nil"）。
const CLEAN = {
  title: "Ghana vs Panama: 1-0 Upset Reshapes Group L",
  excerpt: "Ghana stun Panama 1-0 — our model lifts Ghana's advance chance from 25% to 67% while Panama crash from 62% to 21%.",
  body: "Panama came in our favorites at 57%, Ghana just 18%, a draw 25%. The scoreboard said 1-0 Ghana. Ghana's chance to advance jumps from 25% to 67%; Panama tumble from 62% to 21%. Title hopes for both stay essentially nil. See the [full forecast](/forecast) or the [Group L calculator](/calculator/group/l).",
  keywords: ["ghana vs panama", "group l world cup 2026", "ghana advance chance"],
  topic_flag: null as string | null,
};
const HALLUC = { ...CLEAN, body: CLEAN.body + " Ghana now look 120% certain to go through." }; // 120 不在允许集
const SENSITIVE = { ...CLEAN, topic_flag: "sensitive" };

function mockDeps(article: object): GenDeps {
  return {
    generate: async () => "```json\n" + JSON.stringify(article) + "\n```", // 带围栏测 parse 容错
    review: async () => JSON.stringify({ verdict: "usable", confidence: 0.9, notes: "clean" }),
  };
}

async function run(label: string, article: object, opts: { autoPublish?: boolean }, expect: string): Promise<void> {
  const d = await generateForCandidate(cand, mockDeps(article), opts);
  console.log(
    `${label}\n   期望: ${expect}\n   实得: ${d.status}  (${d.statusReason})  [en hard ${d.en.hard?.pass ? "✓" : "✗"} / zh hard ${d.zh.hard?.pass ? "✓" : "✗"}]\n`
  );
}

(async () => {
  await run("干净 + autoPublish=true", CLEAN, { autoPublish: true }, "published");
  await run("干净 + 灰度(默认)", CLEAN, {}, "needs_review (gray_rollout)");
  await run("幻觉数字 120%", HALLUC, { autoPublish: true }, "needs_review (hard_gate)");
  await run("题材 sensitive", SENSITIVE, { autoPublish: true }, "needs_review (sensitive_topic)");
})();
