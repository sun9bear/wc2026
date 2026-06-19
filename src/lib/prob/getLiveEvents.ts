// 进行中比赛的「进球文字流」事件源（football-data.org /v4/matches/{id}，FREE_PLUS_LIVESCORES 档）。
// 取 goals(进球+助攻+类型) / bookings(红黄牌) / substitutions(换人)，按分钟升序。
// 配额：单场 70s 共享缓存(unstable_cache) → 全体观众共用一次抓取，远低于 20 req/min。
// 过期门控：付费实时权益到 FD_LIVESCORES_UNTIL（默认不填即停用），到期后返回空（不把延迟当实时）。
// 合规：纯赛事事实（进球时间/球员/牌/换人），无任何盘口/赔率。

import { unstable_cache } from "next/cache";

export type LiveEventType = "goal" | "card" | "sub";

export interface LiveEvent {
  minute: number;
  injuryTime: number | null;
  type: LiveEventType;
  side: "home" | "away";
  primary: string; // 进球者 / 被罚球员 / 下场球员
  secondary: string | null; // 助攻 / 上场球员
  detail: string | null; // 进球:REGULAR|OWN|PENALTY；牌:YELLOW|RED
}

export interface LiveEvents {
  events: LiveEvent[];
}

interface FdPerson {
  id?: number;
  name?: string;
}
interface FdGoal {
  minute?: number | null;
  injuryTime?: number | null;
  type?: string | null;
  team?: { id?: number };
  scorer?: FdPerson | null;
  assist?: FdPerson | null;
}
interface FdBooking {
  minute?: number | null;
  team?: { id?: number };
  player?: FdPerson | null;
  card?: string | null;
}
interface FdSub {
  minute?: number | null;
  team?: { id?: number };
  playerIn?: FdPerson | null;
  playerOut?: FdPerson | null;
}
interface FdMatchDetail {
  homeTeam?: { id?: number };
  goals?: FdGoal[];
  bookings?: FdBooking[];
  substitutions?: FdSub[];
}

const EMPTY: LiveEvents = { events: [] };

/** 实时权益是否仍在有效期内（与 liveFeedFd 同一门控；未配置 FD_LIVESCORES_UNTIL 视为停用）。 */
function liveEntitlementActive(): boolean {
  const until = process.env.FD_LIVESCORES_UNTIL;
  if (!until) return false;
  const end = Date.parse(`${until}T23:59:59Z`);
  if (Number.isNaN(end)) return false;
  return Date.now() <= end;
}

async function fetchLiveEvents(externalId: number | null): Promise<LiveEvents> {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key || externalId == null || !liveEntitlementActive()) return EMPTY;
  try {
    const r = await fetch(`https://api.football-data.org/v4/matches/${externalId}`, {
      // X-Api-Version v4.1：启用 minute/injuryTime（与 liveFeedFd 一致），否则事件无分钟。
      headers: { "X-Auth-Token": key, "X-Api-Version": "v4.1" },
    });
    if (!r.ok) return EMPTY;
    const j = (await r.json()) as FdMatchDetail;
    const homeId = j.homeTeam?.id;
    const side = (teamId?: number): "home" | "away" => (teamId === homeId ? "home" : "away");
    const events: LiveEvent[] = [];
    for (const g of j.goals ?? []) {
      events.push({
        minute: g.minute ?? 0,
        injuryTime: g.injuryTime ?? null,
        type: "goal",
        side: side(g.team?.id),
        primary: g.scorer?.name ?? "",
        secondary: g.assist?.name ?? null,
        detail: g.type ?? null,
      });
    }
    for (const b of j.bookings ?? []) {
      events.push({
        minute: b.minute ?? 0,
        injuryTime: null,
        type: "card",
        side: side(b.team?.id),
        primary: b.player?.name ?? "",
        secondary: null,
        detail: b.card ?? null,
      });
    }
    for (const s of j.substitutions ?? []) {
      events.push({
        minute: s.minute ?? 0,
        injuryTime: null,
        type: "sub",
        side: side(s.team?.id),
        primary: s.playerOut?.name ?? "",
        secondary: s.playerIn?.name ?? null,
        detail: null,
      });
    }
    events.sort((a, b) => a.minute - b.minute || (a.injuryTime ?? 0) - (b.injuryTime ?? 0));
    return { events };
  } catch {
    return EMPTY;
  }
}

/** 单场进球文字流事件；按 external_id 缓存 70s。无 key/过期/失败 → 空。 */
export const getLiveEvents = unstable_cache(fetchLiveEvents, ["live-events-v1"], { revalidate: 70 });
