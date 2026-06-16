import type { Locale } from "@/i18n";
import type { AdvanceRequirements as Req, AdvanceRecord } from "@/lib/prob/requirements";

// 出线门槛面板（服务端渲染）：选中球队后，按「战绩(积分+净胜球)」由优到劣列出出线概率，
// 并标出保底锁定门槛 + 可执行提示（还需 +N 分）。文案本页专属，6 语内联，免动全局 Dict。

interface UI {
  title: string;
  remaining: string;
  home: string;
  away: string;
  rank: (lo: number, hi: number) => string;
  win: string;
  draw: string;
  loss: string;
  allPlayed: string;
  clinch: (pts: number, gd: string) => string;
  more: (n: number) => string;
  already: string;
  noClinch: string;
  curPts: (n: number) => string;
  note: string;
  locked: string;
}

const T: Record<Locale, UI> = {
  zh: {
    title: "🎯 出线门槛",
    rank: (lo, hi) => (lo === hi ? `小组第${lo}` : `小组第${lo}-${hi}`),
    remaining: "剩余",
    home: "主",
    away: "客",
    win: "胜",
    draw: "平",
    loss: "负",
    allPlayed: "已踢完",
    clinch: (pts, gd) => `拿到 ${pts} 分（净胜 ${gd}）即锁定出线`,
    more: (n) => `还需 +${n} 分`,
    already: "🎆 已确定出线！",
    noClinch: "靠自身已无法 100% 保证，需看其他小组场次",
    curPts: (n) => `当前 ${n} 分`,
    note: "净胜球按 主胜1-0/平1-1/客胜0-1 估算；基于 Elo 模型上千次抽样，仅供娱乐",
    locked: "锁定",
  },
  en: {
    title: "🎯 What you need",
    rank: (lo, hi) => (lo === hi ? `#${lo} in group` : `#${lo}–${hi} in group`),
    remaining: "Left",
    home: "H",
    away: "A",
    win: "W",
    draw: "D",
    loss: "L",
    allPlayed: "Done",
    clinch: (pts, gd) => `${pts} pts (GD ${gd}) clinches a spot`,
    more: (n) => `+${n} pt${n > 1 ? "s" : ""} to go`,
    already: "🎆 Already through!",
    noClinch: "Can't guarantee it on your own — depends on other groups",
    curPts: (n) => `now ${n} pts`,
    note: "GD estimated as 1-0 / 1-1 / 0-1; based on thousands of Elo-model sims, for fun only",
    locked: "Clinched",
  },
  es: {
    title: "🎯 Lo que necesitas",
    rank: (lo, hi) => (lo === hi ? `#${lo} del grupo` : `#${lo}–${hi} del grupo`),
    remaining: "Faltan",
    home: "L",
    away: "V",
    win: "G",
    draw: "E",
    loss: "P",
    allPlayed: "Listo",
    clinch: (pts, gd) => `${pts} pts (DG ${gd}) asegura el pase`,
    more: (n) => `faltan +${n}`,
    already: "🎆 ¡Ya clasificado!",
    noClinch: "No puedes asegurarlo solo — depende de otros grupos",
    curPts: (n) => `ahora ${n} pts`,
    note: "DG estimada como 1-0 / 1-1 / 0-1; miles de simulaciones del modelo Elo, solo por diversión",
    locked: "Asegurado",
  },
  pt: {
    title: "🎯 O que você precisa",
    rank: (lo, hi) => (lo === hi ? `#${lo} do grupo` : `#${lo}–${hi} do grupo`),
    remaining: "Faltam",
    home: "C",
    away: "F",
    win: "V",
    draw: "E",
    loss: "D",
    allPlayed: "Fim",
    clinch: (pts, gd) => `${pts} pts (SG ${gd}) garante a vaga`,
    more: (n) => `faltam +${n}`,
    already: "🎆 Já classificado!",
    noClinch: "Não dá para garantir sozinho — depende de outros grupos",
    curPts: (n) => `agora ${n} pts`,
    note: "SG estimado como 1-0 / 1-1 / 0-1; milhares de simulações do modelo Elo, só diversão",
    locked: "Garantido",
  },
  de: {
    title: "🎯 Was du brauchst",
    rank: (lo, hi) => (lo === hi ? `Gruppe #${lo}` : `Gruppe #${lo}–${hi}`),
    remaining: "Offen",
    home: "H",
    away: "A",
    win: "S",
    draw: "U",
    loss: "N",
    allPlayed: "Fertig",
    clinch: (pts, gd) => `${pts} Pkt (TD ${gd}) sichert das Weiterkommen`,
    more: (n) => `noch +${n}`,
    already: "🎆 Schon weiter!",
    noClinch: "Allein nicht sicherbar — hängt von anderen Gruppen ab",
    curPts: (n) => `aktuell ${n} Pkt`,
    note: "TD genähert als 1-0 / 1-1 / 0-1; Tausende Elo-Modell-Simulationen, nur zum Spaß",
    locked: "Sicher",
  },
  fr: {
    title: "🎯 Ce qu'il te faut",
    rank: (lo, hi) => (lo === hi ? `#${lo} du groupe` : `#${lo}–${hi} du groupe`),
    remaining: "Restant",
    home: "D",
    away: "E",
    win: "V",
    draw: "N",
    loss: "D",
    allPlayed: "Fini",
    clinch: (pts, gd) => `${pts} pts (diff. ${gd}) qualifie d'office`,
    more: (n) => `+${n} à prendre`,
    already: "🎆 Déjà qualifié !",
    noClinch: "Pas garanti seul — dépend des autres groupes",
    curPts: (n) => `${n} pts actuellement`,
    note: "Diff. estimée 1-0 / 1-1 / 0-1 ; des milliers de simulations du modèle Elo, pour le fun",
    locked: "Qualifié",
  },
};

function recordLabel(r: AdvanceRecord, u: UI): string {
  const parts: string[] = [];
  if (r.w) parts.push(`${r.w}${u.win}`);
  if (r.d) parts.push(`${r.d}${u.draw}`);
  if (r.l) parts.push(`${r.l}${u.loss}`);
  return parts.join(" ") || u.allPlayed;
}

const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;
const pct = (p: number) => (p >= 0.995 ? 100 : p <= 0.005 ? 0 : Math.round(p * 100));

export function AdvanceRequirements({
  data,
  locale,
  teamLabel,
}: {
  data: Req;
  locale: Locale;
  teamLabel: string;
}) {
  const u = T[locale] ?? T.en;
  if (!data.records.length) return null;

  const need = data.clinchPts !== null ? data.clinchPts - data.curPts : null;

  return (
    <section className="mb-4 rounded-lg border border-green/40 bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <h2 className="font-head text-sm font-semibold">{u.title}</h2>
        <span className="text-[11px] text-muted">
          {teamLabel} · {u.curPts(data.curPts)}
          {data.remaining.length > 0 && (
            <>
              {" · "}
              {u.remaining}:{" "}
              {data.remaining
                .map((m) => `${locale === "zh" ? m.oppZh : m.oppName}(${m.home ? u.home : u.away})`)
                .join(" ")}
            </>
          )}
        </span>
      </div>

      {data.clinchPts !== null ? (
        <p className="mb-2 rounded-md bg-green/10 px-2 py-1 text-[11px] font-medium text-green">
          {need !== null && need <= 0
            ? u.already
            : `✅ ${u.clinch(data.clinchPts, signed(data.clinchGd ?? 0))} · ${u.more(need ?? 0)}`}
        </p>
      ) : (
        <p className="mb-2 text-[11px] text-muted">{u.noClinch}</p>
      )}

      <div className="space-y-1">
        {data.records.map((r) => {
          const v = pct(r.p);
          const lo = pct(r.pLow);
          const hi = pct(r.pHigh);
          const range = hi - lo >= 8;
          const clinched = r.pLow >= 0.995;
          const color = clinched || v >= 60 ? "text-green" : v <= 2 ? "text-red" : "text-gold";
          return (
            <div
              key={`${r.pts}|${r.gd}`}
              className={`flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
                clinched ? "border-green/50 bg-green/5" : "border-border bg-surface-2"
              }`}
            >
              <span className="min-w-0">
                <span className="font-medium">{recordLabel(r, u)}</span>
                <span className="ml-2 text-[11px] tabular-nums text-muted">
                  {r.pts}
                  {locale === "zh" ? " 分" : " pts"} · {signed(r.gd)} · {u.rank(r.rankLo, r.rankHi)}
                </span>
              </span>
              <span className={`shrink-0 font-head font-bold tabular-nums ${color}`}>
                {clinched && <span className="mr-1 text-[10px] font-semibold">🎆 {u.locked}</span>}
                {range ? `${lo}–${hi}%` : `${v}%`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-muted">{u.note}</p>
    </section>
  );
}
