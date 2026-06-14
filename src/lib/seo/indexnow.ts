import type { SupabaseClient } from "@supabase/supabase-js";
import { teamSlug } from "@/lib/prob/findTeam";
import type { SettledItem } from "@/lib/settlement/runSettlement";

const BASE = "https://www.wc2026.cool";
// IndexNow 公钥：本就明文服务于 /<key>.txt（公开 token），硬编码以杜绝「文件名 ≠ 环境变量」漂移
// 导致的全量 403；允许用 INDEXNOW_KEY 覆盖（覆盖时须同步替换 public/<key>.txt）。
const KEY = process.env.INDEXNOW_KEY || "6bdb6379e0b34e999e3d0dd720ba612f";
// 仅 Bing / Yandex —— 绝不接 Google：Google 不参与 IndexNow，其 Indexing API 仅限
// JobPosting/BroadcastEvent，对预测页误用会被判 spam / 降权（方案 §四 P1-2）。
const ENDPOINTS = ["https://www.bing.com/indexnow", "https://yandex.com/indexnow"];

/**
 * 结算后 fire-and-forget 通知 Bing/Yandex 重抓受影响 URL（IndexNow，间接利好 ChatGPT/Copilot）。
 * 全程 fail-soft：任何异常都吞掉，绝不抛进 after() / 影响结算响应。
 * 仅由 /api/cron/settle 调用（已自去抖：仅当 newlySettled.length>0 且每场只结算一次）——
 * 切勿接到 autoSettle/runSettlement（页面访问触发，会 ping 风暴）。
 */
export async function pingIndexNow(sb: SupabaseClient, items: SettledItem[]): Promise<void> {
  try {
    if (!KEY || items.length === 0) return;

    // 受影响 URL：结算改动积分榜/出线榜/排行榜，故含相关静态枢纽 + 每场比赛页 + 涉及球队页。
    const urls = new Set<string>([
      `${BASE}/`,
      `${BASE}/forecast`,
      `${BASE}/forecast/best-thirds`,
      `${BASE}/leaderboard`,
    ]);
    for (const s of items) {
      urls.add(`${BASE}/match/${s.id}`);
      if (s.home && s.home !== "?") urls.add(`${BASE}/team/${teamSlug(s.home)}`);
      if (s.away && s.away !== "?") urls.add(`${BASE}/team/${teamSlug(s.away)}`);
    }

    // 组页：队名 → 组字母（teams.grp 形如 "A 组"）补 /calculator/group/[letter]。
    // fail-soft：读不到 teams 就略过组页，其余 URL 照常提交。
    try {
      const { data: teamRows } = await sb.from("teams").select("name, grp");
      const letterOf = new Map<string, string>();
      for (const t of (teamRows as { name: string; grp: string | null }[] | null) ?? []) {
        const letter = (t.grp ?? "").match(/[A-L]/)?.[0];
        if (letter) letterOf.set(t.name, letter.toLowerCase());
      }
      for (const s of items) {
        const l = letterOf.get(s.home) ?? letterOf.get(s.away);
        if (l) urls.add(`${BASE}/calculator/group/${l}`);
      }
    } catch {
      /* 组页解析失败不影响其余 URL 提交 */
    }

    const body = JSON.stringify({
      host: "www.wc2026.cool",
      key: KEY,
      keyLocation: `${BASE}/${KEY}.txt`,
      urlList: [...urls], // 单批远小于协议 1 万上限，无需分片
    });

    // 两端点并发、各自 5s 超时；用 allSettled 保证一端失败不拖另一端，且整体不抛错。
    await Promise.allSettled(
      ENDPOINTS.map((ep) => {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        return fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body,
          signal: ctrl.signal,
        }).finally(() => clearTimeout(timer));
      })
    );
  } catch {
    /* IndexNow 是尽力而为的外部 ping —— 任何失败静默吞掉，绝不影响结算。 */
  }
}
