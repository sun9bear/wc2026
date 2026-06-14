import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";
import { localeHref } from "@/i18n";
import { localizedAlternates } from "@/lib/seo/canonical";

const META = {
  zh: {
    title: "关于 & 玩法 · 环球足球预测",
    description:
      "一个免费、不涉及任何金钱的足球预测娱乐小游戏：用虚拟积分预测比赛、冲排行榜、解锁段位。仅供娱乐。",
  },
  en: {
    title: "About & How to Play · World Cup Predictor 2026",
    description:
      "A free football prediction game with no real money involved: predict matches with virtual points, climb the leaderboard, unlock ranks. For fun only.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { ...META[locale], alternates: localizedAlternates("/about", locale) };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const locale = await getLocale();

  if (locale === "en") {
    // 英文版正文：禁词自查通过（无 odds/bet/wager/stake/payout/multiplier，倍率→reward rates）
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <Link href={localeHref(locale, "/")} className="text-xs text-muted">
          ← Back
        </Link>
        <h1 className="font-head mt-3 text-2xl font-bold">About &amp; How to Play</h1>
        <p className="mt-1 text-xs text-muted">World Cup Predictor · 2026</p>

        <div className="mt-5 space-y-4">
          <Section title="What is this?">
            <p>
              World Cup Predictor is a <strong>free, just-for-fun</strong> football prediction
              game for fans worldwide. It involves <strong>no real money</strong> — only virtual
              points — so everyone can predict matches and see who reads the game best.
            </p>
          </Section>

          <Section title="How to play">
            <p>1. You get free virtual points the moment you join (no phone/email — play anonymously).</p>
            <p>2. On any match page, pick the result you believe in (Home win / Draw / Away win) and put in some points.</p>
            <p>3. After the final whistle, correct predictions earn points at the reward rate locked when you submitted.</p>
            <p>4. Use points to climb the leaderboard, unlock ranks, earn achievements and keep a daily check-in streak.</p>
          </Section>

          <Section title="About reward rates">
            <p>
              Reward rates are <strong>generated dynamically</strong> from how the community
              predicts — popular picks earn less, unpopular picks earn more. They exist purely
              for fun and <strong>do not represent real probabilities or advice</strong>.
            </p>
          </Section>

          <Section title="AI content">
            <p>
              Match previews, hot takes and recaps are AI-generated, <strong>for entertainment only</strong>,
              and do not constitute advice of any kind.
            </p>
          </Section>

          <Section title="Important">
            <p>
              Points are <strong>virtual items with no real-world value</strong>. They cannot be
              purchased, redeemed, withdrawn or transferred — this is fan entertainment, nothing more.
            </p>
            <p>This is an independent, fan-made site for entertainment.</p>
          </Section>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted">
          See also:{" "}
          <Link href={localeHref(locale, "/privacy")} className="underline hover:text-text">
            Privacy
          </Link>
          {" · "}
          <Link href={localeHref(locale, "/disclaimer")} className="underline hover:text-text">
            Disclaimer
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href={localeHref(locale, "/")} className="text-xs text-muted">
        ← 返回
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">关于 &amp; 玩法</h1>
      <p className="mt-1 text-xs text-muted">环球足球预测 · 2026</p>

      <div className="mt-5 space-y-4">
        <Section title="这是什么">
          <p>
            「环球足球预测」是一个面向全球球迷的<strong>免费、纯娱乐</strong>足球预测小游戏。
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
          <p>本站为独立运营的球迷自制娱乐产品。</p>
        </Section>
      </div>

      <p className="mt-6 text-center text-[11px] text-muted">
        另见：
        <Link href={localeHref(locale, "/privacy")} className="underline hover:text-text">
          隐私政策
        </Link>
        {" · "}
        <Link href={localeHref(locale, "/disclaimer")} className="underline hover:text-text">
          免责声明
        </Link>
      </p>
    </main>
  );
}
