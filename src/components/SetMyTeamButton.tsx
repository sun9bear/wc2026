"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import type { Locale } from "@/i18n";

// 「设为我的主队」（任务 C）：localStorage 起步，零 DDL。/me 的主队卡读同一 key。
export const MY_TEAM_KEY = "my_team";
export const MY_TEAM_EVENT = "my-team-changed";

export function SetMyTeamButton({ slug, locale }: { slug: string; locale: Locale }) {
  const [isMine, setIsMine] = useState(false);

  useEffect(() => {
    try {
      setIsMine(localStorage.getItem(MY_TEAM_KEY) === slug);
    } catch {
      /* 隐私模式 */
    }
  }, [slug]);

  function toggle() {
    try {
      if (isMine) {
        localStorage.removeItem(MY_TEAM_KEY);
        setIsMine(false);
        track("my_team_unset", { team: slug });
      } else {
        localStorage.setItem(MY_TEAM_KEY, slug);
        setIsMine(true);
        track("my_team_set", { team: slug });
      }
      window.dispatchEvent(new Event(MY_TEAM_EVENT));
    } catch {
      /* 隐私模式：忽略 */
    }
  }

  const C: Record<Locale, { set: string; done: string }> = {
    zh: { set: "⭐ 设为我的主队", done: "✓ 已是我的主队（点击取消）" },
    en: { set: "⭐ Set as my team", done: "✓ Your team (tap to unset)" },
    es: { set: "⭐ Marcar como mi equipo", done: "✓ Tu equipo (toca para quitar)" },
    pt: { set: "⭐ Definir como meu time", done: "✓ Seu time (toque para remover)" },
    de: { set: "⭐ Als mein Team festlegen", done: "✓ Dein Team (zum Entfernen tippen)" },
    fr: { set: "⭐ Définir comme mon équipe", done: "✓ Votre équipe (touchez pour retirer)" },
  };
  const c = C[locale] ?? C.en;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isMine}
      className={`w-full rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
        isMine
          ? "border-green bg-green/15 text-green"
          : "border-green/50 text-green hover:bg-green/10"
      }`}
    >
      {isMine ? c.done : c.set}
    </button>
  );
}
