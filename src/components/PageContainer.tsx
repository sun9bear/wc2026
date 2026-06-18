import { type ReactNode } from "react";

// 页面宽度分级（桌面端响应式）：替代各页硬编码的 max-w-xl(576px 手机列)。
// 桌面统一在此集中管理横向最大宽度 + 响应式内边距，避免散落漂移。
//  - prose:    法务/正文阅读页，控制行宽保证可读性（≈768px）
//  - standard: 多数页面默认（≈1024px，与首页一致）
//  - wide:     仪表盘/多列数据页（概率/计算器/战绩/人气/排行，≈1152px）
const TIERS = {
  prose: "max-w-3xl",
  standard: "max-w-5xl",
  wide: "max-w-6xl",
} as const;

export type PageWidth = keyof typeof TIERS;

export function PageContainer({
  tier = "standard",
  className = "",
  children,
}: {
  tier?: PageWidth;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={`mx-auto w-full ${TIERS[tier]} px-4 py-8 md:px-6 md:py-10 ${className}`}
    >
      {children}
    </main>
  );
}
