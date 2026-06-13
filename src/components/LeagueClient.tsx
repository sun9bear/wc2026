"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Locale } from "@/i18n";

// 擂台首页（任务 5）：起昵称 → 创建擂台 / 输码加入；列出我已加入的擂台。
// 仅微信/私域分发，绝不出现在 Reddit；EN 文案用 League/Challenge，避开 pool。

const TXT = {
  zh: {
    title: "🛡 好友擂台",
    desc: "建个房间拉朋友进来，看小组赛结束谁是真懂球帝。积分同步全站战绩，零门槛。",
    nickLabel: "先起个名字（榜单上显示）",
    nickPlaceholder: "2-20 个字符",
    nickSave: "保存昵称",
    nickSaved: "已保存 ✓",
    nickCurrent: (n: string) => `你的昵称：${n}`,
    nickEdit: "改名",
    createTitle: "创建擂台",
    createPlaceholder: "擂台名，如「老王家族杯」",
    createBtn: "创建并拿口令",
    joinTitle: "有口令？加入擂台",
    joinPlaceholder: "WC-XXXX",
    joinBtn: "加入",
    mine: "我的擂台",
    busy: "处理中…",
    errors: {
      nickname_length: "昵称需 2-20 个字符",
      nickname_invalid: "昵称含不允许的字符",
      nickname_banned: "昵称含不允许的词",
      nickname_required: "请先在上方设置昵称",
      league_name_invalid: "擂台名需 2-24 个字符",
      league_name_banned: "擂台名含不允许的词",
      code_invalid: "口令格式不对（WC-XXXX）",
      league_not_found: "没找到这个擂台，检查口令",
      generic: "操作失败，稍后再试",
    } as Record<string, string>,
  },
  en: {
    title: "🛡 Friends League",
    desc: "Set up a private league, invite your friends, and see who really knows football. Points sync with your site record.",
    nickLabel: "Pick a name first (shown on the board)",
    nickPlaceholder: "2-20 characters",
    nickSave: "Save name",
    nickSaved: "Saved ✓",
    nickCurrent: (n: string) => `Your name: ${n}`,
    nickEdit: "Edit",
    createTitle: "Create a league",
    createPlaceholder: "League name, e.g. Office Cup",
    createBtn: "Create & get the code",
    joinTitle: "Got a code? Join a league",
    joinPlaceholder: "WC-XXXX",
    joinBtn: "Join",
    mine: "My leagues",
    busy: "Working…",
    errors: {
      nickname_length: "Name must be 2-20 characters",
      nickname_invalid: "Name contains characters that are not allowed",
      nickname_banned: "Name contains words that are not allowed",
      nickname_required: "Set your name above first",
      league_name_invalid: "League name must be 2-24 characters",
      league_name_banned: "League name contains words that are not allowed",
      code_invalid: "Code format looks wrong (WC-XXXX)",
      league_not_found: "League not found — double-check the code",
      generic: "Something went wrong, try again",
    } as Record<string, string>,
  },
} as const;

export function LeagueClient({ locale }: { locale: Locale }) {
  const t = TXT[locale];
  const router = useRouter();
  const [nickname, setNickname] = useState<string | null>(null);
  const [editingNick, setEditingNick] = useState(false);
  const [nickInput, setNickInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [mine, setMine] = useState<{ code: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [nickSavedFlash, setNickSavedFlash] = useState(false);

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const headers = { Authorization: `Bearer ${session.access_token}` };
      try {
        const [pRes, lRes] = await Promise.all([
          fetch("/api/profile", { headers }),
          fetch("/api/league", { headers }),
        ]);
        if (pRes.ok) {
          const j = (await pRes.json()) as { nickname: string | null };
          setNickname(j.nickname);
        }
        if (lRes.ok) {
          const j = (await lRes.json()) as { leagues: { code: string; name: string }[] };
          setMine(j.leagues ?? []);
        }
      } catch {
        /* 静默 */
      }
    })();
  }, []);

  async function ensureToken(): Promise<string | null> {
    let session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) return null;
      session = (await supabase.auth.getSession()).data.session;
    }
    return session?.access_token ?? null;
  }

  async function call(path: string, body: Record<string, string>): Promise<Record<string, unknown> | null> {
    setBusy(true);
    setMsg(null);
    try {
      const token = await ensureToken();
      if (!token) {
        setMsg(t.errors.generic);
        return null;
      }
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        const code = typeof j.error === "string" ? j.error : "generic";
        setMsg(t.errors[code] ?? t.errors.generic);
        return null;
      }
      return j;
    } catch {
      setMsg(t.errors.generic);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function saveNick() {
    const j = await call("/api/profile", { nickname: nickInput });
    if (j) {
      setNickname(j.nickname as string);
      setEditingNick(false);
      setNickSavedFlash(true);
      setTimeout(() => setNickSavedFlash(false), 1600);
    }
  }

  async function createLeague() {
    const j = await call("/api/league", { name: nameInput });
    if (j) router.push(`/league/${j.code as string}`);
  }

  async function joinLeague() {
    const j = await call("/api/league/join", { code: codeInput });
    if (j) router.push(`/league/${j.code as string}`);
  }

  const needNick = !nickname || editingNick;

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.title}</h1>
        <Link href="/" className="text-xs text-muted">
          ← {locale === "zh" ? "返回" : "Back"}
        </Link>
      </div>
      <p className="mt-2 text-sm text-muted">{t.desc}</p>

      {/* 昵称区：擂台社交前提 */}
      <section className="mt-5 rounded-lg border border-border bg-surface p-4">
        {needNick ? (
          <>
            <label className="text-xs text-muted">{t.nickLabel}</label>
            <div className="mt-2 flex gap-2">
              <input
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                placeholder={t.nickPlaceholder}
                maxLength={20}
                className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={saveNick}
                disabled={busy || nickInput.trim().length < 2}
                className="rounded-md bg-green px-4 py-2 text-sm font-bold text-[#06231a] disabled:opacity-40"
              >
                {busy ? t.busy : t.nickSave}
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span>
              {nickSavedFlash ? t.nickSaved + " · " : ""}
              {t.nickCurrent(nickname!)}
            </span>
            <button
              type="button"
              onClick={() => {
                setNickInput(nickname!);
                setEditingNick(true);
              }}
              className="text-xs text-muted underline"
            >
              {t.nickEdit}
            </button>
          </div>
        )}
      </section>

      {/* 创建 */}
      <section className="mt-4 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-head text-sm font-semibold">{t.createTitle}</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t.createPlaceholder}
            maxLength={24}
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={createLeague}
            disabled={busy || nameInput.trim().length < 2}
            className="rounded-md bg-green px-4 py-2 text-sm font-bold text-[#06231a] disabled:opacity-40"
          >
            {busy ? t.busy : t.createBtn}
          </button>
        </div>
      </section>

      {/* 加入 */}
      <section className="mt-4 rounded-lg border border-border bg-surface p-4">
        <h2 className="font-head text-sm font-semibold">{t.joinTitle}</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder={t.joinPlaceholder}
            maxLength={8}
            className="flex-1 rounded-md border border-border bg-bg px-3 py-2 font-head text-sm tracking-widest"
          />
          <button
            type="button"
            onClick={joinLeague}
            disabled={busy || codeInput.trim().length < 4}
            className="rounded-md border border-green px-4 py-2 text-sm font-bold text-green disabled:opacity-40"
          >
            {busy ? t.busy : t.joinBtn}
          </button>
        </div>
      </section>

      {msg && <p className="mt-3 text-sm text-red">{msg}</p>}

      {mine.length > 0 && (
        <section className="mt-6">
          <h2 className="font-head mb-2 text-sm font-semibold">{t.mine}</h2>
          <ul className="space-y-2">
            {mine.map((l) => (
              <li key={l.code}>
                <Link
                  href={`/league/${l.code}`}
                  className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm transition hover:border-green"
                >
                  <span>{l.name}</span>
                  <span className="font-head text-xs text-muted">{l.code}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
