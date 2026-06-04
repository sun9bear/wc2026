// DeepSeek（OpenAI 兼容）聊天补全。仅服务端使用。
// 带超时（AbortController，默认 15s；受限场景如 cron 可传更短值）：避免挂死、吃满 maxDuration。
export async function chat(system: string, user: string, timeoutMs = 15000): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("缺少 DEEPSEEK_API_KEY");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.85,
        max_tokens: 400,
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
    const j = (await res.json()) as { choices: { message: { content: string } }[] };
    return (j.choices?.[0]?.message?.content ?? "").trim();
  } finally {
    clearTimeout(timer);
  }
}
