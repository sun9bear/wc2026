import { createClient } from "@supabase/supabase-js";

// 服务端 Supabase 客户端（service role key，仅在服务端使用，切勿暴露给浏览器）。
export function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? "placeholder-secret-key";
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
