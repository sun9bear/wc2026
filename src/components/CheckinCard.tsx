"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface Status {
  checkedInToday: boolean;
  streak: number;
  balance: number;
}

export function CheckinCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;
      const res = await fetch("/api/checkin", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setStatus((await res.json()) as Status);
    })();
  }, []);

  async function checkin() {
    if (busy || status?.checkedInToday) return;
    setBusy(true);
    setMsg(null);
    try {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw new Error("进入游戏失败：" + error.message);
        session = (await supabase.auth.getSession()).data.session;
      }
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
      });
      const j = (await res.json()) as {
        error?: string;
        awarded?: number;
        alreadyCheckedIn?: boolean;
        balance: number;
        streak: number;
      };
      if (!res.ok) throw new Error(j.error ?? "签到失败");
      setStatus({ checkedInToday: true, streak: j.streak, balance: j.balance });
      setMsg(j.alreadyCheckedIn ? "今日已签到" : `签到成功 +${j.awarded} 积分`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "签到失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-4">
      <div>
        <div className="font-head font-bold">每日签到</div>
        <div className="text-xs text-muted">
          {status?.streak ? `🔥 连续 ${status.streak} 天` : "签到领积分"}
          {msg ? ` · ${msg}` : ""}
        </div>
      </div>
      <button
        type="button"
        onClick={checkin}
        disabled={busy || status?.checkedInToday}
        className="rounded-md bg-green px-4 py-2 text-sm font-bold text-[#06231a] disabled:opacity-40"
      >
        {status?.checkedInToday ? "已签到" : busy ? "…" : "签到 +50"}
      </button>
    </div>
  );
}
