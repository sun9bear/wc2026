// Gemini（REST v1beta）聊天补全，仅服务端使用——本机网络调不通（geo 拦截），生产 Vercel 端可用。
// 签名对齐 deepseek.ts 的 chat(system, user, timeoutMs)，供英文内容管线替换底层模型。
// 模型：默认 gemini-2.5-flash-lite——短文案任务(短评/前瞻/冷热门)性价比最优：
//   2.5-flash-lite 默认【不思考】(3.x 系列默认思考会多烧 token+加延迟，对一行短评纯浪费)，
//   且 Tier2 限额最宽(RPM 10K / RPD 无限制)、单价最低。质量对短 banter 与 3.x 肉眼无差。
//   如需更带感的 banter 可改 GEMINI_MODEL=gemini-3.5-flash。若模型名失效(404)自动 ListModels 选最新 flash-lite。

const BASE = "https://generativelanguage.googleapis.com/v1beta";

let resolvedModel: string | null = null;

function preferredModel(): string {
  return resolvedModel ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
}

// ListModels 里挑 flash 主线模型（含 lite，排除 8b/image/live/tts/audio 变体）。
// 优先 lite（免费档限额更高），其次版本号最新，再次稳定版优先 preview。
async function resolveFlashModel(key: string, signal: AbortSignal): Promise<string | null> {
  const res = await fetch(`${BASE}/models?pageSize=200`, {
    headers: { "x-goog-api-key": key },
    signal,
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const candidates = (j.models ?? [])
    .map((m) => ({ ...m, short: m.name.replace(/^models\//, "") }))
    .filter(
      (m) =>
        /^gemini-[\d.]+-flash(-lite)?(-preview.*)?$/.test(m.short) &&
        (m.supportedGenerationMethods?.includes("generateContent") ?? true)
    )
    .sort((a, b) => {
      const lite = (s: string) => (s.includes("-lite") ? 1 : 0); // lite 优先（限额更高）
      const v = (s: string) => parseFloat(s.match(/gemini-([\d.]+)/)?.[1] ?? "0");
      const stable = (s: string) => (s.includes("preview") ? 0 : 1);
      return (
        lite(b.short) - lite(a.short) ||
        v(b.short) - v(a.short) ||
        stable(b.short) - stable(a.short)
      );
    });
  return candidates[0]?.short ?? null;
}

interface GenResponse {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
}

async function callGenerate(
  key: string,
  model: string,
  system: string,
  user: string,
  signal: AbortSignal
): Promise<Response> {
  return fetch(`${BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.9 },
    }),
    signal,
  });
}

export async function chat(system: string, user: string, timeoutMs = 15000): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("缺少 GEMINI_API_KEY");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let model = preferredModel();
    let res = await callGenerate(key, model, system, user, controller.signal);
    if (res.status === 404) {
      // 写死的模型名过期——动态解析一次并缓存（每个实例最多发生一次）。
      const found = await resolveFlashModel(key, controller.signal);
      if (found && found !== model) {
        resolvedModel = found;
        model = found;
        res = await callGenerate(key, model, system, user, controller.signal);
      }
    }
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = (await res.json()) as GenResponse;
    const text = (j.candidates?.[0]?.content?.parts ?? [])
      .filter((p) => p.text && !p.thought)
      .map((p) => p.text)
      .join("")
      .trim();
    if (!text) throw new Error("Gemini 空响应");
    return text;
  } finally {
    clearTimeout(timer);
  }
}
