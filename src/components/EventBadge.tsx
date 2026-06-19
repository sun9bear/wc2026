import type { BlogLocale } from "@/lib/blog/published";

// 事件类型彩色徽章（与全站 green/gold/amber/red 配色一致）。未知/空类型不渲染。
const META: Record<string, { zh: string; en: string; cls: string }> = {
  upset: { zh: "爆冷", en: "Upset", cls: "border-amber/40 bg-amber/10 text-amber" },
  clinched: { zh: "锁定出线", en: "Clinched", cls: "border-green/40 bg-green/10 text-green" },
  eliminated: { zh: "出局", en: "Eliminated", cls: "border-red/40 bg-red/10 text-red" },
  swing: { zh: "概率剧变", en: "Big swing", cls: "border-gold/40 bg-gold/10 text-gold" },
  market_swing: { zh: "赔率异动", en: "Market move", cls: "border-border bg-surface-2 text-muted" },
};

export function EventBadge({ type, locale }: { type: string | null; locale: BlogLocale }) {
  if (!type) return null;
  const m = META[type];
  if (!m) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      {locale === "zh" ? m.zh : m.en}
    </span>
  );
}
