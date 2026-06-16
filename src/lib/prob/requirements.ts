// 出线门槛计算：选中某队后，枚举其「自身剩余小组赛」的所有胜平负组合（3^k），
// 每种组合下固定本队赛果（约定 主胜1-0/平1-1/客胜0-1，与计算器一致），对其余全部
// 剩余比赛按 Elo 模型比分矩阵蒙卡采样，统计该「战绩(积分+净胜球)」的出线概率。
// 出线 = 小组前 2 或 12 个第三名中的前 8（2026 规则，复用 standings 排名）。
// 用公共随机数（每组合同种子）→ 战绩间概率比较无采样噪声、单调可读。仅小组阶段，不跑淘汰赛。

import { unstable_cache } from "next/cache";
import { getForecast } from "./pipeline";
import { lambdasFromElo, scoreMatrix } from "./poisson";
import { matrixToCdf, type SimMatch } from "./simulate";
import { buildRows, rankGroup, rankThirds, mulberry32, type Rng } from "./standings";
import { normalizeTeamName } from "./names";
import type { GroupResult } from "./types";

const HOSTS = new Set(["united states", "mexico", "canada"]);
const SEED = 20260616;

export interface AdvanceRecord {
  w: number;
  d: number;
  l: number;
  pts: number; // 含已赛的总积分
  gd: number; // 含已赛的总净胜球（本队剩余按约定 1-0/1-1/0-1 估算）
  p: number; // 该战绩平均出线概率 0-1
  pLow: number; // 同战绩不同对手安排的最低概率
  pHigh: number;
}
export interface AdvanceRequirements {
  teamId: string;
  remaining: { oppId: string; oppName: string; oppZh: string; home: boolean }[];
  records: AdvanceRecord[]; // 由优到劣排序
  clinchPts: number | null; // 保底出线（最低保证 ≥99.5%）所需总积分
  clinchGd: number | null;
  curPts: number; // 当前积分
}

function sampleScore(cdf: Float64Array, rng: Rng, dim: number): { h: number; a: number } {
  const u = rng() * cdf[cdf.length - 1];
  let lo = 0;
  let hi = cdf.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < u) lo = mid + 1;
    else hi = mid;
  }
  return { h: Math.floor(lo / dim), a: lo % dim };
}

function enumerateCombos(k: number): ("W" | "D" | "L")[][] {
  if (k === 0) return [[]];
  const rest = enumerateCombos(k - 1);
  const out: ("W" | "D" | "L")[][] = [];
  for (const o of ["W", "D", "L"] as const) for (const r of rest) out.push([o, ...r]);
  return out;
}

// 单批小组阶段模拟：固定 playedByGroup（含本队约定赛果），采样 otherRem，统计目标队出线率。
// 采样流(sRng)与排名平局流(tRng)分离、各组合都从同一种子重置 → 公共随机数：
// 各组合面对完全相同的「其他场次」抽样，差异只来自本队战绩，概率比较无噪声、单调可读。
// 焦点组放最后处理：其余 11 组的抽样/平局消耗在各组合间完全对齐。
function advanceProb(
  targetId: string,
  targetGroup: string,
  letters: string[],
  groups: Record<string, string[]>,
  playedByGroup: Map<string, GroupResult[]>,
  otherRemByGroup: Map<string, SimMatch[]>,
  rating: Map<string, number>,
  runs: number,
  dim: number
): number {
  const ordered = [...letters.filter((g) => g !== targetGroup), targetGroup];
  const sRng = mulberry32(SEED); // 比分抽样流
  const tRng = mulberry32(SEED + 7); // 排名平局流（独立，避免抽样被平局消耗错位）
  let adv = 0;
  for (let run = 0; run < runs; run++) {
    const thirdRows = [];
    let top2 = false;
    let isThird = false;
    for (const g of ordered) {
      const results = [...playedByGroup.get(g)!];
      for (const m of otherRemByGroup.get(g)!) {
        const s = sampleScore(m.cdf, sRng, dim);
        results.push({ homeId: m.homeId, awayId: m.awayId, homeGoals: s.h, awayGoals: s.a });
      }
      const order = rankGroup(groups[g], results, tRng, rating);
      if (g === targetGroup) {
        if (order[0]?.teamId === targetId || order[1]?.teamId === targetId) top2 = true;
        else if (order[2]?.teamId === targetId) isThird = true;
      }
      if (order[2]) thirdRows.push(order[2]);
    }
    if (top2) {
      adv++;
    } else if (isThird) {
      const ranked = rankThirds(thirdRows, tRng, rating);
      if (ranked.slice(0, 8).includes(targetId)) adv++;
    }
  }
  return adv / runs;
}

export function computeRequirements(
  data: Awaited<ReturnType<typeof getForecast>>,
  targetId: string
): AdvanceRequirements | null {
  const groups = data.groupTeams;
  const letters = Object.keys(groups).sort();
  if (letters.length !== 12 || !letters.every((g) => groups[g].length === 4)) return null;

  const teamGroup = new Map<string, string>();
  for (const g of letters) for (const id of groups[g]) teamGroup.set(id, g);
  const tg = teamGroup.get(targetId);
  if (!tg) return null;

  const rating = new Map(Object.entries(data.rating));
  const meta = new Map<string, { name: string; zh: string }>();
  for (const grp of data.groups) for (const t of grp.table) meta.set(t.id, { name: t.name, zh: t.zh });

  // 剩余小组赛 → Elo 模型比分矩阵 CDF（self-contained，不依赖 forecast 内部 fused cdf）。
  const remaining: SimMatch[] = data.matches.map((m) => {
    const hostAdv = HOSTS.has(normalizeTeamName(meta.get(m.homeId)?.name ?? "")) ? 100 : 0;
    const seed = lambdasFromElo(rating.get(m.homeId) ?? 1600, rating.get(m.awayId) ?? 1600, hostAdv);
    return { homeId: m.homeId, awayId: m.awayId, cdf: matrixToCdf(scoreMatrix(seed.home, seed.away)) };
  });
  const dim = Math.round(Math.sqrt(remaining[0]?.cdf.length ?? 81));

  const targetRem = remaining.filter((m) => m.homeId === targetId || m.awayId === targetId);
  const otherRem = remaining.filter((m) => m.homeId !== targetId && m.awayId !== targetId);

  // 分桶（每组合复用）
  const basePlayedByGroup = new Map<string, GroupResult[]>(letters.map((g) => [g, []]));
  for (const r of data.played) {
    const g = teamGroup.get(r.homeId);
    if (g) basePlayedByGroup.get(g)!.push(r);
  }
  const otherRemByGroup = new Map<string, SimMatch[]>(letters.map((g) => [g, []]));
  for (const m of otherRem) {
    const g = teamGroup.get(m.homeId);
    if (g) otherRemByGroup.get(g)!.push(m);
  }

  const k = targetRem.length;
  const runs = k <= 2 ? 1500 : 900;
  const combos = enumerateCombos(k);

  // 当前积分（仅已赛）
  const curRow = buildRows(
    groups[tg],
    data.played.filter((r) => teamGroup.get(r.homeId) === tg && teamGroup.get(r.awayId) === tg)
  ).get(targetId);
  const curPts = curRow?.pts ?? 0;

  const byRecord = new Map<
    string,
    { w: number; d: number; l: number; pts: number; gd: number; ps: number[] }
  >();
  for (const combo of combos) {
    const forced: GroupResult[] = targetRem.map((m, i) => {
      const o = combo[i];
      const home = m.homeId === targetId;
      if (o === "D") return { homeId: m.homeId, awayId: m.awayId, homeGoals: 1, awayGoals: 1 };
      const tWin = o === "W";
      const tScore = tWin ? 1 : 0;
      const oScore = tWin ? 0 : 1;
      return {
        homeId: m.homeId,
        awayId: m.awayId,
        homeGoals: home ? tScore : oScore,
        awayGoals: home ? oScore : tScore,
      };
    });

    // 本队该组合下的最终战绩（积分/净胜球，含已赛）
    const grpResults = [...data.played, ...forced].filter(
      (r) => teamGroup.get(r.homeId) === tg && teamGroup.get(r.awayId) === tg
    );
    const row = buildRows(groups[tg], grpResults).get(targetId)!;

    const playedByGroup = new Map(basePlayedByGroup);
    playedByGroup.set(tg, [...basePlayedByGroup.get(tg)!, ...forced]);

    const p = advanceProb(
      targetId,
      tg,
      letters,
      groups,
      playedByGroup,
      otherRemByGroup,
      rating,
      runs,
      dim
    );

    const w = combo.filter((o) => o === "W").length;
    const d = combo.filter((o) => o === "D").length;
    const l = combo.filter((o) => o === "L").length;
    const key = `${row.pts}|${row.gd}`;
    const e = byRecord.get(key) ?? { w, d, l, pts: row.pts, gd: row.gd, ps: [] };
    e.ps.push(p);
    byRecord.set(key, e);
  }

  const records: AdvanceRecord[] = [...byRecord.values()]
    .map((e) => ({
      w: e.w,
      d: e.d,
      l: e.l,
      pts: e.pts,
      gd: e.gd,
      p: e.ps.reduce((s, x) => s + x, 0) / e.ps.length,
      pLow: Math.min(...e.ps),
      pHigh: Math.max(...e.ps),
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd);

  // 保底出线门槛：积分最低、且「最坏对手安排」仍 ≥99.5% 的战绩。
  let clinchPts: number | null = null;
  let clinchGd: number | null = null;
  for (const r of records) {
    if (r.pLow >= 0.995) {
      clinchPts = r.pts;
      clinchGd = r.gd;
    }
  }

  const remOut = targetRem.map((m) => {
    const oppId = m.homeId === targetId ? m.awayId : m.homeId;
    return {
      oppId,
      oppName: meta.get(oppId)?.name ?? oppId,
      oppZh: meta.get(oppId)?.zh ?? oppId,
      home: m.homeId === targetId,
    };
  });

  return { teamId: targetId, remaining: remOut, records, clinchPts, clinchGd, curPts };
}

export function getAdvanceRequirements(teamId: string): Promise<AdvanceRequirements | null> {
  return unstable_cache(
    async () => computeRequirements(await getForecast(), teamId),
    ["adv-req-v2", teamId],
    { revalidate: 900 }
  )();
}
