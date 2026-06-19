"use client";

// 赛程卡中心区：进行中比赛显示实时比分+分钟（轮询 /api/live，~30s）；
// 拿不到实时（刚开赛/数据缺口）则回退原「VS + 开球时间」观感。仅对已开赛卡使用。
import { useEffect, useRef, useState } from "react";
import { LocalTime } from "@/components/LocalTime";
import type { Locale } from "@/i18n";

interface LiveResp {
  live: boolean;
  score?: { h: number; a: number };
  minute?: number;
}

export function LiveScore({
  matchId,
  kickoffAt,
  locale,
}: {
  matchId: string;
  kickoffAt: string;
  locale: Locale;
}) {
  const [d, setD] = useState<LiveResp | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const r = await fetch(`/api/live?id=${matchId}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as LiveResp;
        if (alive) setD(j);
      } catch {
        /* 下次轮询再试 */
      }
    };
    poll();
    timer.current = setInterval(poll, 30_000);
    return () => {
      alive = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, [matchId]);

  if (d?.live && d.score) {
    return (
      <div>
        <div className="font-head text-xl font-bold tabular-nums text-green">
          {d.score.h} : {d.score.a}
        </div>
        <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] md:text-xs text-[#ff5436]">
          <span className="live-dot" />
          {d.minute ?? 0}&apos;
        </div>
      </div>
    );
  }

  // 已开赛但暂无实时数据：保持原观感（VS + 本地开球时间）。
  return (
    <>
      <div className="font-head text-sm font-bold text-muted">VS</div>
      <div className="font-head mt-1 text-xs text-text">
        <LocalTime iso={kickoffAt} locale={locale} mode="time" />
      </div>
    </>
  );
}
