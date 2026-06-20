// P3c blog 生成/审核的 LLM 包装：
//   生成 en=Gemini(复用 gemini.chat)、zh=DeepSeek(独立调用，加大 max_tokens + 模型可配为 V4 Pro)。
//   软闸用"异 provider"降相关性盲点：en 文章由 DeepSeek 审、zh 文章由 Gemini 审。
// 注意：本机网络对 Gemini geo 拦截（见 gemini.ts）——生产 Vercel 可用；本机测试请用 mock（见 scripts/probe-generate.ts）。

import { chat as geminiChat, type GeminiImage } from "@/lib/ai/gemini";

const GEN_TIMEOUT = 60_000; // blog 比短评大；DeepSeek V4 Pro 较慢，给宽限
const REVIEW_TIMEOUT = 30_000;

/** blog 专用 DeepSeek 调用（独立于 ai/deepseek.ts 的短文案 chat：更大 max_tokens + JSON 模式 + 可配模型）。 */
async function deepseekBlog(system: string, user: string, timeoutMs: number, images?: GeminiImage[]): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("缺少 DEEPSEEK_API_KEY");
  const model = process.env.DEEPSEEK_BLOG_MODEL?.trim() || "deepseek-chat"; // V4 Pro：设 DEEPSEEK_BLOG_MODEL=deepseek-v4-pro；trim 防 env 尾随空白
  // 多模态：有图则 user content 用 OpenAI 数组格式（文字 + image_url data URI）；无图则纯字符串（与原行为一致）。
  const userContent: unknown = images?.length
    ? [
        { type: "text", text: user },
        ...images.flatMap((im) => [
          { type: "text", text: im.label },
          { type: "image_url", image_url: { url: `data:${im.mimeType};base64,${im.dataB64}` } },
        ]),
      ]
    : user;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        temperature: 0.6,
        max_tokens: 2200,
        // 有图时不强制 json_object：部分多模态实现 vision+JSON 模式不兼容（疑致 zh 带图失败）；
        // 提示词已要求"只输出 JSON"，parseArticle 也容忍非严格 JSON（从首尾花括号抠）。无图仍用 json_object（更稳）。
        ...(images?.length ? {} : { response_format: { type: "json_object" as const } }),
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = (await res.json()) as { choices: { message: { content: string } }[] };
    return (j.choices?.[0]?.message?.content ?? "").trim();
  } finally {
    clearTimeout(timer);
  }
}

// 仅对"临时性"错误重试（503/429/过载/限流/连接重置）；超时/aborted 不重试（避免把慢调用翻倍、撑爆 maxDuration）。
function isTransient(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return /\b(429|500|502|503|504)\b/.test(m) || m.includes("unavailable") || m.includes("high demand") || m.includes("overload") || m.includes("rate limit") || m.includes("econnreset");
}
async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransient(e) || i === attempts - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1))); // 退避后重试 1 次
    }
  }
  throw last;
}

// blog 专用 Gemini 模型（与 DEEPSEEK_BLOG_MODEL 对称，不影响 gen-content/settle）。
// 设 GEMINI_BLOG_MODEL=gemini-3.1-flash-lite 即用之；未设则回落 gemini.ts 默认（id 失效会自动解析最新 flash-lite）。
const geminiBlogModel = (): string | undefined => process.env.GEMINI_BLOG_MODEL?.trim() || undefined; // trim：防 env 值带尾随换行/空白致 400

/** 拉取图片→base64（两家多模态共用）。失败抛错，由 generate 降级为无图。 */
async function fetchImageB64(url: string): Promise<{ mimeType: string; dataB64: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`图片拉取失败 ${res.status}`);
  const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
  const dataB64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  return { mimeType, dataB64 };
}

/** 生成：en→Gemini(GEMINI_BLOG_MODEL)，zh→DeepSeek(V4 Pro)。images 为可选多模态输入（手动撰写器传图，自动管线不传）。 */
export async function generate(
  locale: "en" | "zh",
  system: string,
  user: string,
  images?: { label: string; url: string }[]
): Promise<string> {
  // 拉图→base64（两家共用）；单张失败仅丢该图、不阻断生成（降级靠角度/desc）。
  const fetched: GeminiImage[] | undefined = images?.length
    ? (
        await Promise.all(
          images.map(async (im) => {
            try {
              return { label: im.label, ...(await fetchImageB64(im.url)) };
            } catch {
              return null;
            }
          })
        )
      ).filter((x): x is GeminiImage => x !== null)
    : undefined;
  return withRetry(() =>
    locale === "en"
      ? geminiChat(system, user, GEN_TIMEOUT, geminiBlogModel(), fetched)
      : deepseekBlog(system, user, GEN_TIMEOUT, fetched)
  );
}

/**
 * 图片描述器：DeepSeek chat API 不支持图像（实测 image_url 400），故用 Gemini 视觉把每张图描述成一句事实，
 * en/zh 生成都改用这段文字（用户因此不必手填「说明」）。单张失败→空串；整体失败→全空串（降级靠角度）。
 */
export async function caption(urls: string[]): Promise<string[]> {
  if (!urls.length) return [];
  const fetched = (
    await Promise.all(
      urls.map(async (url, i) => {
        try {
          const { mimeType, dataB64 } = await fetchImageB64(url);
          return { label: `Image ${i + 1}:`, mimeType, dataB64 };
        } catch {
          return null;
        }
      })
    )
  ).filter((x): x is GeminiImage => x !== null);
  if (!fetched.length) return urls.map(() => "");
  const sys = "You factually describe images for a sports blog editor. No speculation, no opinions.";
  const user = `Describe each numbered image in ONE short factual sentence (who/what, any on-screen text, setting). Output ONLY JSON: {"captions":[...]} with exactly ${urls.length} strings, in order.`;
  try {
    const raw = await withRetry(() => geminiChat(sys, user, REVIEW_TIMEOUT, geminiBlogModel(), fetched));
    const a = raw.indexOf("{");
    const b = raw.lastIndexOf("}");
    const o = a >= 0 && b > a ? (JSON.parse(raw.slice(a, b + 1)) as { captions?: unknown }) : {};
    const caps = Array.isArray(o.captions) ? o.captions.map(String) : [];
    return urls.map((_, i) => caps[i] ?? "");
  } catch {
    return urls.map(() => "");
  }
}

/** 软闸审核（异 provider）：en 文章→DeepSeek 审、zh 文章→Gemini 审；临时过载自动重试 1 次。 */
export async function review(locale: "en" | "zh", prompt: string): Promise<string> {
  const sys = "You are a strict reviewer. Return ONLY valid JSON.";
  return withRetry(() =>
    locale === "en" ? deepseekBlog(sys, prompt, REVIEW_TIMEOUT) : geminiChat(sys, prompt, REVIEW_TIMEOUT, geminiBlogModel())
  );
}
