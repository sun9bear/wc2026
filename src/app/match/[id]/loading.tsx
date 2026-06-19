import { PageContainer } from "@/components/PageContainer";

// 比赛详情页加载骨架：点击赛程卡后立即显示（替代全局 ⚽ 占位），
// 动态页(getForecast/getMatchScoreline 等)期间给出即时反馈。纯视觉、无需 locale。
export default function Loading() {
  return (
    <PageContainer tier="standard">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-24 rounded bg-surface-2" />
        <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <div className="h-16 w-20 rounded bg-surface-2" />
          <div className="h-8 w-16 rounded bg-surface-2" />
          <div className="h-16 w-20 rounded bg-surface-2" />
        </div>
        <div className="h-40 rounded-lg bg-surface-2" />
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          <div className="h-48 rounded-lg bg-surface-2" />
          <div className="h-48 rounded-lg bg-surface-2" />
        </div>
      </div>
    </PageContainer>
  );
}
