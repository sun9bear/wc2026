"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Disclaimer } from "@/components/Disclaimer";

interface MeData {
  balance: number;
  tier: string;
  total: number;
  won: number;
  lost: number;
  pending: number;
  hitRate: number;
}

function Tile({ value, label, color = "text-text" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className={`font-head text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

export default function MePage() {
  const [data, setData] = useState<MeData | null>(null);
  const [state, setState] = useState<"loading" | "none" | "ready">("loading");

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setState("none");
        return;
      }
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setData((await res.json()) as MeData);
        setState("ready");
      } else {
        setState("none");
      }
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">👤 我的战绩</h1>
        <Link href="/" className="text-xs text-muted">
          ← 返回
        </Link>
      </div>

      {state === "loading" && <p className="mt-10 text-center text-sm text-muted">加载中…</p>}

      {state === "none" && (
        <div className="mt-10 text-center">
          <p className="text-sm text-muted">你还没开始游戏。</p>
          <Link href="/" className="mt-3 inline-block text-sm text-green">
            去预测一场 →
          </Link>
        </div>
      )}

      {state === "ready" && data && (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface p-5">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <div className="font-head text-lg font-bold">
                <span className="text-gold">🛡 {data.tier}</span>
              </div>
              <div className="text-xs text-muted">当前积分</div>
            </div>
            <div className="font-head text-3xl font-bold text-green">{data.balance}</div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Tile value={`${data.hitRate}%`} label="命中率" color="text-green" />
            <Tile value={data.won} label="命中次数" color="text-gold" />
            <Tile value={data.total} label="预测场次" />
            <Tile value={data.pending} label="待结算" color="text-blue" />
          </div>
        </>
      )}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
