// 实时世界杯比分「二级兜底源」（football-data.org，FREE_PLUS_LIVESCORES 档）。
// 主源是 API-Football（src/lib/prob/liveFeed.ts）；本模块仅在主源未命中本场时兜底，
// 消除「唯一直播源」单点故障。按 external_id 直接关联（赛程本就由 football-data 同步入库），
// 无需 normalizeTeamName 模糊匹配，也无主客对调问题。
//
// 配额：单次 /v4/competitions/WC/matches?status=IN_PLAY,PAUSED，70s 共享缓存 → 整届最多
//       ~1 次/70s，远低于 20 req/min。任何失败/无 key 都降级返回空数组。
// 过期门控：付费实时权益到 FD_LIVESCORES_UNTIL（默认不填即停用），到期后退回免费档只剩延迟
//       比分——此时返回空数组，绝不把延迟比分当实时显示（合规：纯比分/分钟，不触盘口/赔率）。

import { unstable_cache } from "next/cache";

export interface FdLiveFixture {
  externalId: number;
  hNow: number;
  aNow: number;
  minute: number;
  short: string; // 1H / HT / 2H（由 status+minute 粗略推导，仅供展示）
}

interface FdMatch {
  id: number;
  status?: string;
  minute?: number | string | null;
  score?: { fullTime?: { home: number | null; away: number | null } };
}

/** 实时权益是否仍在有效期内（含当天）。未配置 FD_LIVESCORES_UNTIL 视为停用。 */
function liveEntitlementActive(): boolean {
  const until = process.env.FD_LIVESCORES_UNTIL;
  if (!until) return false;
  const end = Date.parse(`${until}T23:59:59Z`);
  if (Number.isNaN(end)) return false;
  return Date.now() <= end;
}

function deriveShort(status: string | undefined, minute: number): string {
  if (status === "PAUSED") return "HT";
  if (status === "IN_PLAY") return minute > 45 ? "2H" : "1H";
  return "";
}

async function fetchLiveWcFd(): Promise<FdLiveFixture[]> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key || !liveEntitlementActive()) return [];
  try {
    const r = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED",
      // X-Api-Version: v4.1 → 启用 minute/injuryTime 字段（作者 2026-06 邮件新增；不加则无 minute，
      // 兜底直播会把进行中比赛当成第 0 分钟、实时概率失真）。
      { headers: { "X-Auth-Token": key, "X-Api-Version": "v4.1" } }
    );
    if (!r.ok) return [];
    const j = (await r.json()) as { matches?: FdMatch[] };
    const out: FdLiveFixture[] = [];
    for (const m of j.matches ?? []) {
      const ft = m.score?.fullTime;
      const minute = Number(m.minute) || 0;
      out.push({
        externalId: m.id,
        hNow: ft?.home ?? 0,
        aNow: ft?.away ?? 0,
        minute,
        short: deriveShort(m.status, minute),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/** 当前进行中（含中场）的世界杯比赛；缓存 70s。无 key/过期/失败→空数组。 */
export const getLiveWcFdFixtures = unstable_cache(fetchLiveWcFd, ["live-wc-fd-v1"], {
  revalidate: 70,
});

/** 按库内 external_id 命中兜底直播；无匹配返回 null。 */
export function matchLiveFd(
  fixtures: FdLiveFixture[],
  externalId: number | null
): FdLiveFixture | null {
  if (externalId == null) return null;
  return fixtures.find((f) => f.externalId === externalId) ?? null;
}
