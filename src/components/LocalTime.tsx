"use client";

import { useEffect, useState } from "react";
import { type Locale, BCP47_LOCALE } from "@/i18n";

// 开赛时间统一用浏览器本地时区渲染（修复：服务端 toLocaleString 按 Vercel UTC 渲染，
// 与客户端组件的本地时间互相矛盾）。挂载前渲染占位避免 hydration 不一致。
// tz 默认 true：附带本地时区缩写(如 GMT+8 / PDT)，避免用户误以为是场馆时间/UTC（用户反馈）。
export function LocalTime({
  iso,
  locale,
  mode = "time",
  tz = true,
}: {
  iso: string;
  locale: Locale;
  mode?: "time" | "datetime";
  tz?: boolean;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(iso);
    const lc = BCP47_LOCALE[locale] ?? "en-US";
    const opts: Intl.DateTimeFormatOptions =
      mode === "datetime"
        ? { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
        : { hour: "2-digit", minute: "2-digit" };
    if (tz) opts.timeZoneName = "short";
    setText(d.toLocaleString(lc, opts));
  }, [iso, locale, mode, tz]);

  return <span suppressHydrationWarning>{text ?? "--:--"}</span>;
}
