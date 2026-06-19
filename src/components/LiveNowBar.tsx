"use client";

// 首页顶部「正在直播」入口条：把进行中的比赛顶到最上方，点击直达比赛页(看板)。
// 服务端传入「直播窗口内」候选场次，客户端逐场轮询 /api/live(~30s) 确认真·直播并取比分；
// 无任何真直播则整条不渲染(返回 null)。配额：共享 70s 服务端缓存，候选场次少。
import Link from "next/link";
import { useEffect, useState } from "react";
import { flagUrl, teamName } from "@/lib/football/teams";
import { getDict, localeHref, type Locale } from "@/i18n";
import type { LiveEvent } from "@/lib/prob/getLiveEvents";

interface Cand {
  id: string;
  homeName: string;
  awayName: string;
}
interface LiveResp {
  live: boolean;
  score?: { h: number; a: number };
  minute?: number;
  top?: { h: number; a: number; p: number }[];
  events?: LiveEvent[];
}

export function LiveNowBar({ matches, locale }: { matches: Cand[]; locale: Locale }) {
  const [live, setLive] = useState<Record<string, LiveResp>>({});

  // 依赖稳定的 id 串而非 matches 数组引用（page.tsx force-dynamic 每次渲染都新建数组，
  // 用数组引用会让未来任何上层重渲染重置轮询并多打一轮请求）。effect 内只用 ids，不闭包 matches。
  const ids = matches.map((m) => m.id).join(",");
  useEffect(() => {
    if (!ids) return;
    const list = ids.split(",");
    let alive = true;
    const poll = async () => {
      const entries = await Promise.all(
        list.map(async (id) => {
          try {
            const r = await fetch(`/api/live?id=${id}`, { cache: "no-store" });
            if (!r.ok) return [id, { live: false }] as const;
            return [id, (await r.json()) as LiveResp] as const;
          } catch {
            return [id, { live: false }] as const;
          }
        })
      );
      if (alive) setLive(Object.fromEntries(entries));
    };
    poll();
    const t = setInterval(poll, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [ids]);

  const t = getDict(locale);
  const liveOnes = matches.filter((m) => live[m.id]?.live && live[m.id]?.score);
  if (liveOnes.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] md:text-xs font-semibold text-green">
        <span className="live-dot" /> {t.status.live}
      </div>
      <div className={`grid grid-cols-1 gap-3 ${liveOnes.length > 1 ? "md:grid-cols-2" : ""}`}>
        {liveOnes.map((m) => {
          const d = live[m.id];
          const hf = flagUrl(m.homeName);
          const af = flagUrl(m.awayName);
          const goals = (d.events ?? []).filter((e) => e.type === "goal");
          const top3 = (d.top ?? []).slice(0, 3);
          return (
            <Link
              key={m.id}
              href={localeHref(locale, `/match/${m.id}`)}
              className="block rounded-lg border border-[#ff5436]/40 bg-surface p-4 transition-colors hover:border-green/60 active:scale-[0.99]"
            >
              {/* 国旗/队名/比分与首页其它赛程卡同尺寸（h-7 w-10 / text-sm / text-xl） */}
              <div className="flex items-center justify-between gap-2">
                <span className="flex w-24 flex-col items-center gap-2 text-center">
                  {hf && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hf} alt="" className="h-7 w-10 rounded-sm object-cover ring-1 ring-border" />
                  )}
                  <span className="truncate text-sm font-medium">{teamName(m.homeName, locale)}</span>
                </span>
                <span className="shrink-0 text-center">
                  <span className="font-head text-xl font-bold tabular-nums">
                    <span className="text-green">{d.score!.h}</span>
                    <span className="mx-1 text-muted">:</span>
                    <span className="text-green">{d.score!.a}</span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-[#ff5436]">
                    <span className="live-dot" />
                    {d.minute ?? 0}&apos;
                  </span>
                </span>
                <span className="flex w-24 flex-col items-center gap-2 text-center">
                  {af && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={af} alt="" className="h-7 w-10 rounded-sm object-cover ring-1 ring-border" />
                  )}
                  <span className="truncate text-sm font-medium">{teamName(m.awayName, locale)}</span>
                </span>
              </div>

              {/* 进球：谁在第几分钟（主队靠左、客队靠右镜像） */}
              {goals.length > 0 && (
                <div className="mt-3 space-y-1">
                  {goals.map((g, i) => (
                    <div
                      key={`${g.minute}-${g.primary}-${i}`}
                      className={`flex items-center gap-1.5 text-[11px] md:text-xs ${g.side === "home" ? "" : "flex-row-reverse text-right"}`}
                    >
                      <span className="w-9 shrink-0 tabular-nums text-muted">
                        {g.minute}
                        {g.injuryTime ? `+${g.injuryTime}` : ""}&apos;
                      </span>
                      <span className="shrink-0">⚽</span>
                      <span className="min-w-0 truncate">{g.primary}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 最可能比分 Top-3（一排、紧凑） */}
              {top3.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[11px] md:text-xs text-muted">
                  {top3.map((s) => (
                    <span key={`${s.h}-${s.a}`}>
                      <span className="font-head text-text">
                        {s.h}-{s.a}
                      </span>{" "}
                      <span className="text-green">{(s.p * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
