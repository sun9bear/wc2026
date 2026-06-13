"use client";

import { useSyncExternalStore } from "react";
import type { FixtureMatch } from "@/lib/fixtures/matches";
import { MatchCard } from "@/components/MatchCard";
import { getDict, type Locale } from "@/i18n";

// 客户端按"用户本地日期"分组（修复：服务端按 UTC 分组导致北美用户日期标题错位）。
// 排序：今天及未来的日期组在前（升序），已过去的日期组放最后（降序、最近的在前）。
function groupByLocalDate(matches: FixtureMatch[], locale: Locale) {
  const lc = locale === "en" ? "en-US" : "zh-CN";
  const todayKey = new Date().toDateString();
  const map = new Map<string, { date: string; ts: number; items: FixtureMatch[] }>();
  for (const m of matches) {
    const d = new Date(m.kickoffAt);
    const key = d.toDateString();
    let g = map.get(key);
    if (!g) {
      g = {
        date: d.toLocaleDateString(lc, { month: "long", day: "numeric", weekday: "short" }),
        ts: new Date(key).getTime(),
        items: [],
      };
      map.set(key, g);
    }
    g.items.push(m);
  }
  const todayTs = new Date(todayKey).getTime();
  const groups = [...map.values()];
  const current = groups.filter((g) => g.ts >= todayTs).sort((a, b) => a.ts - b.ts);
  const past = groups.filter((g) => g.ts < todayTs).sort((a, b) => b.ts - a.ts);
  return [...current, ...past];
}

const emptySubscribe = () => () => {};
// 客户端时间戳只在首次读取时捕获一次，保证 getSnapshot 跨渲染返回稳定值，避免 useSyncExternalStore 死循环。
let clientNow = 0;
function getClientNow() {
  if (clientNow === 0) clientNow = Date.now();
  return clientNow;
}

export function MatchList({
  matches,
  locale,
  filter,
}: {
  matches: FixtureMatch[];
  locale: Locale;
  filter: string;
}) {
  // 分组按浏览器时区、"upcoming" 过滤按客户端当前时间——hydration 后再算，SSR 阶段渲染骨架避免抖动。
  // 用 useSyncExternalStore 而非 effect+setState：既不在 render 里调用 Date.now()（react-hooks/purity），
  // 也不在 effect 里同步 setState（react-hooks/set-state-in-effect）；SSR 与首次 hydration 用服务端快照保证一致。
  const now = useSyncExternalStore(emptySubscribe, getClientNow, () => 0);
  const mounted = now !== 0;

  const t = getDict(locale);
  const filtered = matches.filter((m) => {
    if (filter === "upcoming")
      return m.status !== "settled" && new Date(m.kickoffAt).getTime() > now;
    if (filter === "done") return m.status === "settled";
    return true;
  });

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 6).map((m) => (
          <div key={m.id} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="mt-16 text-center">
        <div className="text-5xl">📭</div>
        <p className="mt-3 text-sm text-muted">{t.filter.empty}</p>
      </div>
    );
  }

  return (
    <>
      {groupByLocalDate(filtered, locale).map((g) => (
        <section key={g.ts} className="mb-6">
          <h2 className="font-head sticky top-0 z-10 -mx-4 mb-2 bg-bg/90 px-4 py-2 text-sm font-semibold text-muted backdrop-blur">
            {g.date}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((m) => (
              <MatchCard key={m.id} match={m} locale={locale} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
