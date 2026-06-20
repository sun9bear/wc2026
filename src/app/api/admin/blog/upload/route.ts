import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthed } from "@/lib/blog/admin";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs"; // Buffer / crypto
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// 后台图片上传：admin 鉴权 → 限 image/* + ≤5MB → 随机文件名 → 存 blog-media 公开桶 → 返回公开 URL。
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "bad form" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "仅限图片" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "图片需 ≤5MB" }, { status: 400 });

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
  const path = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const db = getServerSupabase();
  const { error } = await db.storage.from("blog-media").upload(path, bytes, {
    contentType: file.type,
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = db.storage.from("blog-media").getPublicUrl(path);
  return NextResponse.json({ ok: true, url: data.publicUrl });
}
