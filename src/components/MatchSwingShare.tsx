"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { copyText } from "@/lib/clipboard";
import { track } from "@/lib/track";
import { swingShareParts, matchUrl } from "@/lib/share/swingShare";
import { defaultName } from "@/lib/identity/defaultName";
import type { MatchSwing } from "@/lib/prob/getMatchSwing";
import type { Locale } from "@/i18n";

// 「爆冷瞬间」分享模块（摆动 OG 图卡前端入口）：页内还原摆动视觉 + 原生分享 + 个人押中炫耀 + 署名。
// 分享 url = 本场比赛页（og:image 为通用摆动卡）；「保存图片卡」直链带 ?by=<署名> 的 OG PNG
// （微信主路径：存图再发，图上有名字）。署名 = 昵称 ?? 趣味默认名，可就地改名（零注册）。

export function MatchSwingShare({
  swing,
  matchId,
  locale,
  ogPath,
}: {
  swing: MatchSwing;
  matchId: string;
  locale: Locale;
  ogPath: string;
}) {
  const [personalWin, setPersonalWin] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    track("swing_card_view", { matchId });
    let alive = true;
    (async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;
        if (alive) setUid(session.user.id);
        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const j = (await res.json()) as {
          nickname?: string | null;
          recent?: { home: string; away: string; won: boolean }[];
        };
        if (alive && j.nickname) setNickname(j.nickname);
        const won = (j.recent ?? []).some(
          (x) => x.won && x.home === swing.homeName && x.away === swing.awayName
        );
        if (alive && won) setPersonalWin(true);
      } catch {
        /* 个性化/署名失败不影响主功能 */
      }
    })();
    return () => {
      alive = false;
    };
  }, [matchId, swing.homeName, swing.awayName]);

  const effectiveName = nickname ?? (uid ? defaultName(uid, locale) : null);
  const parts = swingShareParts(swing, locale, personalWin, effectiveName ?? undefined);
  const { heroName, before: b, after: a, score, up } = parts;
  const heroColor = up ? "#1be27f" : "#ff5436";
  const ogWithBy = effectiveName ? `${ogPath}&by=${encodeURIComponent(effectiveName)}` : ogPath;

  const C: Record<
    Locale,
    {
      win: string;
      upset: string;
      shareBtn: string;
      saveImg: string;
      copied: string;
      copyFail: string;
      as: string;
      rename: string;
      save: string;
      cancel: string;
      saveErr: string;
    }
  > = {
    zh: {
      win: "🎯 你猜中了这场爆冷",
      upset: "🔥 爆冷瞬间",
      shareBtn: "🔗 分享这一刻",
      saveImg: "保存图片卡",
      copied: "已复制，去粘贴分享 👍",
      copyFail: "复制失败，可截图分享",
      as: "署名",
      rename: "✎ 改名",
      save: "保存",
      cancel: "取消",
      saveErr: "名字不合法（2–20 字、无敏感词）",
    },
    en: {
      win: "🎯 You called this upset",
      upset: "🔥 Upset moment",
      shareBtn: "🔗 Share this",
      saveImg: "Save image card",
      copied: "Copied — paste to share 👍",
      copyFail: "Copy failed — screenshot to share",
      as: "as",
      rename: "✎ Rename",
      save: "Save",
      cancel: "Cancel",
      saveErr: "Invalid name (2–20 chars, no banned words)",
    },
    es: {
      win: "🎯 Acertaste esta sorpresa",
      upset: "🔥 Momento sorpresa",
      shareBtn: "🔗 Compartir esto",
      saveImg: "Guardar tarjeta",
      copied: "Copiado — pega para compartir 👍",
      copyFail: "Error al copiar — comparte una captura",
      as: "como",
      rename: "✎ Cambiar nombre",
      save: "Guardar",
      cancel: "Cancelar",
      saveErr: "Nombre no válido (2–20 caracteres, sin palabras prohibidas)",
    },
    pt: {
      win: "🎯 Você acertou essa zebra",
      upset: "🔥 Momento de zebra",
      shareBtn: "🔗 Compartilhar",
      saveImg: "Salvar cartão",
      copied: "Copiado — cole para compartilhar 👍",
      copyFail: "Falha ao copiar — compartilhe uma captura",
      as: "como",
      rename: "✎ Renomear",
      save: "Salvar",
      cancel: "Cancelar",
      saveErr: "Nome inválido (2–20 caracteres, sem palavras proibidas)",
    },
    de: {
      win: "🎯 Diese Überraschung getippt",
      upset: "🔥 Überraschungsmoment",
      shareBtn: "🔗 Teilen",
      saveImg: "Bildkarte speichern",
      copied: "Kopiert — zum Teilen einfügen 👍",
      copyFail: "Kopieren fehlgeschlagen — Screenshot teilen",
      as: "als",
      rename: "✎ Umbenennen",
      save: "Speichern",
      cancel: "Abbrechen",
      saveErr: "Ungültiger Name (2–20 Zeichen, keine gesperrten Wörter)",
    },
    fr: {
      win: "🎯 Vous aviez prédit cette surprise",
      upset: "🔥 Moment de surprise",
      shareBtn: "🔗 Partager",
      saveImg: "Enregistrer la carte",
      copied: "Copié — collez pour partager 👍",
      copyFail: "Échec de la copie — partagez une capture",
      as: "sous",
      rename: "✎ Renommer",
      save: "Enregistrer",
      cancel: "Annuler",
      saveErr: "Nom invalide (2–20 caractères, sans mots interdits)",
    },
  };
  const t = C[locale] ?? C.en;
  const c = { ...t, headline: personalWin ? t.win : t.upset };

  const shareUrl = matchUrl(matchId, locale);

  async function onShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: parts.title, text: parts.text, url: shareUrl });
        track("swing_share_click", { matchId, method: "native", personalized: personalWin });
      } catch {
        track("swing_share_click", { matchId, method: "native_dismiss", personalized: personalWin });
      }
      return;
    }
    const ok = copyText(`${parts.text} ${shareUrl}`);
    setToast(ok ? c.copied : c.copyFail);
    track("swing_share_click", { matchId, method: ok ? "copy" : "copy_fail", personalized: personalWin });
    window.setTimeout(() => setToast(null), 2500);
  }

  async function saveName() {
    if (saving) return; // 防极速双击在 disabled 生效前重复提交
    const v = draft.trim();
    if (!v) return;
    setSaving(true);
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
        track("nickname_set", { source: "swing_share" });
      } else {
        setToast(c.saveErr);
        window.setTimeout(() => setToast(null), 2500);
      }
    } catch {
      /* 忽略 */
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="fade-up mt-4 rounded-lg border border-green/40 bg-surface p-4 shadow-glow">
      <div className="mb-2 text-[11px] font-semibold text-muted">{c.headline}</div>
      <div className="flex items-center gap-3">
        {swing.hero.flag && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={swing.hero.flag} alt="" className="h-6 w-9 shrink-0 rounded-[2px] object-cover" />
        )}
        <span className="font-head min-w-0 truncate text-base font-bold">{heroName}</span>
        <span className="ml-auto flex shrink-0 items-baseline gap-2">
          <span className="text-sm text-muted line-through">{b}%</span>
          <span className="text-xs text-muted">→</span>
          <span className="font-head text-2xl font-bold" style={{ color: heroColor }}>
            {a}%
          </span>
        </span>
      </div>
      <div className="mt-1 text-xs text-muted">{score}</div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={onShare}
          className="rounded-md bg-green px-3 py-1.5 text-xs font-bold text-[#06231a]"
        >
          {c.shareBtn}
        </button>
        <a
          href={ogWithBy}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted underline-offset-2 hover:underline"
        >
          {c.saveImg}
        </a>
      </div>

      <div className="mt-2 text-[11px] text-muted">
        {editing ? (
          <span className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                else if (e.key === "Escape") setEditing(false);
              }}
              maxLength={20}
              autoFocus
              aria-label={c.as}
              className="w-32 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-text"
            />
            <button type="button" disabled={saving} onClick={saveName} className="font-semibold text-green">
              {c.save}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-muted">
              {c.cancel}
            </button>
          </span>
        ) : (
          effectiveName && (
            <button
              type="button"
              onClick={() => {
                setDraft(nickname ?? effectiveName ?? "");
                setEditing(true);
              }}
            >
              {c.as} <span className="text-text">{effectiveName}</span> ·{" "}
              <span className="text-green">{c.rename}</span>
            </button>
          )
        )}
      </div>

      {toast && <div className="mt-2 text-[11px] text-green">{toast}</div>}
    </section>
  );
}
