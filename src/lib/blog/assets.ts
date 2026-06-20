// 手动文章素材（推文嵌入 / 图片）类型 + 正文 [[asset:N]] 标记切分。
// 渲染层（BlogBody）据此把正文切成 markdown 片段与素材块交替渲染（图文混排）。

export interface BlogAsset {
  type: "embed" | "image";
  url: string; // embed: 推文 URL；image: blog-media 公开 URL
  desc?: string; // 喂模型用（它看不到图/抓不到推文），不渲染
  captionEn?: string;
  captionZh?: string;
  credit?: string; // image 类必填：来源/署名，渲染出处
  alt?: string; // image 类无障碍 alt
}

export type BodyPart = { kind: "md"; text: string } | { kind: "asset"; index: number };

/** 把正文按 [[asset:N]]（N 从 1 起）切成「markdown 片段 / 素材引用」序列。index 已转 0-based。 */
export function splitBodyByAssets(body: string): BodyPart[] {
  const parts: BodyPart[] = [];
  const re = /\[\[asset:(\d+)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    if (m.index > last) parts.push({ kind: "md", text: body.slice(last, m.index) });
    parts.push({ kind: "asset", index: Number(m[1]) - 1 });
    last = re.lastIndex;
  }
  if (last < body.length) parts.push({ kind: "md", text: body.slice(last) });
  return parts;
}
