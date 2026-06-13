// /calculator 专属加载页（同 forecast：依赖概率管线，冷缓存时计算耗时）。
export default function Loading() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="animate-bounce text-6xl">🧮</div>
      <p className="text-sm text-muted">Crunching qualification scenarios…</p>
      <p className="text-xs text-muted">出线情景计算中…</p>
      <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-green" />
      </div>
    </main>
  );
}
