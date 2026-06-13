// 全局路由加载页：服务端渲染间隙立即显示，避免白屏流失。
// 框架约定文件无法 await locale——文案做成双语并存的纯视觉占位。
export default function Loading() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
      <div className="animate-bounce text-6xl">⚽</div>
      <p className="text-sm text-muted">Loading · 加载中…</p>
    </main>
  );
}
