"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Disclaimer } from "@/components/Disclaimer";
import { CheckinCard } from "@/components/CheckinCard";
import { MyTeamCard } from "@/components/MyTeamCard";
import { fmtPoints } from "@/lib/format";
import { copyText } from "@/lib/clipboard";
import { Skeleton } from "@/components/Skeleton";
import { defaultName } from "@/lib/identity/defaultName";
import { teamName } from "@/lib/football/teams";
import { getDict, localeHref, type Locale } from "@/i18n";

interface RecentBet {
  won: boolean;
  status: string; // won / lost / pending
  picks: string[]; // 各腿 code（home/draw/away）
  kickoff: string;
  settledAt?: string | null;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  multiplier: number;
  payout: number;
  stake: number;
  legs: number;
}
interface LedgerItem {
  reason: string;
  delta: number;
  at: string;
}

interface MeData {
  balance: number;
  nickname?: string | null;
  tier: string;
  tierCode?: string;
  total: number;
  won: number;
  lost: number;
  pending: number;
  hitRate: number;
  achievements: { id: string; icon: string; label: string; desc: string; earned: boolean }[];
  recent?: RecentBet[];
  pendingPicks?: RecentBet[];
  ledger?: LedgerItem[];
  streak?: number;
  bestStreak?: number;
  beatPct?: number | null;
}

// 竞猜记录 / 积分明细 文案（6 语种）。押项标签复用 Dict 的 t.match.home/draw/away。
const PICKS_TXT: Record<
  Locale,
  {
    picksTitle: string;
    ledgerTitle: string;
    pending: string;
    hit: string;
    miss: string;
    stake: string;
    payout: string;
    pick: string;
    reasons: Record<string, string>;
  }
> = {
  zh: { picksTitle: "我的竞猜", ledgerTitle: "积分明细", pending: "待结算", hit: "命中", miss: "未中", stake: "投入", payout: "派分", pick: "押", reasons: { signup: "注册赠送", bet_stake: "竞猜投入", bet_payout: "命中派分", daily: "每日签到", refund: "退回" } },
  en: { picksTitle: "My picks", ledgerTitle: "Points history", pending: "Pending", hit: "Hit", miss: "Miss", stake: "Stake", payout: "Payout", pick: "Pick", reasons: { signup: "Sign-up bonus", bet_stake: "Pick stake", bet_payout: "Payout", daily: "Daily check-in", refund: "Refund" } },
  es: { picksTitle: "Mis predicciones", ledgerTitle: "Historial de puntos", pending: "Pendiente", hit: "Acertó", miss: "Falló", stake: "Aporte", payout: "Pago", pick: "Eligió", reasons: { signup: "Bono de registro", bet_stake: "Aporte", bet_payout: "Pago por acierto", daily: "Check-in diario", refund: "Reembolso" } },
  pt: { picksTitle: "Minhas previsões", ledgerTitle: "Histórico de pontos", pending: "Pendente", hit: "Acertou", miss: "Errou", stake: "Aporte", payout: "Pagamento", pick: "Escolheu", reasons: { signup: "Bônus de registro", bet_stake: "Aporte", bet_payout: "Pagamento por acerto", daily: "Check-in diário", refund: "Reembolso" } },
  de: { picksTitle: "Meine Tipps", ledgerTitle: "Punkteverlauf", pending: "Offen", hit: "Treffer", miss: "Daneben", stake: "Einsatz", payout: "Auszahlung", pick: "Tipp", reasons: { signup: "Anmeldebonus", bet_stake: "Einsatz", bet_payout: "Auszahlung", daily: "Täglicher Check-in", refund: "Rückerstattung" } },
  fr: { picksTitle: "Mes prédictions", ledgerTitle: "Historique des points", pending: "En attente", hit: "Réussi", miss: "Raté", stake: "Mise", payout: "Gain", pick: "Choix", reasons: { signup: "Bonus d'inscription", bet_stake: "Mise", bet_payout: "Gain", daily: "Check-in quotidien", refund: "Remboursement" } },
};

// 世界杯开幕日（matchday 计数锚点，按用户本地日期算）
const DAY1 = "2026-06-11";

interface MeCopy {
  streakLine: (s: number, b: number) => string;
  copyRecord: string;
  copied: string;
  shareTitle: (n: number) => string;
  streakTag: (s: number) => string;
  beat: (p: number) => string;
  site: string;
  league: string;
  nameLabel: string;
  rename: string;
  save: string;
  cancel: string;
  nameErr: string;
}
const TXT: Record<Locale, MeCopy> = {
  zh: {
    streakLine: (s, b) => `🔥 当前 ${s} 连中 · 历史最佳 ${b}`,
    copyRecord: "📋 复制战绩",
    copied: "已复制 ✓",
    shareTitle: (n) => `⚽ WC2026 竞猜战绩 · 第${n}比赛日`,
    streakTag: (s) => `🔥 连中${s}场`,
    beat: (p) => `💪 击败 ${p}% 玩家`,
    site: "搜 wc2026.cool",
    league: "🛡 好友擂台 · 建房间拉朋友比一比 →",
    nameLabel: "我的名字",
    rename: "改名",
    save: "保存",
    cancel: "取消",
    nameErr: "名字不合法（2–20 字、无敏感词）",
  },
  en: {
    streakLine: (s, b) => `🔥 Current streak ${s} · best ${b}`,
    copyRecord: "📋 Copy my record",
    copied: "Copied ✓",
    shareTitle: (n) => `⚽ WC2026 picks · Matchday ${n}`,
    streakTag: (s) => `🔥 ${s}-win streak`,
    beat: (p) => `💪 Better than ${p}% of players`,
    site: "wc2026.cool",
    league: "🛡 Friends league · challenge your friends →",
    nameLabel: "My name",
    rename: "Rename",
    save: "Save",
    cancel: "Cancel",
    nameErr: "Invalid name (2–20 chars, no banned words)",
  },
  es: {
    streakLine: (s, b) => `🔥 Racha actual ${s} · mejor ${b}`,
    copyRecord: "📋 Copiar mi historial",
    copied: "Copiado ✓",
    shareTitle: (n) => `⚽ Predicciones WC2026 · Jornada ${n}`,
    streakTag: (s) => `🔥 racha de ${s}`,
    beat: (p) => `💪 Mejor que el ${p}% de los jugadores`,
    site: "wc2026.cool",
    league: "🛡 Liga de amigos · reta a tus amigos →",
    nameLabel: "Mi nombre",
    rename: "Cambiar nombre",
    save: "Guardar",
    cancel: "Cancelar",
    nameErr: "Nombre no válido (2–20 caracteres, sin palabras prohibidas)",
  },
  pt: {
    streakLine: (s, b) => `🔥 Sequência atual ${s} · melhor ${b}`,
    copyRecord: "📋 Copiar meu histórico",
    copied: "Copiado ✓",
    shareTitle: (n) => `⚽ Previsões WC2026 · Rodada ${n}`,
    streakTag: (s) => `🔥 sequência de ${s}`,
    beat: (p) => `💪 Melhor que ${p}% dos jogadores`,
    site: "wc2026.cool",
    league: "🛡 Liga de amigos · desafie seus amigos →",
    nameLabel: "Meu nome",
    rename: "Renomear",
    save: "Salvar",
    cancel: "Cancelar",
    nameErr: "Nome inválido (2–20 caracteres, sem palavras proibidas)",
  },
  de: {
    streakLine: (s, b) => `🔥 Aktuelle Serie ${s} · Bestwert ${b}`,
    copyRecord: "📋 Meine Bilanz kopieren",
    copied: "Kopiert ✓",
    shareTitle: (n) => `⚽ WC2026-Tipps · Spieltag ${n}`,
    streakTag: (s) => `🔥 ${s}er-Serie`,
    beat: (p) => `💪 Besser als ${p}% der Spieler`,
    site: "wc2026.cool",
    league: "🛡 Freunde-Liga · fordere deine Freunde heraus →",
    nameLabel: "Mein Name",
    rename: "Umbenennen",
    save: "Speichern",
    cancel: "Abbrechen",
    nameErr: "Ungültiger Name (2–20 Zeichen, keine gesperrten Wörter)",
  },
  fr: {
    streakLine: (s, b) => `🔥 Série en cours ${s} · meilleure ${b}`,
    copyRecord: "📋 Copier mon historique",
    copied: "Copié ✓",
    shareTitle: (n) => `⚽ Prédictions WC2026 · Journée ${n}`,
    streakTag: (s) => `🔥 série de ${s}`,
    beat: (p) => `💪 Meilleur que ${p}% des joueurs`,
    site: "wc2026.cool",
    league: "🛡 Ligue entre amis · défie tes amis →",
    nameLabel: "Mon nom",
    rename: "Renommer",
    save: "Enregistrer",
    cancel: "Annuler",
    nameErr: "Nom invalide (2–20 caractères, sans mots interdits)",
  },
};

// emoji 战绩格（任务 3）：按用户本地日期取最近一个比赛日的已结算注单。
function buildRecordCard(recent: RecentBet[], streak: number, beatPct: number | null | undefined, locale: Locale): string | null {
  if (recent.length === 0) return null;
  const t = TXT[locale] ?? TXT.en;
  const localDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA"); // YYYY-MM-DD
  const latestDay = recent.map((b) => localDate(b.kickoff)).sort().at(-1)!;
  const day = recent.filter((b) => localDate(b.kickoff) === latestDay);
  const squares = day.map((b) => (b.won ? "🟩" : "🟥")).join("");
  const wonN = day.filter((b) => b.won).length;
  const matchday =
    Math.max(0, Math.round((Date.parse(latestDay) - Date.parse(DAY1)) / 86400000)) + 1;
  const lines = [t.shareTitle(matchday), `${squares} (${wonN}/${day.length})`];
  if (streak >= 2) lines.push(t.streakTag(streak));
  if (beatPct != null && beatPct > 0) lines.push(t.beat(beatPct));
  lines.push(t.site);
  return lines.join("\n");
}

function Tile({ value, label, color = "text-text" }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2 p-4">
      <div className={`font-head text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-[11px] text-muted">{label}</div>
    </div>
  );
}

// 单条竞猜记录行：对阵 + 比分(已结算) + 押项 + 中/未中/待结算 + 投入/派分。
function PredRow({
  b,
  dict,
  px,
  locale,
}: {
  b: RecentBet;
  dict: ReturnType<typeof getDict>;
  px: (typeof PICKS_TXT)[Locale];
  locale: Locale;
}) {
  const settled = b.status !== "pending";
  const pickLabel = (c: string) =>
    c === "home" ? dict.match.home : c === "away" ? dict.match.away : dict.match.draw;
  const picks = b.picks.map(pickLabel).join(" / ");
  const badge = b.status === "won" ? px.hit : b.status === "lost" ? px.miss : px.pending;
  const badgeColor =
    b.status === "won" ? "text-green" : b.status === "lost" ? "text-muted" : "text-blue";
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5">
      <div className="flex items-center justify-between text-sm">
        <span className="min-w-0 flex-1 truncate">
          {teamName(b.home, locale)}{" "}
          {settled ? (
            <span className="font-head">
              {b.homeScore}-{b.awayScore}
            </span>
          ) : (
            <span className="text-muted">vs</span>
          )}{" "}
          {teamName(b.away, locale)}
        </span>
        <span className={`ml-2 shrink-0 text-xs font-semibold ${badgeColor}`}>{badge}</span>
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[11px] text-muted">
        <span className="min-w-0 truncate">
          {px.pick} {picks}
          {b.legs > 1 ? ` (×${b.legs})` : ""}
          {b.multiplier > 0 ? ` ·×${b.multiplier.toFixed(2)}` : ""}
        </span>
        <span className="ml-2 shrink-0">
          {b.status === "won"
            ? `${px.payout} +${fmtPoints(b.payout)}`
            : `${px.stake} ${fmtPoints(b.stake)}`}
        </span>
      </div>
    </div>
  );
}

export function MeClient({ locale }: { locale: Locale }) {
  const t = getDict(locale);
  const tx = TXT[locale] ?? TXT.en;
  const px = PICKS_TXT[locale] ?? PICKS_TXT.en;
  const [data, setData] = useState<MeData | null>(null);
  const [state, setState] = useState<"loading" | "none" | "ready">("loading");
  const [copied, setCopied] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameErr, setNameErr] = useState<string | null>(null);
  const effectiveName = nickname ?? (uid ? defaultName(uid, locale) : "");

  async function saveName() {
    if (saving) return; // 防极速双击在 disabled 生效前重复提交
    const v = draft.trim();
    if (!v) return;
    setSaving(true);
    setNameErr(null);
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
      } else {
        setNameErr(tx.nameErr);
      }
    } catch {
      setNameErr(tx.nameErr);
    } finally {
      setSaving(false);
    }
  }

  function doCopyRecord() {
    if (!data) return;
    const card = buildRecordCard(data.recent ?? [], data.streak ?? 0, data.beatPct, locale);
    if (card && copyText(card)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) {
        setState("none");
        return;
      }
      setUid(session.user.id);
      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const j = (await res.json()) as MeData;
        setData(j);
        setNickname(j.nickname ?? null);
        setState("ready");
      } else {
        setState("none");
      }
    })();
  }, []);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold">{t.me.title}</h1>
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          {t.common.back}
        </Link>
      </div>

      <MyTeamCard locale={locale} />

      <div className="mt-4">
        <CheckinCard locale={locale} />
      </div>

      {state === "loading" && (
        <div className="mt-5 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
          </div>
        </div>
      )}

      {state === "none" && (
        <div className="mt-16 text-center">
          <div className="text-5xl">🎯</div>
          <p className="mt-3 text-sm text-muted">{t.me.empty}</p>
          <Link href={localeHref(locale, "/")} className="mt-3 inline-block text-sm text-green">
            {t.me.emptyCta}
          </Link>
        </div>
      )}

      {state === "ready" && data && (
        <>
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-surface p-5">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <div className="font-head text-lg font-bold">
                <span className="text-gold">
                  🛡 {(data.tierCode && t.tiers[data.tierCode]) || data.tier}
                </span>
              </div>
              <div className="text-xs text-muted">{t.me.balanceLabel}</div>
            </div>
            <div className="font-head text-3xl font-bold text-green">{fmtPoints(data.balance)}</div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm">
            {editing ? (
              <span className="flex w-full items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    else if (e.key === "Escape") {
                      setEditing(false);
                      setNameErr(null);
                    }
                  }}
                  maxLength={20}
                  autoFocus
                  aria-label={tx.nameLabel}
                  className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-text"
                />
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveName}
                  className="shrink-0 rounded-md bg-green px-3 py-1 text-xs font-bold text-[#06231a]"
                >
                  {tx.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setNameErr(null);
                  }}
                  className="shrink-0 rounded-md border border-border px-3 py-1 text-xs text-muted"
                >
                  {tx.cancel}
                </button>
              </span>
            ) : (
              <>
                <span className="min-w-0 truncate text-muted">
                  {tx.nameLabel}：<span className="font-head text-text">{effectiveName}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(nickname ?? effectiveName ?? "");
                    setEditing(true);
                  }}
                  className="ml-2 shrink-0 rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted transition hover:border-green hover:text-green"
                >
                  {tx.rename}
                </button>
              </>
            )}
          </div>
          {nameErr && <div className="mt-1 text-[11px] text-red">{nameErr}</div>}

          {((data.recent?.length ?? 0) > 0 || (data.bestStreak ?? 0) > 0) && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm">
              <span className="text-gold">
                {(data.bestStreak ?? 0) > 0
                  ? tx.streakLine(data.streak ?? 0, data.bestStreak ?? 0)
                  : `${t.me.hitRate} ${data.hitRate}%`}
              </span>
              {(data.recent?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={doCopyRecord}
                  className="rounded-md border border-border bg-surface px-3 py-1 text-xs text-muted transition hover:border-green hover:text-green"
                >
                  {copied ? tx.copied : tx.copyRecord}
                </button>
              )}
            </div>
          )}

          <Link
            href={localeHref(locale, "/league")}
            className="mt-3 block rounded-md border border-border bg-surface-2 px-4 py-2.5 text-sm text-muted transition hover:border-green hover:text-green"
          >
            {tx.league}
          </Link>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Tile value={`${data.hitRate}%`} label={t.me.hitRate} color="text-green" />
            <Tile value={data.won} label={t.me.wins} color="text-gold" />
            <Tile value={data.total} label={t.me.total} />
            <Tile value={data.pending} label={t.me.pending} color="text-blue" />
          </div>

          {((data.pendingPicks?.length ?? 0) > 0 || (data.recent?.length ?? 0) > 0) && (
            <section className="mt-6">
              <h2 className="font-head mb-2 text-sm font-semibold">{px.picksTitle}</h2>
              <div className="space-y-1.5">
                {(data.pendingPicks ?? []).map((b, i) => (
                  <PredRow key={`p${i}`} b={b} dict={t} px={px} locale={locale} />
                ))}
                {[...(data.recent ?? [])].reverse().map((b, i) => (
                  <PredRow key={`s${i}`} b={b} dict={t} px={px} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {(data.ledger?.length ?? 0) > 0 && (
            <section className="mt-6">
              <h2 className="font-head mb-2 text-sm font-semibold">{px.ledgerTitle}</h2>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                {data.ledger!.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-muted">
                      <span className="tabular-nums text-[11px]">{e.at.slice(5, 10)}</span>{" "}
                      {px.reasons[e.reason] ?? e.reason}
                    </span>
                    <span
                      className={`font-head tabular-nums ${e.delta >= 0 ? "text-green" : "text-muted"}`}
                    >
                      {e.delta >= 0 ? "+" : ""}
                      {fmtPoints(e.delta)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.achievements && (
            <>
              <h2 className="font-head mb-2 mt-6 text-sm font-semibold">
                {t.me.achievements} · {data.achievements.filter((a) => a.earned).length}/{data.achievements.length}
              </h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {data.achievements.map((a) => (
                  <div
                    key={a.id}
                    className={`rounded-md border border-border bg-surface-2 p-3 text-center ${
                      a.earned ? "" : "opacity-40 grayscale"
                    }`}
                  >
                    <div className="text-2xl">{a.icon}</div>
                    <div className="mt-1 text-[11px] font-medium">{t.ach[a.id]?.label ?? a.label}</div>
                    <div className="text-[9px] text-muted">{t.ach[a.id]?.desc ?? a.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <footer className="mt-8 text-center">
        <Disclaimer />
      </footer>
    </main>
  );
}
