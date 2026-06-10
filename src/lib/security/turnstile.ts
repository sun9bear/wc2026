// Cloudflare Turnstile 服务端验票。仅服务端使用。
// 设计为「无密钥即休眠」：未配置 TURNSTILE_SECRET_KEY 时直接放行(true)，
// 这样接入代码即便先合并、Vercel 还没配密钥，也绝不会误拦正常用户；
// 一旦配置密钥(启用)：无 token 或验票失败/超时一律拒绝(fail-closed)。
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // 休眠：未启用 Turnstile
  if (!token) return false; // 已启用但无 token → 拒绝

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false; // 网络/超时 → 保守拒绝
  } finally {
    clearTimeout(timer);
  }
}
