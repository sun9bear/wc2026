"use client";

// 首页顶部「正在直播」入口条：把进行中的比赛顶到最上方，点击直达比赛页(看板)。
// 服务端传入「直播窗口内」候选场次，客户端逐场轮询 /api/live(~30s) 确认真·直播并取比分；
// 无任何真直播则整条不渲染(返回 null)。配额：共享 70s 服务端缓存，候选场次少。
import Link from "next/link";
import { useEffect, useState } from "react";
import { flagUrl, teamName } from "@/lib/football/teams";
import { getDict, localeHref, type Locale } from "@/i18n";

interface Cand {
  id: string;
  homeName: string;
  awayName: string;
}
interface LiveResp {
  live: boolean;
  score?: { h: number; a: number };
  minute?: number;
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
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {liveOnes.map((m) => {
          const d = live[m.id];
          const hf = flagUrl(m.homeName);
          const af = flagUrl(m.awayName);
          return (
            <Link
              key={m.id}
              href={localeHref(locale, `/match/${m.id}`)}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-[#ff5436]/40 bg-surface px-3 py-2 text-xs transition-colors hover:border-green/60 active:scale-[0.98]"
            >
              <span className="inline-flex items-center gap-1">
                {hf && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={hf} alt="" className="h-3 w-4 rounded-[1px] object-cover" />
                )}
                {teamName(m.homeName, locale)}
              </span>
              <span className="font-head tabular-nums text-green">
                {d.score!.h}-{d.score!.a}
              </span>
              <span className="text-[10px] text-[#ff5436]">{d.minute ?? 0}&apos;</span>
              <span className="inline-flex items-center gap-1">
                {teamName(m.awayName, locale)}
                {af && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={af} alt="" className="h-3 w-4 rounded-[1px] object-cover" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
