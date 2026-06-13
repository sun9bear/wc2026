import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "免责声明 · 环球足球预测",
  description: "环球足球预测免责声明：纯娱乐产品，虚拟积分无现实价值、不可兑换，与任何官方组织无关。",
  alternates: { canonical: "https://www.wc2026.cool/disclaimer" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default function DisclaimerPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        ← 返回
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">免责声明</h1>
      <p className="mt-1 text-xs text-muted">环球足球预测 · 2026</p>

      <div className="mt-5 space-y-4">
        <Section title="娱乐性质">
          <p>本站为球迷自制的趣味娱乐产品，所有功能与内容<strong>仅供娱乐</strong>。</p>
        </Section>

        <Section title="虚拟积分">
          <p>
            本站使用的积分为<strong>虚拟道具</strong>，<strong>不涉及任何真实金钱</strong>，
            <strong>无任何现实价值</strong>，无法购买、兑换、提现或转让。
          </p>
        </Section>

        <Section title="AI 与数据">
          <p>
            赛前前瞻、冷热门看点、赛后小结等由 AI 自动生成，倍率由社区数据动态计算，
            <strong>均仅供娱乐，不构成任何建议</strong>。
          </p>
          <p>赛程与比分来自公开数据源，可能存在延迟或误差，请以官方公布为准。</p>
        </Section>

        <Section title="无官方关联">
          <p>
            本站为非官方、球迷自制产品，与 <strong>FIFA</strong>、<strong>世界杯</strong>
            及任何赛事官方组织、球队、赞助商均<strong>无任何关联或授权</strong>。
            相关名称仅用于客观描述比赛。
          </p>
        </Section>

        <Section title="责任限制">
          <p>
            在适用法律允许的范围内，本站对因使用本产品而产生的任何直接或间接损失不承担责任。
            继续使用本站即表示你已阅读并同意以上条款。
          </p>
        </Section>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted">
        另见：
        <Link href="/about" className="underline hover:text-text">
          关于 &amp; 玩法
        </Link>
        {" · "}
        <Link href="/privacy" className="underline hover:text-text">
          隐私政策
        </Link>
      </p>
    </main>
  );
}
