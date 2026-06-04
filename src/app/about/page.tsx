import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 & 玩法 · 环球足球预测",
  description: "一个免费、不涉及任何金钱的足球预测娱乐小游戏：用虚拟积分预测比赛、冲排行榜、解锁段位。仅供娱乐。",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        ← 返回
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">关于 &amp; 玩法</h1>
      <p className="mt-1 text-xs text-muted">环球足球预测 · 2026</p>

      <div className="mt-5 space-y-4">
        <Section title="这是什么">
          <p>
            「环球足球预测」是一个面向全球华人球迷的<strong>免费、纯娱乐</strong>足球预测小游戏。
            它<strong>不涉及任何真实金钱</strong>，只使用虚拟积分，让大家一起预测比赛、看谁眼光更准。
          </p>
        </Section>

        <Section title="怎么玩">
          <p>1. 进入即获赠虚拟积分（无需注册手机号/邮箱，匿名即可玩）。</p>
          <p>2. 在比赛页选择你看好的结果（主胜 / 平局 / 客胜），投入一些虚拟积分。</p>
          <p>3. 比赛结束后，命中的预测会按当时锁定的倍率折算虚拟积分。</p>
          <p>4. 用积分冲排行榜、解锁段位、完成成就、每日签到攒连胜。</p>
        </Section>

        <Section title="关于倍率">
          <p>
            倍率由社区的预测分布<strong>动态生成</strong>——越多人看好的结果倍率越低，冷门结果倍率越高，
            纯粹用来增加趣味和盘感，<strong>不代表任何真实概率或建议</strong>。
          </p>
        </Section>

        <Section title="AI 趣味内容">
          <p>
            赛前前瞻、冷热门看点、赛后小结由 AI 自动生成，<strong>仅供娱乐</strong>，
            不构成任何形式的建议。
          </p>
        </Section>

        <Section title="重要说明">
          <p>
            本站的积分为<strong>虚拟道具</strong>，<strong>无任何现实价值</strong>，
            无法购买、兑换、提现或转让，纯属球迷娱乐。
          </p>
          <p>本站为球迷自制，与 FIFA、世界杯及任何官方组织、赞助商均无关联。</p>
        </Section>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted">
        另见：
        <Link href="/privacy" className="underline hover:text-text">
          隐私政策
        </Link>
        {" · "}
        <Link href="/disclaimer" className="underline hover:text-text">
          免责声明
        </Link>
      </p>
    </main>
  );
}
