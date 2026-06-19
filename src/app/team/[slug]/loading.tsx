import { PageContainer } from "@/components/PageContainer";

// 球队详情页加载骨架：点击队旗/队名后立即显示（替代全局 ⚽ 占位），
// 避免动态页(getForecast 较慢)期间「点了没反应」的观感。纯视觉、无需 locale。
export default function Loading() {
  return (
    <PageContainer tier="prose">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-20 rounded bg-surface-2" />
        <div className="flex items-center gap-4">
          <div className="h-12 w-16 rounded bg-surface-2" />
          <div className="h-8 w-44 rounded bg-surface-2" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-lg bg-surface-2" />
          <div className="h-20 rounded-lg bg-surface-2" />
          <div className="h-20 rounded-lg bg-surface-2" />
        </div>
        <div className="h-32 rounded-lg bg-surface-2" />
        <div className="h-24 rounded-lg bg-surface-2" />
      </div>
    </PageContainer>
  );
}
