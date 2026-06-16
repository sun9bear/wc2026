// 网络热度分原料：维基百科 Pageviews REST API（免费 / 无 key / 官方 / 多语）。
// 取某条目近若干日 pageviews 合计作 buzz_raw（设计 §5.3）。失败/无数据 → 0（软降级）。
const PV_BASE =
  "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/user";
// Wikimedia 政策要求带描述性 UA。
const UA = "wc2026.cool/1.0 (Fan Favorite popularity buzz)";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** 构造 pageviews 查询 URL（条目名 URL 编码；daily 粒度，闭区间 [start, end]）。 */
export function pageviewsUrl(wikiTitle: string, start: Date, end: Date): string {
  const article = encodeURIComponent(wikiTitle);
  return `${PV_BASE}/${article}/daily/${ymd(start)}/${ymd(end)}`;
}

/** 累加 payload.items[].views（缺失/非数 记 0）。 */
export function sumViews(payload: unknown): number {
  const items = (payload as { items?: { views?: number }[] } | null)?.items ?? [];
  return items.reduce((a, it) => a + (typeof it.views === "number" ? it.views : 0), 0);
}

/** 抓某条目近 days 日 pageviews 合计；失败/无数据 → 0。 */
export async function fetchPageviews(wikiTitle: string, days = 7): Promise<number> {
  // 当日 pageviews 未结算（Wikimedia 对未完成日整段 404）→ end 取昨日，回看 days 个完整日。
  const end = new Date(Date.now() - 86_400_000);
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const url = pageviewsUrl(wikiTitle, start, end);
  // Wikimedia 对突发请求会 429（与标题无关，实测）→ 退避重试；批量间仍需节流（见 cron 循环）。
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return 0;
      return sumViews(await res.json());
    } catch {
      return 0;
    }
  }
  return 0;
}
