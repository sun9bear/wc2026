import Link from "next/link";
import type { ReactNode } from "react";

// 最小安全 markdown→JSX（不 dangerouslySetInnerHTML，React 自动转义文本，杜绝 XSS）。
// 覆盖 LLM 产出的子集：## h2 / ### h3 / - 列表 / 段落；行内 **粗体** 与 [文字](/站内路径)。
// 外链（http(s)）理论上已被硬闸拦下，这里也只把站内相对链接渲染成 <Link>，其余只渲染文字。

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

export function BlogBody({ md }: { md: string }) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let k = 0;
  const flushP = () => {
    if (para.length) {
      const kk = k;
      blocks.push(
        <p key={"p" + kk} className="my-3 text-sm leading-relaxed text-text/90 md:text-base">
          {inline(para.join(" "), "p" + kk + "i")}
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
        <ul key={"u" + kk} className="my-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text/90 md:text-base">
          {items.map((li, j) => (
            <li key={j}>{inline(li, "u" + kk + "-" + j)}</li>
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
        <h3 key={"h" + k} className="font-head mb-1 mt-5 text-base font-semibold md:text-lg">
          {inline(line.slice(4), "h" + k + "i")}
        </h3>
      );
      k++;
    } else if (line.startsWith("## ")) {
      flushP();
      flushL();
      blocks.push(
        <h2 key={"h" + k} className="font-head mb-1.5 mt-6 text-lg font-bold md:text-xl">
          {inline(line.slice(3), "h" + k + "i")}
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
  return <div>{blocks}</div>;
}
