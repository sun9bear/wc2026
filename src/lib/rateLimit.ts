// 轻量内存限流（固定窗口计数）。服务端用，仅尽力而为：
// Serverless 下每个实例独立计数，跨实例不共享——但对单个攻击者打到一个热实例的洪流仍能封顶，
// 配合同源校验已能挡住裸 curl 循环。需要硬隔离时再上 Upstash/数据库侧方案。
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

/** 返回 true=放行，false=超额。windowMs 内最多 limit 次。 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  // 惰性清扫：每分钟最多扫一次，丢弃过期桶，防 Map 无限增长（攻击者刷大量 key）。
  if (now - lastSweep > 60_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    lastSweep = now;
    // 兜底硬上限：极端情况下 key 爆量直接清空（宁可短暂失效也不 OOM）。
    if (buckets.size > 50_000) buckets.clear();
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}
