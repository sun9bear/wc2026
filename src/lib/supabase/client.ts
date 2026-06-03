import { createClient } from "@supabase/supabase-js";

// 浏览器端 Supabase 客户端（匿名 key）。
// 占位回退：未配置 .env.local 时仍可构建；连接在填入真实 key 后生效。
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(url, anonKey);
