"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { FixtureMatch } from "@/lib/fixtures/matches";
import { TeamBadge } from "@/components/TeamBadge";
import { LocalTime } from "@/components/LocalTime";
import { LiveScore } from "@/components/LiveScore";
import { stageName, groupName } from "@/lib/football/teams";
import { getDict, localeHref, type Locale } from "@/i18n";

// 客户端时间戳只读一次(getSnapshot 稳定)，与 MatchList 同模式：避免在 render 里调用 Date.now()
// 引发的纯度/水合问题(SSR 与首帧 now=0 → started=false 一致，mount 后再判定)。
const emptySubscribe = () => () => {};
let clientNow = 0;
function getClientNow() {
  if (clientNow === 0) clientNow = Date.now();
  return clientNow;
}
const LIVE_WINDOW_MS = 140 * 60_000;

export function MatchCard({ match, locale }: { match: FixtureMatch; locale: Locale }) {
  const t = getDict(locale);
  const now = useSyncExternalStore(emptySubscribe, getClientNow, () => 0);
  const settled =
    match.status === "settled" && match.homeScore != null && match.awayScore != null;
  const kickoffMs = new Date(match.kickoffAt).getTime();
  // started 仅 mount 后判定，且限定在直播窗口(140min)内——避免久未结算的旧场一直显示「进行中」。
  const started = !settled && now !== 0 && kickoffMs <= now && now <= kickoffMs + LIVE_WINDOW_MS;

  return (
    <Link
      href={localeHref(locale, `/match/${match.id}`)}
      className="fade-up block rounded-lg border border-border bg-surface p-4 transition duration-150 hover:-translate-y-0.5 hover:border-green/50 active:scale-[0.99] active:border-green/70"
    >
      <div className="mb-3 flex items-center justify-between text-[11px] md:text-xs text-muted">
        <span>
          {stageName(match.stage, locale)}
          {match.group ? ` · ${groupName(match.group, locale)}` : ""}
        </span>
        {settled && (
          <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-[10px]">
            {t.status.finished}
          </span>
        )}
        {started && (
          <span className="flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-[10px] text-green">
            <span className="live-dot" /> {t.status.live}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <TeamBadge name={match.home.name} locale={locale} />
        <div className="text-center">
          {settled ? (
            <div className="font-head text-xl font-bold">
              {match.homeScore} : {match.awayScore}
            </div>
          ) : started ? (
            // 进行中：显示实时比分+分钟（拿不到则内部回退 VS+时间）。
            <LiveScore matchId={match.id} kickoffAt={match.kickoffAt} locale={locale} />
          ) : (
            <>
              <div className="font-head text-sm font-bold text-muted">VS</div>
              <div className="font-head mt-1 text-xs text-text">
                <LocalTime iso={match.kickoffAt} locale={locale} mode="time" />
              </div>
            </>
          )}
        </div>
        <TeamBadge name={match.away.name} locale={locale} />
      </div>
    </Link>
  );
}
