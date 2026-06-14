"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import type { Locale } from "@/i18n";

// 擂台邀请文案一键复制（任务 5）。各语避博彩词：用 league/predicción/previsão/Tipprunde/prédiction，
// 不用 es pronóstico / pt palpite / fr pronostic（tip 义触 AdSense 风险）。
const TXT: Record<Locale, { btn: string; copied: string; invite: (code: string) => string }> = {
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
  es: {
    btn: "📋 Copiar invitación",
    copied: "Copiado ✓",
    invite: (code: string) =>
      `Creé una liga de predicciones del Mundial — código ${code}. ¿Crees que puedes superarme? → wc2026.cool/league`,
  },
  pt: {
    btn: "📋 Copiar convite",
    copied: "Copiado ✓",
    invite: (code: string) =>
      `Criei uma liga de previsões da Copa — código ${code}. Acha que me supera? → wc2026.cool/league`,
  },
  de: {
    btn: "📋 Einladung kopieren",
    copied: "Kopiert ✓",
    invite: (code: string) =>
      `Ich habe eine WM-Tipprunde erstellt — Code ${code}. Glaubst du, du tippst besser? → wc2026.cool/league`,
  },
  fr: {
    btn: "📋 Copier l'invitation",
    copied: "Copié ✓",
    invite: (code: string) =>
      `J'ai créé une ligue de prédictions de la Coupe du monde — code ${code}. Tu penses faire mieux ? → wc2026.cool/league`,
  },
};

export function InviteCopy({ code, locale }: { code: string; locale: Locale }) {
  const t = TXT[locale] ?? TXT.en;
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
