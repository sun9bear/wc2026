import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";

// 免责声明（双语，locale-adaptive）：EN-first 爬虫/英文用户看到英文版——尤其「无官方关联」段
// 是商标抗辩 + AdSense IP 审核的关键面，必须对英文受众可读。英文文案避开雷词（用 reward 不用 multiplier）。
const COPY = {
  zh: {
    title: "免责声明 · 环球足球预测",
    description:
      "环球足球预测免责声明：纯娱乐产品，虚拟积分无现实价值、不可兑换，与 FIFA 及任何官方组织无关。",
    back: "← 返回",
    h1: "免责声明",
    sub: "环球足球预测 · 2026",
    s1: "娱乐性质",
    s1body: "本站为球迷自制的趣味娱乐产品，所有功能与内容仅供娱乐。",
    s2: "虚拟积分",
    s2body:
      "本站使用的积分为虚拟道具，不涉及任何真实金钱，无任何现实价值，无法购买、兑换、提现或转让。",
    s3: "AI 与数据",
    s3body1:
      "赛前前瞻、冷热门看点、赛后小结等由 AI 自动生成，得分奖励由社区数据动态计算，均仅供娱乐，不构成任何建议。",
    s3body2: "赛程与比分来自公开数据源，可能存在延迟或误差，请以官方公布为准。",
    s4: "无官方关联",
    s4body:
      "本站为非官方、球迷自制产品，与 FIFA、世界杯及任何赛事官方组织、球队、赞助商均无任何关联或授权。相关名称仅用于客观描述比赛。",
    s5: "责任限制",
    s5body:
      "在适用法律允许的范围内，本站对因使用本产品而产生的任何直接或间接损失不承担责任。继续使用本站即表示你已阅读并同意以上条款。",
    seeAlso: "另见：",
    about: "关于 & 玩法",
    privacy: "隐私政策",
  },
  en: {
    title: "Disclaimer · World Cup Predictor 2026",
    description:
      "World Cup Predictor disclaimer: a free, fan-made entertainment product. Virtual points have no real value and are non-redeemable. Not affiliated with or endorsed by FIFA or any official World Cup organization.",
    back: "← Back",
    h1: "Disclaimer",
    sub: "World Cup Predictor · 2026",
    s1: "For entertainment only",
    s1body: "This is a fan-made, just-for-fun product. All features and content are for entertainment only.",
    s2: "Virtual points",
    s2body:
      "Points on this site are virtual items with no real-world value. They involve no real money and cannot be bought, redeemed, withdrawn, or transferred.",
    s3: "AI & data",
    s3body1:
      "Match previews, talking points and recaps are generated automatically by AI, and scoring rewards are computed from community data — all for entertainment only and not advice of any kind.",
    s3body2:
      "Fixtures and scores come from public data sources and may be delayed or inaccurate; official announcements prevail.",
    s4: "No official affiliation",
    s4body:
      "This is an unofficial, fan-made product. It is not affiliated with, authorized by, or endorsed by FIFA, the World Cup, or any official tournament body, team, or sponsor. Such names are used only to describe the matches.",
    s5: "Limitation of liability",
    s5body:
      "To the extent permitted by applicable law, this site is not liable for any direct or indirect loss arising from use of this product. By continuing to use this site, you confirm that you have read and agree to the terms above.",
    seeAlso: "See also: ",
    about: "About & how to play",
    privacy: "Privacy policy",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const c = COPY[await getLocale()];
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: "https://www.wc2026.cool/disclaimer" },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default async function DisclaimerPage() {
  const c = COPY[await getLocale()];
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        {c.back}
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">{c.h1}</h1>
      <p className="mt-1 text-xs text-muted">{c.sub}</p>

      <div className="mt-5 space-y-4">
        <Section title={c.s1}>
          <p>{c.s1body}</p>
        </Section>

        <Section title={c.s2}>
          <p>{c.s2body}</p>
        </Section>

        <Section title={c.s3}>
          <p>{c.s3body1}</p>
          <p>{c.s3body2}</p>
        </Section>

        <Section title={c.s4}>
          <p>{c.s4body}</p>
        </Section>

        <Section title={c.s5}>
          <p>{c.s5body}</p>
        </Section>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted">
        {c.seeAlso}
        <Link href="/about" className="underline hover:text-text">
          {c.about}
        </Link>
        {" · "}
        <Link href="/privacy" className="underline hover:text-text">
          {c.privacy}
        </Link>
      </p>
    </main>
  );
}
