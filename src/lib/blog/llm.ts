// P3c blog 生成/审核的 LLM 包装：
//   生成 en=Gemini(复用 gemini.chat)、zh=DeepSeek(独立调用，加大 max_tokens + 模型可配为 V4 Pro)。
//   软闸用"异 provider"降相关性盲点：en 文章由 DeepSeek 审、zh 文章由 Gemini 审。
// 注意：本机网络对 Gemini geo 拦截（见 gemini.ts）——生产 Vercel 可用；本机测试请用 mock（见 scripts/probe-generate.ts）。

import { chat as geminiChat } from "@/lib/ai/gemini";

const GEN_TIMEOUT = 60_000; // blog 比短评大；DeepSeek V4 Pro 较慢，给宽限
const REVIEW_TIMEOUT = 30_000;

/** blog 专用 DeepSeek 调用（独立于 ai/deepseek.ts 的短文案 chat：更大 max_tokens + JSON 模式 + 可配模型）。 */
async function deepseekBlog(system: string, user: string, timeoutMs: number): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("缺少 DEEPSEEK_API_KEY");
  const model = process.env.DEEPSEEK_BLOG_MODEL ?? "deepseek-chat"; // 用户的 V4 Pro：部署时设 DEEPSEEK_BLOG_MODEL
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
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_tokens: 2200,
        response_format: { type: "json_object" },
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

/** 生成：en→Gemini，zh→DeepSeek(V4 Pro)。两 provider 互不抢配额，可并行；临时过载自动重试 1 次。 */
export async function generate(locale: "en" | "zh", system: string, user: string): Promise<string> {
  return withRetry(() => (locale === "en" ? geminiChat(system, user, GEN_TIMEOUT) : deepseekBlog(system, user, GEN_TIMEOUT)));
}

/** 软闸审核（异 provider）：en 文章→DeepSeek 审、zh 文章→Gemini 审；临时过载自动重试 1 次。 */
export async function review(locale: "en" | "zh", prompt: string): Promise<string> {
  const sys = "You are a strict reviewer. Return ONLY valid JSON.";
  return withRetry(() => (locale === "en" ? deepseekBlog(sys, prompt, REVIEW_TIMEOUT) : geminiChat(sys, prompt, REVIEW_TIMEOUT)));
}
