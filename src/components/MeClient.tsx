"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Disclaimer } from "@/components/Disclaimer";
import { CheckinCard } from "@/components/CheckinCard";
import { fmtPoints } from "@/lib/format";
import { copyText } from "@/lib/clipboard";
import { Skeleton } from "@/components/Skeleton";
import { defaultName } from "@/lib/identity/defaultName";
import { getDict, type Locale } from "@/i18n";

interface RecentBet {
  won: boolean;
  kickoff: string;
}

interface MeData {
  balance: number;
  nickname?: string | null;
  tier: string;
  tierCode?: string;
  total: number;
  won: number;
  lost: number;
  pending: number;
  hitRate: number;
  achievements: { id: string; icon: string; label: string; desc: string; earned: boolean }[];
  recent?: RecentBet[];
  streak?: number;
  bestStreak?: number;
  beatPct?: number | null;
}

// 世界杯开幕日（matchday 计数锚点，按用户本地日期算）
const DAY1 = "2026-06-11";

const TXT = {
  zh: {
    streakLine: (s: number, b: number) => `🔥 当前 ${s} 连中 · 历史最佳 ${b}`,
    copyRecord: "📋 复制战绩",
    copied: "已复制 ✓",
    shareTitle: (n: number) => `⚽ WC2026 竞猜战绩 · 第${n}比赛日`,
    streakTag: (s: number) => `🔥 连中${s}场`,
    beat: (p: number) => `💪 击败 ${p}% 玩家`,
    site: "搜 wc2026.cool",
    league: "🛡 好友擂台 · 建房间拉朋友比一比 →",
    nameLabel: "我的名字",
    rename: "改名",
    save: "保存",
    cancel: "取消",
    nameErr: "名字不合法（2–20 字、无敏感词）",
  },
  en: {
    streakLine: (s: number, b: number) => `🔥 Current streak ${s} · best ${b}`,
    copyRecord: "📋 Copy my record",
    copied: "Copied ✓",
    shareTitle: (n: number) => `⚽ WC2026 picks · Matchday ${n}`,
    streakTag: (s: number) => `🔥 ${s}-win streak`,
    beat: (p: number) => `💪 Better than ${p}% of players`,
    site: "wc2026.cool",
    league: "🛡 Friends league · challenge your friends →",
    nameLabel: "My name",
    rename: "Rename",
    save: "Save",
    cancel: "Cancel",
    nameErr: "Invalid name (2–20 chars, no banned words)",
  },
} as const;

// emoji 战绩格（任务 3）：按用户本地日期取最近一个比赛日的已结算注单。
function buildRecordCard(recent: RecentBet[], streak: number, beatPct: number | null | undefined, locale: Locale): string | null {
  if (recent.length === 0) return null;
  const t = TXT[locale];
  const localDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
  const latestDay = recent.map((b) => localDate(b.kickoff)).sort().at(-1)!;
  const day = recent.filter((b) => localDate(b.kickoff) === latestDay);
  const squares = day.map((b) => (b.won ? "🟩" : "🟥")).join("");
  const wonN = day.filter((b) => b.won).length;
  const matchday =
    Math.max(0, Math.round((Date.parse(latestDay) - Date.parse(DAY1)) / 86400000)) + 1;
  const lines = [t.shareTitle(matchday), `${squares} (${wonN}/${day.length})`];
  if (streak >= 2) lines.push(t.streakTag(streak));
  if (beatPct != null && beatPct > 0) lines.push(t.beat(beatPct));
  lines.push(t.site);
  return lines.join("\n");
}

function Tile({ value, label, color = "text-text" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className={`font-head text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

export function MeClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const tx = TXT[locale];
  const [data, setData] = useState<MeData | null>(null);
  const [state, setState] = useState<"loading" | "none" | "ready">("loading");
  const [copied, setCopied] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const effectiveName = nickname ?? (uid ? defaultName(uid, locale) : "");

  async function saveName() {
    if (saving) return; // 防极速双击在 disabled 生效前重复提交
    const v = draft.trim();
    if (!v) return;
    setSaving(true);
    setNameErr(null);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ nickname: v }),
      });
      if (res.ok) {
        setNickname(v);
        setEditing(false);
      } else {
        setNameErr(tx.nameErr);
      }
    } catch {
      setNameErr(tx.nameErr);
    } finally {
      setSaving(false);
    }
  }

  function doCopyRecord() {
    if (!data) return;
    const card = buildRecordCard(data.recent ?? [], data.streak ?? 0, data.beatPct, locale);
    if (card && copyText(card)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setState("none");
        return;
      }
      setUid(session.user.id);
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const j = (await res.json()) as MeData;
        setData(j);
        setNickname(j.nickname ?? null);
        setState("ready");
      } else {
        setState("none");
      }
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.me.title}</h1>
        <Link href="/" className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>

      <div className="mt-4">
        <CheckinCard locale={locale} />
      </div>

      {state === "loading" && (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </div>
        </div>
      )}

      {state === "none" && (
        <div className="mt-16 text-center">
          <div className="text-5xl">🎯</div>
          <p className="mt-3 text-sm text-muted">{t.me.empty}</p>
          <Link href="/" className="mt-3 inline-block text-sm text-green">
            {t.me.emptyCta}
          </Link>
        </div>
      )}

      {state === "ready" && data && (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface p-5">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <div className="font-head text-lg font-bold">
                <span className="text-gold">
                  🛡 {(data.tierCode && t.tiers[data.tierCode]) || data.tier}
                </span>
              </div>
              <div className="text-xs text-muted">{t.me.balanceLabel}</div>
            </div>
            <div className="font-head text-3xl font-bold text-green">{fmtPoints(data.balance)}</div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm">
            {editing ? (
              <span className="flex w-full items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    else if (e.key === "Escape") {
                      setEditing(false);
                      setNameErr(null);
                    }
                  }}
                  maxLength={20}
                  autoFocus
                  aria-label={tx.nameLabel}
                  className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-text"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveName}
                  className="shrink-0 rounded-md bg-green px-3 py-1 text-xs font-bold text-[#06231a]"
                >
                  {tx.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setNameErr(null);
                  }}
                  className="shrink-0 rounded-md border border-border px-3 py-1 text-xs text-muted"
                >
                  {tx.cancel}
                </button>
              </span>
            ) : (
              <>
                <span className="min-w-0 truncate text-muted">
                  {tx.nameLabel}：<span className="font-head text-text">{effectiveName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(nickname ?? effectiveName ?? "");
                    setEditing(true);
                  }}
                  className="ml-2 shrink-0 rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted transition hover:border-green hover:text-green"
                >
                  {tx.rename}
                </button>
              </>
            )}
          </div>
          {nameErr && <div className="mt-1 text-[11px] text-red">{nameErr}</div>}

          {((data.recent?.length ?? 0) > 0 || (data.bestStreak ?? 0) > 0) && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm">
              <span className="text-gold">
                {(data.bestStreak ?? 0) > 0
                  ? tx.streakLine(data.streak ?? 0, data.bestStreak ?? 0)
                  : `${t.me.hitRate} ${data.hitRate}%`}
              </span>
              {(data.recent?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={doCopyRecord}
                  className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted transition hover:border-green hover:text-green"
                >
                  {copied ? tx.copied : tx.copyRecord}
                </button>
              )}
            </div>
          )}

          <Link
            href="/league"
            className="mt-3 block rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm text-muted transition hover:border-green hover:text-green"
          >
            {tx.league}
          </Link>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Tile value={`${data.hitRate}%`} label={t.me.hitRate} color="text-green" />
            <Tile value={data.won} label={t.me.wins} color="text-gold" />
            <Tile value={data.total} label={t.me.total} />
            <Tile value={data.pending} label={t.me.pending} color="text-blue" />
          </div>

          {data.achievements && (
            <>
              <h2 className="font-head mb-2 mt-6 text-sm font-semibold">
                {t.me.achievements} · {data.achievements.filter((a) => a.earned).length}/{data.achievements.length}
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {data.achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-md border border-border bg-surface-2 p-3 text-center ${
                      a.earned ? "" : "opacity-40 grayscale"
                    }`}
                  >
                    <div className="text-2xl">{a.icon}</div>
                    <div className="mt-1 text-[11px] font-medium">{t.ach[a.id]?.label ?? a.label}</div>
                    <div className="text-[9px] text-muted">{t.ach[a.id]?.desc ?? a.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
