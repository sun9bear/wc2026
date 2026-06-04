// 段位：按积分余额划分（纯函数）。人人从 1000(青铜) 起，靠预测命中往上爬。
export interface Tier {
  code: string;
  label: string;
}

const TIERS: readonly { min: number; code: string; label: string }[] = [
  { min: 9000, code: "legend", label: "王者" },
  { min: 6000, code: "diamond", label: "钻石" },
  { min: 4000, code: "platinum", label: "铂金" },
  { min: 2500, code: "gold", label: "黄金" },
  { min: 1500, code: "silver", label: "白银" },
  { min: 0, code: "bronze", label: "青铜" },
];

export function rankTier(points: number): Tier {
  const t = TIERS.find((x) => points >= x.min) ?? TIERS[TIERS.length - 1];
  return { code: t.code, label: t.label };
}
