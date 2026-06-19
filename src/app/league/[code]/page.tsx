import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeagueBoard } from "@/lib/league/getLeagueBoard";
import { normalizeLeagueCode } from "@/lib/league/code";
import { InviteCopy } from "@/components/InviteCopy";
import { PageContainer } from "@/components/PageContainer";
import { fmtPoints } from "@/lib/format";
import { getLocale } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } }; // 口令即私密邀请，绝不进索引
}

interface LeagueBoardCopy {
  codeLabel: string;
  members: (n: number) => string;
  points: string;
  hitRate: string;
  record: (w: number, t: number) => string;
  owner: string;
  empty: string;
  mine: string;
  join: string;
}
const TXT: Record<import("@/i18n").Locale, LeagueBoardCopy> = {
  zh: {
    codeLabel: "擂台口令",
    members: (n: number) => `${n} 人参战`,
    points: "积分",
    hitRate: "命中率",
    record: (w: number, t: number) => `${w}/${t} 中`,
    owner: "擂主",
    empty: "还没有成员，把口令发给朋友吧！",
    mine: "← 我的擂台",
    join: "我也要建擂台 →",
  },
  en: {
    codeLabel: "League code",
    members: (n: number) => `${n} players`,
    points: "Points",
    hitRate: "Hit rate",
    record: (w: number, t: number) => `${w}/${t} correct`,
    owner: "Owner",
    empty: "No members yet — share the code with friends!",
    mine: "← My leagues",
    join: "Start your own league →",
  },
  es: {
    codeLabel: "Código de la liga",
    members: (n: number) => `${n} jugadores`,
    points: "Puntos",
    hitRate: "Aciertos",
    record: (w: number, t: number) => `${w}/${t} aciertos`,
    owner: "Creador",
    empty: "Aún no hay miembros — ¡comparte el código con tus amigos!",
    mine: "← Mis ligas",
    join: "Crea tu propia liga →",
  },
  pt: {
    codeLabel: "Código da liga",
    members: (n: number) => `${n} jogadores`,
    points: "Pontos",
    hitRate: "Acertos",
    record: (w: number, t: number) => `${w}/${t} certos`,
    owner: "Dono",
    empty: "Ainda sem membros — compartilhe o código com seus amigos!",
    mine: "← Minhas ligas",
    join: "Crie sua própria liga →",
  },
  de: {
    codeLabel: "Liga-Code",
    members: (n: number) => `${n} Spieler`,
    points: "Punkte",
    hitRate: "Trefferquote",
    record: (w: number, t: number) => `${w}/${t} richtig`,
    owner: "Ersteller",
    empty: "Noch keine Mitglieder — teile den Code mit Freunden!",
    mine: "← Meine Ligen",
    join: "Eigene Liga starten →",
  },
  fr: {
    codeLabel: "Code de la ligue",
    members: (n: number) => `${n} joueurs`,
    points: "Points",
    hitRate: "Réussite",
    record: (w: number, t: number) => `${w}/${t} corrects`,
    owner: "Créateur",
    empty: "Aucun membre pour l'instant — partage le code avec tes amis !",
    mine: "← Mes ligues",
    join: "Crée ta propre ligue →",
  },
};

export default async function LeagueBoardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getLocale();
  const t = TXT[locale] ?? TXT.en;
  const board = await getLeagueBoard(normalizeLeagueCode(code), locale);
  if (!board) notFound();

  return (
    <PageContainer tier="standard">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-2xl font-bold md:text-3xl">🛡 {board.name}</h1>
        <Link href="/league" className="text-xs text-muted">
          {t.mine}
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-lg border border-green/40 bg-surface p-4">
        <div>
          <div className="text-[11px] text-muted md:text-xs">{t.codeLabel}</div>
          <div className="font-head text-2xl font-bold tracking-widest text-green">
            {board.code}
          </div>
          <div className="mt-0.5 text-[11px] text-muted md:text-xs">{t.members(board.members.length)}</div>
        </div>
        <InviteCopy code={board.code} locale={locale} />
      </div>

      {board.members.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted">{t.empty}</p>
      ) : (
        <ul className="mt-5 space-y-2">
          {board.members.map((m, i) => (
            <li
              key={`${m.nickname}-${i}`}
              className="flex items-center gap-3 rounded-md border border-border bg-surface-2 px-4 py-3"
            >
              <span className="font-head w-7 text-center text-lg font-bold text-muted">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {m.nickname}
                  {m.isOwner && (
                    <span className="ml-2 rounded-pill border border-gold/50 px-1.5 py-0.5 text-[9px] text-gold">
                      {t.owner}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted md:text-xs">
                  {t.record(m.won, m.total)} · {t.hitRate} {m.hitRate}%
                </div>
              </div>
              <div className="font-head text-lg font-bold text-green">{fmtPoints(m.points)}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 text-center">
        <Link href="/league" className="text-sm text-green">
          {t.join}
        </Link>
      </div>

    </PageContainer>
  );
}
