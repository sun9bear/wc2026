"use client";

import { useEffect, useState } from "react";
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

export function MatchList({
  matches,
  locale,
  filter,
}: {
  matches: FixtureMatch[];
  locale: Locale;
  filter: string;
}) {
  // 分组依赖浏览器时区——挂载后再算，SSR 阶段渲染骨架避免 hydration 抖动。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const t = getDict(locale);
  const now = Date.now();
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
