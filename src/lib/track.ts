"use client";

import { supabase } from "@/lib/supabase/client";

// 最小埋点（任务 4）：fire-and-forget，绝不阻塞/影响主流程。
// anon_id：有 supabase 匿名会话用其 uid（异步预热缓存），否则 localStorage 随机 id。
// 链接点击场景用 sendBeacon——页面跳转后请求仍能送达。

const ID_KEY = "wc_anon_id";
let cachedUid: string | null = null;
let warming = false;

function warmUid(): void {
  if (cachedUid || warming) return;
  warming = true;
  supabase.auth
    .getSession()
    .then(({ data }) => {
      if (data.session?.user?.id) cachedUid = data.session.user.id;
    })
    .catch(() => {})
    .finally(() => {
      warming = false;
    });
}

function anonId(): string {
  if (cachedUid) return cachedUid;
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = `a_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return "a_unknown";
  }
}

export function track(name: string, props?: Record<string, unknown>): void {
  try {
    warmUid(); // 本次可能用随机 id，下次起用 uid
    const payload = JSON.stringify({ name, props: props ?? {}, anonId: anonId() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* 埋点绝不抛错 */
  }
}
