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

// 初次返回 bad，修复调用（user 含 "broke hard rules"）返回 good —— 测机械型 1-shot 定向修复。
function mockBadThenGood(bad: object, good: object): GenDeps {
  return {
    generate: async (_l, _s, user) => "```json\n" + JSON.stringify(user.includes("broke hard rules") ? good : bad) + "\n```",
    review: async () => JSON.stringify({ verdict: "usable", confidence: 0.9, notes: "clean" }),
  };
}

const fence = (o: object) => "```json\n" + JSON.stringify(o) + "\n```";
const USABLE = JSON.stringify({ verdict: "usable", confidence: 0.9, notes: "clean" });

// parse 失败→重新生成（per-locale 计数：第1次非 JSON，第2次 good）。
function mockParseFailThenGood(good: object): GenDeps {
  const n: Record<string, number> = {};
  return {
    generate: async (l) => ((n[l] = (n[l] ?? 0) + 1) === 1 ? "sorry, I can't output JSON" : fence(good)),
    review: async () => USABLE,
  };
}

// 软闸 needs_fix→带反馈重写（generate 按是否含 "Reviewer feedback" 切换；review per-locale 第1次 needs_fix，之后 usable）。
function mockSoftFixThenUsable(first: object, rewritten: object): GenDeps {
  const rc: Record<string, number> = {};
  return {
    generate: async (_l, _s, user) => fence(user.includes("Reviewer feedback") ? rewritten : first),
    review: async (l) =>
      JSON.stringify(
        (rc[l] = (rc[l] ?? 0) + 1) === 1
          ? { verdict: "needs_fix", confidence: 0.9, notes: "headline redundant" }
          : { verdict: "usable", confidence: 0.95, notes: "ok" }
      ),
  };
}

// 软闸 reject：不应触发重写（直接人工）。
function mockSoftReject(article: object): GenDeps {
  return { generate: async () => fence(article), review: async () => JSON.stringify({ verdict: "reject", confidence: 0.9, notes: "off" }) };
}

async function runDeps(label: string, deps: GenDeps, opts: { autoPublish?: boolean }, expect: string): Promise<void> {
  const d = await generateForCandidate(cand, deps, opts);
  const tag = (x: typeof d.en) => `${x.hard?.pass ? "✓" : "✗"}${x.repaired ? "(repaired)" : ""}`;
  console.log(`${label}\n   期望: ${expect}\n   实得: ${d.status} (${d.statusReason}) [en ${tag(d.en)} / zh ${tag(d.zh)}]\n`);
}

async function run(label: string, article: object, opts: { autoPublish?: boolean }, expect: string): Promise<void> {
  return runDeps(label, mockDeps(article), opts, expect);
}

(async () => {
  await run("干净 + autoPublish=true", CLEAN, { autoPublish: true }, "published");
  await run("干净 + 灰度(默认)", CLEAN, {}, "needs_review (gray_rollout)");
  await run("幻觉数字 120%（不可修复:mock 不改）", HALLUC, { autoPublish: true }, "needs_review (hard_gate)");
  await run("题材 sensitive", SENSITIVE, { autoPublish: true }, "needs_review (sensitive_topic)");
  await runDeps("机械错→1-shot 定向修复→过", mockBadThenGood(HALLUC, CLEAN), { autoPublish: true }, "published (en/zh repaired)");
  await runDeps("parse 失败→重新生成→过", mockParseFailThenGood(CLEAN), { autoPublish: true }, "published (en/zh repaired)");
  await runDeps("软闸 needs_fix→带反馈重写→过", mockSoftFixThenUsable(CLEAN, CLEAN), { autoPublish: true }, "published (en/zh repaired)");
  await runDeps("软闸 reject→不重写→人工", mockSoftReject(CLEAN), { autoPublish: true }, "needs_review (soft_gate), 不 repaired");
})();
