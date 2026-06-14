"use client";

import { useEffect, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";
import { buildMatchOgUrl, formatKickoff, type ScoreCell } from "@/lib/share/matchCard";
import type { Locale } from "@/i18n";

// 页眉右上角分享入口（任务 A）：图片卡按钮醒目（绿色发光呼吸边框），链接按钮弱化（ghost）。
// 比赛页与计算器页眉复用同一组件。reduced-motion 由 globals.css 文末媒体查询统一关停呼吸动画。
// 图片按钮 = 直链 OG 卡（<a target=_blank>，最可靠，不被弹窗拦截，长按保存）；链接按钮 = 原生分享/复制降级。

export interface HeaderShareMatch {
  home: string;
  away: string;
  hp: number;
  dp: number;
  ap: number;
  kickoffIso?: string | null;
  homeFlag?: string | null;
  awayFlag?: string | null;
  aiTake?: string | null;
  scoreTop3?: ScoreCell[] | null;
  qrPath?: string | null;
}

export function HeaderShare({
  shareUrl,
  text,
  locale,
  ogUrl,
  match,
  source,
}: {
  shareUrl: string;
  text: string;
  locale: Locale;
  /** 预构造的图片卡 URL（计算器/球队卡用）。与 match 二选一。 */
  ogUrl?: string | null;
  /** 比赛卡参数（比赛页用）：组件在客户端用浏览器时区构造图片卡 URL。 */
  match?: HeaderShareMatch | null;
  /** 埋点来源标记（"match" / "calculator" / "team"）。 */
  source?: string;
}) {
  const [toast, setToast] = useState<string | null>(null);
  // 开球时间按浏览器时区格式化 → 仅挂载后注入，避免 SSR(UTC) 与客户端时区不一致的 hydration 漂移。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const k = mounted && match ? formatKickoff(match.kickoffIso, locale) : { date: "", time: "" };
  const imgUrl =
    ogUrl ??
    (match
      ? buildMatchOgUrl({
          home: match.home,
          away: match.away,
          hp: match.hp,
          dp: match.dp,
          ap: match.ap,
          locale,
          kickoffDate: k.date,
          kickoffTime: k.time,
          homeFlag: match.homeFlag,
          awayFlag: match.awayFlag,
          aiTake: match.aiTake,
          scoreTop3: match.scoreTop3,
          qrPath: match.qrPath,
        })
      : null);

  const C: Record<Locale, { img: string; link: string; copied: string; fail: string; imgAria: string; linkAria: string }> = {
    zh: { img: "图片卡", link: "链接", copied: "已复制 ✓", fail: "复制失败", imgAria: "保存分享图片卡", linkAria: "分享链接" },
    en: { img: "Image", link: "Link", copied: "Copied ✓", fail: "Copy failed", imgAria: "Save share image card", linkAria: "Share link" },
    es: { img: "Imagen", link: "Enlace", copied: "Copiado ✓", fail: "Error al copiar", imgAria: "Guardar tarjeta de imagen", linkAria: "Compartir enlace" },
    pt: { img: "Imagem", link: "Link", copied: "Copiado ✓", fail: "Falha ao copiar", imgAria: "Salvar cartão de imagem", linkAria: "Compartilhar link" },
    de: { img: "Bild", link: "Link", copied: "Kopiert ✓", fail: "Kopieren fehlgeschlagen", imgAria: "Bildkarte speichern", linkAria: "Link teilen" },
    fr: { img: "Image", link: "Lien", copied: "Copié ✓", fail: "Échec de la copie", imgAria: "Enregistrer la carte image", linkAria: "Partager le lien" },
  };
  const c = C[locale] ?? C.en;

  async function onLink() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "wc2026.cool", text, url: shareUrl });
        track("header_share_click", { method: "native", source });
      } catch {
        track("header_share_click", { method: "native_dismiss", source });
      }
      return;
    }
    const ok = copyText(`${text} ${shareUrl}`);
    setToast(ok ? c.copied : c.fail);
    track("header_share_click", { method: ok ? "copy" : "copy_fail", source });
    window.setTimeout(() => setToast(null), 1800);
  }

  return (
    <div className="flex items-center gap-2">
      {imgUrl && (
        <a
          href={imgUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("header_share_image", { source })}
          aria-label={c.imgAria}
          className="breathe-glow inline-flex items-center gap-1 rounded-md border border-green bg-green/10 px-2.5 py-1 text-xs font-semibold text-green transition hover:bg-green/20"
        >
          <span aria-hidden>🖼</span>
          {c.img}
        </a>
      )}
      <button
        type="button"
        onClick={onLink}
        aria-label={c.linkAria}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-muted transition hover:border-green/60 hover:text-text"
      >
        <span aria-hidden>🔗</span>
        {toast ?? c.link}
      </button>
    </div>
  );
}
