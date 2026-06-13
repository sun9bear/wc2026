"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";

// 页头右上角紧凑分享入口（原生分享，不支持则复制 + toast）。比埋在页底的卡片更醒目。
export function ShareIconButton({
  url,
  text,
  locale,
}: {
  url: string;
  text: string;
  locale: "zh" | "en";
}) {
  const [toast, setToast] = useState<string | null>(null);
  const label = locale === "zh" ? "分享" : "Share";

  async function onClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "wc2026.cool", text, url });
        track("header_share_click", { method: "native" });
      } catch {
        track("header_share_click", { method: "native_dismiss" });
      }
      return;
    }
    const ok = copyText(`${text} ${url}`);
    setToast(ok ? (locale === "zh" ? "已复制 ✓" : "Copied ✓") : locale === "zh" ? "复制失败" : "Copy failed");
    track("header_share_click", { method: ok ? "copy" : "copy_fail" });
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted transition hover:border-green hover:text-green"
    >
      <span aria-hidden>↗</span>
      {toast ?? label}
    </button>
  );
}
