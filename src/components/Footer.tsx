import Link from "next/link";

// 全站页脚：合规链接 + 中性声明（AdSense 审核与用户都会找这些）。
export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-xl px-4 pb-8 pt-12 text-center text-[11px] leading-relaxed text-muted">
      <nav className="mb-2 flex items-center justify-center gap-3">
        <Link href="/about" className="transition-colors hover:text-text">
          关于 &amp; 玩法
        </Link>
        <span className="opacity-40">·</span>
        <Link href="/privacy" className="transition-colors hover:text-text">
          隐私政策
        </Link>
        <span className="opacity-40">·</span>
        <Link href="/disclaimer" className="transition-colors hover:text-text">
          免责声明
        </Link>
      </nav>
      <p>仅供娱乐 · 积分无现实价值 · 不可兑换 · 与 FIFA／世界杯等官方组织无关</p>
    </footer>
  );
}
