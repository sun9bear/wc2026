import type { Probs1x2 } from "./types";

// 多机构报价 → 去水共识概率。
// 每家机构：隐含概率 = 1/价格，按比例去水（除以三项之和）；跨机构取中位数后再归一。

/** 单家机构的三向去水概率；任一价格非法（<=1）返回 null。 */
export function devigBook(home: number, draw: number, away: number): Probs1x2 | null {
  if (!(home > 1) || !(draw > 1) || !(away > 1)) return null;
  const ih = 1 / home;
  const id = 1 / draw;
  const ia = 1 / away;
  const s = ih + id + ia;
  return { home: ih / s, draw: id / s, away: ia / s };
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** 多机构共识：逐家去水后取中位数、再归一。返回共识概率与有效机构数。 */
export function consensus(books: { home: number; draw: number; away: number }[]): {
  p: Probs1x2 | null;
  books: number;
} {
  const devigged = books
    .map((b) => devigBook(b.home, b.draw, b.away))
    .filter((x): x is Probs1x2 => x !== null);
  if (devigged.length === 0) return { p: null, books: 0 };
  const h = median(devigged.map((x) => x.home));
  const d = median(devigged.map((x) => x.draw));
  const a = median(devigged.map((x) => x.away));
  const s = h + d + a;
  return { p: { home: h / s, draw: d / s, away: a / s }, books: devigged.length };
}

/** 市场共识与模型概率加权融合；机构数越少市场权重越低，无市场则纯模型。 */
export function fuse(market: Probs1x2 | null, model: Probs1x2, books: number): Probs1x2 {
  if (!market || books < 1) return model;
  const w = books >= 4 ? 0.75 : books >= 2 ? 0.6 : 0.45;
  const h = w * market.home + (1 - w) * model.home;
  const d = w * market.draw + (1 - w) * model.draw;
  const a = w * market.away + (1 - w) * model.away;
  const s = h + d + a;
  return { home: h / s, draw: d / s, away: a / s };
}
