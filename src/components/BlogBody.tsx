import Link from "next/link";
import type { ReactNode } from "react";
import { splitBodyByAssets, type BlogAsset } from "@/lib/blog/assets";
import { TweetEmbed } from "@/components/TweetEmbed";

// 最小安全 markdown→JSX（不 dangerouslySetInnerHTML，React 自动转义文本，杜绝 XSS）。
// 覆盖 LLM 产出的子集：## h2 / ### h3 / - 列表 / 段落；行内 **粗体** 与 [文字](/站内路径)。
// 手动文章：正文含 [[asset:N]] 标记 → 切分后在标记处插入素材块（推文嵌入 / 图片），图文混排。
// 外链（http(s)）由硬闸/提示词拦下，这里也只把站内相对链接渲染成 <Link>，其余只渲染文字。

function inline(text: string, kp: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let i = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={kp + i}>{m[1]}</strong>);
    } else {
      const href = m[3];
      const label = m[2];
      out.push(
        href.startsWith("/") ? (
          <Link key={kp + i} href={href} className="text-green underline underline-offset-2">
            {label}
          </Link>
        ) : (
          label
        )
      );
    }
    last = re.lastIndex;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// 渲染一段 markdown 为块序列；kp 命名空间化 key（多段拼接时不撞）。
function renderBlocks(md: string, kp: string): ReactNode[] {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let k = 0;
  const flushP = () => {
    if (para.length) {
      const kk = k;
      blocks.push(
        <p key={kp + "p" + kk} className="my-3 text-sm leading-relaxed text-text/90 md:text-base">
          {inline(para.join(" "), kp + "p" + kk + "i")}
        </p>
      );
      k++;
      para = [];
    }
  };
  const flushL = () => {
    if (list.length) {
      const items = list;
      const kk = k;
      blocks.push(
        <ul key={kp + "u" + kk} className="my-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text/90 md:text-base">
          {items.map((li, j) => (
            <li key={j}>{inline(li, kp + "u" + kk + "-" + j)}</li>
          ))}
        </ul>
      );
      k++;
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushP();
      flushL();
      continue;
    }
    if (line.startsWith("### ")) {
      flushP();
      flushL();
      blocks.push(
        <h3 key={kp + "h" + k} className="font-head mb-1 mt-5 text-base font-semibold md:text-lg">
          {inline(line.slice(4), kp + "h" + k + "i")}
        </h3>
      );
      k++;
    } else if (line.startsWith("## ")) {
      flushP();
      flushL();
      blocks.push(
        <h2 key={kp + "h" + k} className="font-head mb-1.5 mt-6 text-lg font-bold md:text-xl">
          {inline(line.slice(3), kp + "h" + k + "i")}
        </h2>
      );
      k++;
    } else if (line.startsWith("- ")) {
      flushP();
      list.push(line.slice(2));
    } else {
      flushL();
      para.push(line);
    }
  }
  flushP();
  flushL();
  return blocks;
}

// 素材块：embed → 官方推文嵌入；image → 图片 + 图注/署名。越界/缺失 → 不渲染（fail-closed）。
function AssetBlock({ asset, locale }: { asset: BlogAsset | undefined; locale: "en" | "zh" }) {
  if (!asset) return null;
  if (asset.type === "embed") return <TweetEmbed url={asset.url} />;
  const caption = locale === "zh" ? asset.captionZh : asset.captionEn;
  const meta = [caption, asset.credit].filter(Boolean).join(" · ");
  return (
    <figure className="my-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset.url}
        alt={asset.alt ?? caption ?? ""}
        loading="lazy"
        decoding="async"
        className="w-full rounded-lg border border-border object-cover"
      />
      {meta && <figcaption className="mt-1.5 text-xs text-muted">{meta}</figcaption>}
    </figure>
  );
}

export function BlogBody({
  md,
  assets = [],
  locale = "en",
}: {
  md: string;
  assets?: BlogAsset[];
  locale?: "en" | "zh";
}) {
  const parts = splitBodyByAssets(md);
  return (
    <div>
      {parts.map((p, i) =>
        p.kind === "md" ? (
          <div key={"s" + i}>{renderBlocks(p.text, "s" + i + "-")}</div>
        ) : (
          <AssetBlock key={"s" + i} asset={assets[p.index]} locale={locale} />
        )
      )}
    </div>
  );
}
