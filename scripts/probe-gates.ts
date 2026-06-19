/**
 * 硬闸验证：拿红队工作流的 4 篇真实产出（含已知的 "odds 关键词 / 将近20 / 0.5% / 90分钟" 问题）跑 hardGate，
 * 确认逐一被正确拦截及原因；再跑一个把 odds 关键词改干净的 C 变体，确认能通过。纯逻辑、无网络。
 * 用法：npx tsx scripts/probe-gates.ts
 */
import { hardGate, type GenArticle, type GatePayload } from "../src/lib/blog/gates";

interface Case {
  id: string;
  payload: GatePayload;
  article: GenArticle;
  expect: string;
}

const A: Case = {
  id: "A 爆冷(EN) — keywords 含 odds",
  payload: {
    match: { score: "2-1", stage: "Group Stage" },
    prob_delta: {
      match_1x2: { before: { home: 0.18, draw: 0.24, away: 0.58 } },
      teams: [
        { pAdvance: { before: 0.29, after: 0.63 }, pChampion: { before: 0.004, after: 0.012 } },
        { pAdvance: { before: 0.94, after: 0.82 }, pChampion: { before: 0.19, after: 0.15 } },
      ],
    },
  },
  article: {
    title: "Saudi Arabia vs Argentina: 2-1 Upset Rewrites Group C",
    excerpt: "Saudi Arabia stun Argentina 2-1, our model nearly doubles the Saudis' advance chance from 29% to 63% while Argentina slip to 82%.",
    body: "Before kickoff, our model gave Argentina a 58% chance to win, against 18% for Saudi Arabia and 24% for a draw. Saudi Arabia's chance to advance leaps from 29% to 63%; their title hopes tick from 0% to 1%. Argentina drop from 94% to 82%, title from 19% to 15%. See the [full forecast](/forecast).",
    keywords: ["saudi arabia vs argentina", "group c world cup 2026", "argentina title odds"],
    topic_flag: null,
  },
  expect: "reject [banned: odds]",
};

const B: Case = {
  id: "B 摆动(ZH) — 将近20个百分点(实差19)",
  payload: {
    match: { score: "1-0", stage: "小组赛" },
    prob_delta: {
      match_1x2: { before: { home: 0.27, draw: 0.28, away: 0.45 } },
      teams: [
        { pAdvance: { before: 0.55, after: 0.8 }, pChampion: { before: 0.01, after: 0.02 } },
        { pAdvance: { before: 0.85, after: 0.66 }, pChampion: { before: 0.09, after: 0.06 } },
      ],
    },
  },
  article: {
    title: "日本 vs 德国爆冷复盘：日本出线概率飙到80%",
    excerpt: "日本1-0爆冷掀翻德国，本站模型把日本出线概率从55%直拉到80%，德国从85%跌到66%。",
    body: "开赛前模型：德国胜45%，平28%，日本只有27%。日本出线概率从 55% 飙到 80%，一场胜利换来25个百分点；夺冠从 1% 抬到 2%。德国出线从 85% 跌到 66%，蒸发掉将近20个百分点；夺冠从 9% 滑到 6%。详见 [比赛页](/match/x2)。",
    keywords: ["日本 vs 德国", "日本出线概率", "E组形势"],
    topic_flag: null,
  },
  expect: "reject [numbers: 20个百分点]",
};

const C: Case = {
  id: "C 争议点球(EN) — keywords 含 odds",
  payload: {
    match: { score: "1-1", stage: "Group Stage" },
    prob_delta: {
      match_1x2: { before: { home: 0.62, draw: 0.23, away: 0.15 } },
      teams: [
        { pAdvance: { before: 0.88, after: 0.79 }, pChampion: { before: 0.07, after: 0.05 } },
        { pAdvance: { before: 0.41, after: 0.52 }, pChampion: { before: null, after: null } },
      ],
    },
  },
  article: {
    title: "England vs USA: A Late Draw That Shifts Group D",
    excerpt: "A stoppage-time draw cut England's advance chance from 88% to 79%, while the USA surged from 41% to 52%.",
    body: "England came in our favorite — 62% to win, 23% draw, 15% USA. Final whistle 1-1. England's advance chance slips from 88% to 79%, title from 7% to 5%. The USA climb from 41% to 52%. Track it on our [forecast](/forecast).",
    keywords: ["england vs usa", "group d world cup 2026", "england world cup odds"],
    topic_flag: "sensitive",
  },
  expect: "reject [banned: odds]",
};

const C_FIXED: Case = {
  id: "C-fixed — odds 关键词换成 chances",
  payload: C.payload,
  article: { ...C.article, keywords: ["england vs usa", "group d world cup 2026", "england world cup chances"] },
  expect: "PASS",
};

const D: Case = {
  id: "D 出线锁定(ZH) — 0.5%/0.2% 小数 + 90分钟",
  payload: {
    match: { score: "3-0", stage: "小组赛" },
    prob_delta: {
      match_1x2: { before: { home: 0.66, draw: 0.21, away: 0.13 } },
      teams: [
        { pAdvance: { before: 0.74, after: 0.99 }, pChampion: { before: 0.12, after: 0.14 } },
        { pAdvance: { before: 0.3, after: 0.12 }, pChampion: { before: 0.005, after: 0.002 } },
      ],
    },
  },
  article: {
    title: "巴西 3-0 塞尔维亚提前出线，G 组没有悬念了",
    excerpt: "巴西 3-0 完胜塞尔维亚，桑巴军团出线概率从 74% 飙到 99%，塞尔维亚从 30% 跌到 12%。",
    body: "赛前模型：主胜 66%，平 21%，客胜 13%。巴西出线从 74% 拉到 99%，剩下那 1% 交给玄学；夺冠从 12% 抬到 14%。塞尔维亚出线从 30% 砍到 12%；夺冠从 0% 滑到 0%（精确说是从 0.5% 到 0.2%）。这 90 分钟改写了 G 组。去 [比赛页](/match/x4)。",
    keywords: ["巴西 出线", "巴西 出线概率", "G组 出线形势"],
    topic_flag: null,
  },
  expect: "reject [numbers: 0.5, 0.2, 90]",
};

const cases = [A, B, C, C_FIXED, D];
for (const k of cases) {
  const r = hardGate(k.article, k.payload);
  const verdict = r.pass ? "PASS" : `reject [${r.reasons.join(",")}]`;
  const detail = [
    r.offendingNumbers.length ? `nums=${r.offendingNumbers.join("|")}` : "",
    r.bannedTerms.length ? `banned=${r.bannedTerms.join("|")}` : "",
  ]
    .filter(Boolean)
    .join("  ");
  console.log(`${k.id}\n   期望: ${k.expect}\n   实得: ${verdict}  ${detail}\n`);
}
console.log(`(共 ${cases.length} 例)`);
