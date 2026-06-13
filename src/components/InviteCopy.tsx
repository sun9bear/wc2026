"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import type { Locale } from "@/i18n";

// 擂台邀请文案一键复制（任务 5）。EN 用 League/Challenge，避开 pool。
const TXT = {
  zh: {
    btn: "📋 复制邀请文案",
    copied: "已复制 ✓",
    invite: (code: string) =>
      `建了个世界杯竞猜擂台，口令 ${code}，看看谁是懂球帝 → 搜 wc2026.cool（进站点底部「好友擂台」输码即入）`,
  },
  en: {
    btn: "📋 Copy invite",
    copied: "Copied ✓",
    invite: (code: string) =>
      `I set up a World Cup prediction league — code ${code}. Think you can out-predict me? → wc2026.cool/league`,
  },
} as const;

export function InviteCopy({ code, locale }: { code: string; locale: Locale }) {
  const t = TXT[locale];
  const [done, setDone] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (copyText(t.invite(code))) {
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
      className="rounded-md bg-green px-4 py-2 text-sm font-bold text-[#06231a]"
    >
      {done ? t.copied : t.btn}
    </button>
  );
}
