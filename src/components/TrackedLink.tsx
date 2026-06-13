"use client";

import Link from "next/link";
import { track } from "@/lib/track";

// 带埋点的 Link（任务 4）：服务端页面里需要埋点的链接包一层（sendBeacon 跳转后仍送达）。
export function TrackedLink({
  href,
  event,
  props,
  className,
  children,
}: {
  href: string;
  event: string;
  props?: Record<string, unknown>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track(event, props)}>
      {children}
    </Link>
  );
}
