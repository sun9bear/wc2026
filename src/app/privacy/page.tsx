import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 · 环球足球预测",
  description: "环球足球预测的隐私政策：我们收集哪些信息、如何使用 Cookie、以及第三方广告（Google AdSense）说明。",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="font-head mb-2 text-sm font-semibold text-green">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-text/90">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Link href="/" className="text-xs text-muted">
        ← 返回
      </Link>
      <h1 className="font-head mt-3 text-2xl font-bold">隐私政策</h1>
      <p className="mt-1 text-xs text-muted">最后更新：2026 年 6 月</p>

      <div className="mt-5 space-y-4">
        <Section title="概述">
          <p>
            本政策说明「环球足球预测」（下称"本站"）在你使用时会收集哪些信息、如何使用，
            以及第三方广告与 Cookie 的相关说明。本站是一个免费、不涉及金钱的娱乐小游戏。
          </p>
        </Section>

        <Section title="我们收集的信息">
          <p>
            本站采用<strong>匿名登录</strong>，<strong>不收集</strong>你的姓名、邮箱、手机号等个人身份信息。
          </p>
          <p>
            为提供游戏功能，我们会保存与你的匿名账户关联的<strong>游戏数据</strong>（如预测记录、虚拟积分余额、签到记录），
            以及用于安全与统计的<strong>基础访问日志</strong>。
          </p>
        </Section>

        <Section title="Cookie 与本地存储">
          <p>
            本站使用 Cookie / 浏览器本地存储来保持你的登录状态、记住偏好并改善体验。
            你可以在浏览器中清除或限制这些存储，但可能影响部分功能。
          </p>
        </Section>

        <Section title="第三方广告（Google AdSense）">
          <p>本站使用第三方广告服务商 <strong>Google AdSense</strong> 展示广告。</p>
          <p>
            Google 等第三方厂商会使用 Cookie，根据你对本站及其他网站的访问情况投放广告。
          </p>
          <p>
            你可以访问{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-text"
            >
              Google 广告设置
            </a>{" "}
            停用个性化广告；或访问{" "}
            <a
              href="https://www.aboutads.info"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-text"
            >
              aboutads.info
            </a>{" "}
            了解如何停用第三方厂商的广告 Cookie。
          </p>
        </Section>

        <Section title="数据存储与安全">
          <p>
            本站托管于海外云服务（Vercel / Supabase）。我们采取合理措施保护数据，
            但任何互联网传输都无法保证绝对安全。
          </p>
          <p>本站<strong>不会向第三方出售</strong>你的信息。</p>
        </Section>

        <Section title="儿童">
          <p>本站为大众娱乐产品，不针对未满 13 岁的儿童收集信息。</p>
        </Section>

        <Section title="政策更新与联系">
          <p>本政策可能不时更新，更新后将在本页公布。</p>
          <p>
            如有疑问，可联系：<span className="text-text">js5559sun@proton.me</span>
          </p>
        </Section>
      </div>
    </main>
  );
}
