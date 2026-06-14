"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";
import type { Locale } from "@/i18n";
import { localeHref } from "@/i18n";
import { selfUrl } from "@/lib/seo/canonical";

// 计算器"先选我的队"入口 + 结论条 + 一键复制（CodeX 建议吸收版）。
// 选队走整页跳转（/calculator?team=slug）——让 generateMetadata 同步出
// 问题式标题与该队 OG 卡，分享链接在社交平台自动展开图卡。

export interface FocusTeam {
  name: string;
  zh: string;
  flag: string | null;
  letter: string;
  rank: number;
  pAdvance: number; // 0-1
  pChampion: number;
  slug: string;
}

const TXT = {
  zh: {
    pick: "选你的队：",
    all: "全部球队…",
    conclusion: (t: FocusTeam, adv: string) =>
      `${t.zh}：${t.letter} 组当前第 ${t.rank} · 模型出线概率 ${adv}%`,
    copyText: "📋 复制结论",
    copyLink: "🔗 复制链接",
    shareNow: "🔗 分享",
    shareImg: "🖼 分享图卡",
    copied: "已复制 ✓",
    share: (t: FocusTeam, adv: string, url: string) =>
      `${t.zh}目前出线概率 ${adv}%（万次模拟）——自己改一版剩余赛果看走势：${url}`,
  },
  en: {
    pick: "Pick your team:",
    all: "All teams…",
    conclusion: (t: FocusTeam, adv: string) =>
      `${t.name}: ${t.rank}${["st", "nd", "rd"][t.rank - 1] ?? "th"} in Group ${t.letter} · ${adv}% chance to advance`,
    copyText: "📋 Copy result",
    copyLink: "🔗 Copy link",
    shareNow: "🔗 Share",
    shareImg: "🖼 Share image",
    copied: "Copied ✓",
    share: (t: FocusTeam, adv: string, url: string) =>
      `${t.name} has a ${adv}% chance to advance (10,000 sims) — flip any remaining result yourself: ${url}`,
  },
} as const;

export function CalculatorFocus({
  locale,
  hot,
  all,
  focus,
}: {
  locale: Locale;
  hot: { name: string; zh: string; slug: string }[];
  all: { name: string; zh: string; slug: string }[];
  focus: FocusTeam | null;
}) {
  const t = TXT[locale];
  const [done, setDone] = useState<"text" | "link" | null>(null);
  const label = (x: { name: string; zh: string }) => (locale === "zh" ? x.zh : x.name);

  const adv = focus ? ((focus.pAdvance > 1 ? focus.pAdvance : focus.pAdvance * 100)).toFixed(0) : "";
  const url = focus ? selfUrl(`/calculator?team=${focus.slug}`, locale) : "";

  function doCopy(kind: "text" | "link") {
    if (!focus) return;
    const ok = copyText(kind === "link" ? url : t.share(focus, adv, url));
    if (ok) {
      track("calculator_share_copy", { kind, team: focus.slug });
      setDone(kind);
      setTimeout(() => setDone(null), 1600);
    }
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="shrink-0 text-muted">{t.pick}</span>
        {hot.map((x) => (
          <a
            key={x.slug}
            href={localeHref(locale, `/calculator?team=${x.slug}`)}
            onClick={() => track("calculator_team_selected", { team: x.slug, via: "chip" })}
            className={`shrink-0 rounded-pill border px-2.5 py-1 ${
              focus?.slug === x.slug ? "border-green text-green" : "border-border text-muted"
            }`}
          >
            {label(x)}
          </a>
        ))}
        <select
          className="shrink-0 rounded-sm border border-border bg-surface-2 px-2 py-1 text-muted"
          value={focus && !hot.some((x) => x.slug === focus.slug) ? focus.slug : ""}
          onChange={(e) => {
            if (e.target.value) {
              track("calculator_team_selected", { team: e.target.value, via: "select" });
              window.location.href = localeHref(locale, `/calculator?team=${e.target.value}`);
            }
          }}
        >
          <option value="">{t.all}</option>
          {all.map((x) => (
            <option key={x.slug} value={x.slug}>
              {label(x)}
            </option>
          ))}
        </select>
      </div>

      {focus && (
        <div className="mt-3 rounded-lg border border-green/40 bg-surface p-3">
          <div className="flex items-center gap-2 text-sm">
            {focus.flag && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={focus.flag} alt="" className="h-4 w-6 rounded-[2px] object-cover" />
            )}
            <span className="font-medium">{t.conclusion(focus, adv)}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => doCopy("text")}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted transition hover:border-green hover:text-green"
            >
              {done === "text" ? t.copied : t.copyText}
            </button>
            <button
              type="button"
              onClick={() => doCopy("link")}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-muted transition hover:border-green hover:text-green"
            >
              {done === "link" ? t.copied : t.copyLink}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
