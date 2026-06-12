import type { GroupResult, TableRow } from "./types";

// 小组积分榜与最佳第三名排名 —— 按 2026 官方新规（FIFA 规程，经 Wikipedia 逐字核对）：
// 组内：积分 → 同分队间相互战绩（积分/净胜/进球，部分分出后对仍并列者递归重应用）
//       → 全部小组赛净胜球 → 进球 → 公平竞赛分 → FIFA 排名。
// 第三名横排（12 取 8）：积分 → 净胜球 → 进球 → 公平竞赛分 → FIFA 排名。
// 注：公平竞赛分无红黄牌数据可用，跳过；FIFA 排名用调用方传入的实力评分（Elo）近似，
//     两者只在前序判据全平时才生效，对概率影响极小；页面需标注此简化。

export type Rng = () => number; // [0,1) 随机源（模拟传入各 run 的种子 RNG）

/** 计算一个小组的积分榜（未排序行）。 */
export function buildRows(teamIds: string[], results: GroupResult[]): Map<string, TableRow> {
  const rows = new Map<string, TableRow>();
  for (const id of teamIds) rows.set(id, { teamId: id, played: 0, pts: 0, gf: 0, ga: 0, gd: 0 });
  for (const r of results) {
    const h = rows.get(r.homeId);
    const a = rows.get(r.awayId);
    if (!h || !a) continue;
    h.played++;
    a.played++;
    h.gf += r.homeGoals;
    h.ga += r.awayGoals;
    a.gf += r.awayGoals;
    a.ga += r.homeGoals;
    if (r.homeGoals > r.awayGoals) h.pts += 3;
    else if (r.homeGoals < r.awayGoals) a.pts += 3;
    else {
      h.pts++;
      a.pts++;
    }
  }
  for (const row of rows.values()) row.gd = row.gf - row.ga;
  return rows;
}

function cmp3(a: TableRow | undefined, b: TableRow | undefined): number {
  return (
    (b?.pts ?? 0) - (a?.pts ?? 0) || (b?.gd ?? 0) - (a?.gd ?? 0) || (b?.gf ?? 0) - (a?.gf ?? 0)
  );
}

/** 末位判据：实力评分（高者前），再不行受控随机。 */
function finalCmp(a: TableRow, b: TableRow, rating: Map<string, number>, rng: Rng): number {
  const r = (rating.get(b.teamId) ?? 0) - (rating.get(a.teamId) ?? 0);
  return r !== 0 ? r : rng() - 0.5;
}

/** 对同积分簇按"相互战绩（递归）→ 整体净胜/进球 → 评分 → 随机"排序。 */
function orderTied(
  cluster: TableRow[],
  results: GroupResult[],
  rating: Map<string, number>,
  rng: Rng,
  depth: number
): TableRow[] {
  if (cluster.length <= 1) return cluster;
  const ids = new Set(cluster.map((c) => c.teamId));
  const mini = buildRows(
    [...ids],
    results.filter((r) => ids.has(r.homeId) && ids.has(r.awayId))
  );
  const sorted = [...cluster].sort(
    (a, b) =>
      cmp3(mini.get(a.teamId), mini.get(b.teamId)) ||
      cmp3(a, b) || // 整体净胜球/进球（同积分簇内 pts 相同，等效 gd→gf）
      finalCmp(a, b, rating, rng)
  );
  if (depth >= 3) return sorted;

  // 递归重应用：相互战绩分出"部分"后，对仍按 mini 三项并列的子簇重算相互战绩
  const out: TableRow[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (
      j < sorted.length &&
      cmp3(mini.get(sorted[i].teamId), mini.get(sorted[j].teamId)) === 0
    )
      j++;
    const sub = sorted.slice(i, j);
    if (sub.length > 1 && sub.length < cluster.length) {
      out.push(...orderTied(sub, results, rating, rng, depth + 1));
    } else {
      out.push(...sub); // 子簇=全簇（mini 无区分力）时已按整体 gd/gf/评分排好
    }
    i = j;
  }
  return out;
}

/** 小组内排序（2026 规则）。rating：teamId→实力评分（Elo，越高越强）。 */
export function rankGroup(
  teamIds: string[],
  results: GroupResult[],
  rng: Rng,
  rating: Map<string, number> = new Map()
): TableRow[] {
  const rows = [...buildRows(teamIds, results).values()].sort((a, b) => b.pts - a.pts);
  const out: TableRow[] = [];
  let i = 0;
  while (i < rows.length) {
    let j = i + 1;
    while (j < rows.length && rows[j].pts === rows[i].pts) j++;
    out.push(...orderTied(rows.slice(i, j), results, rating, rng, 0));
    i = j;
  }
  return out;
}

/** 12 个第三名 → 排名（积分/净胜/进球/评分/随机），调用方取前 8。 */
export function rankThirds(
  thirds: TableRow[],
  rng: Rng,
  rating: Map<string, number> = new Map()
): string[] {
  return [...thirds]
    .sort((a, b) => cmp3(a, b) || finalCmp(a, b, rating, rng))
    .map((t) => t.teamId);
}

/** 可复现的种子随机源（mulberry32）。 */
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
