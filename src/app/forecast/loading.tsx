// /forecast 专属加载页：首次冷计算约 8 秒，必须有进度感否则用户流失。
export default function Loading() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="animate-bounce text-6xl">📊</div>
      <p className="text-sm text-muted">Running 10,000 Monte Carlo simulations…</p>
      <p className="text-xs text-muted">万次蒙特卡洛模拟计算中（首次约 8 秒）…</p>
      <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-green" />
      </div>
    </main>
  );
}
