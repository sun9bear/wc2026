"use client";

import { useEffect, useRef } from "react";

// 官方 X 嵌入：blockquote + 全页单例加载 widgets.js（不托管推文图）。
// SSR 先渲染「查看原推」兜底链接；hydration 后 widgets.js 美化；删推/加载失败仍有链接。
declare global {
  interface Window {
    twttr?: { widgets?: { load: (el?: HTMLElement) => void } };
  }
}

export function TweetEmbed({ url }: { url: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = "twitter-wjs";
    const run = () => window.twttr?.widgets?.load(ref.current ?? undefined);
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = "https://platform.twitter.com/widgets.js";
      s.onload = run;
      document.body.appendChild(s);
    } else {
      run();
    }
  }, [url]);
  return (
    <div ref={ref} className="my-4 flex justify-center">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url} className="text-green underline underline-offset-2">
          查看原推 / View on X →
        </a>
      </blockquote>
    </div>
  );
}
