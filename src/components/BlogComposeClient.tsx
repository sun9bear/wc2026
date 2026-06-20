"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 后台「写热点」表单：角度 + 素材清单(推文嵌入/上传图) → 模型双语生成 → 落 needs_review 草稿(去列表预览/发布)。
// 图片上传走 /api/admin/blog/upload；生成走 /api/admin/blog {action:compose}。手动文章一律人工发布。

type AssetDraft = {
  type: "embed" | "image";
  url: string;
  desc: string;
  captionEn: string;
  captionZh: string;
  credit: string;
  rightsOk: boolean;
  uploading: boolean;
};

const emptyAsset = (): AssetDraft => ({
  type: "embed",
  url: "",
  desc: "",
  captionEn: "",
  captionZh: "",
  credit: "",
  rightsOk: false,
  uploading: false,
});

const inputCls = "w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm";

export function BlogComposeClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [angle, setAngle] = useState("");
  const [titleHint, setTitleHint] = useState("");
  const [en, setEn] = useState(true);
  const [zh, setZh] = useState(true);
  const [assets, setAssets] = useState<AssetDraft[]>([emptyAsset()]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const patch = (i: number, p: Partial<AssetDraft>) =>
    setAssets((arr) => arr.map((a, j) => (j === i ? { ...a, ...p } : a)));

  const upload = async (i: number, file: File) => {
    patch(i, { uploading: true });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/blog/upload", { method: "POST", body: fd });
      const j = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !j.url) throw new Error(j.error || `HTTP ${res.status}`);
      patch(i, { url: j.url, uploading: false });
    } catch (e) {
      patch(i, { uploading: false });
      setMsg("✗ 上传失败: " + (e instanceof Error ? e.message : ""));
    }
  };

  const submit = async () => {
    if (!angle.trim()) return setMsg("请先填角度/要点");
    if (!en && !zh) return setMsg("至少选一种语言");
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      const tag = `素材 #${i + 1}`;
      if (!a.url.trim()) return setMsg(`✗ ${tag} 缺 ${a.type === "image" ? "图片" : "推文 URL"}`);
      if (a.type === "embed" && !a.desc.trim()) return setMsg(`✗ ${tag}（推文）缺「说明」——模型抓不到推文，靠它理解`);
      if (a.type === "image" && !a.credit.trim()) return setMsg(`✗ ${tag}（图片）缺「来源/署名」（必填，会渲染出处）`);
      if (a.type === "image" && !a.rightsOk) return setMsg(`✗ ${tag}（图片）需勾选「我确认有权使用此图」`);
    }
    setBusy(true);
    setMsg("生成中…（约 30-60 秒，双语 + 软闸）");
    try {
      const locales = [en ? "en" : null, zh ? "zh" : null].filter(Boolean);
      const body = {
        action: "compose",
        input: {
          angle,
          titleHint: titleHint || undefined,
          locales,
          assets: assets.map((a) => ({
            type: a.type,
            url: a.url.trim(),
            desc: a.desc.trim(),
            captionEn: a.captionEn || undefined,
            captionZh: a.captionZh || undefined,
            credit: a.type === "image" ? a.credit : undefined,
          })),
        },
      };
      const res = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json()) as { slug?: string; reason?: string; error?: string };
      if (!res.ok) {
        if (res.status === 401) {
          location.reload();
          return;
        }
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      setMsg(`✓ 草稿已生成「${j.slug}」（${j.reason || "manual_review"}）。在下方列表预览/发布。`);
      setAngle("");
      setTitleHint("");
      setAssets([emptyAsset()]);
      router.refresh();
    } catch (e) {
      setMsg("✗ " + (e instanceof Error ? e.message : "生成失败"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-border bg-surface-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold"
      >
        ✍️ 写热点（手动撰写器）
        <span className="text-xs text-muted">{open ? "收起 ▲" : "展开 ▼"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-3">
          <div>
            <label className="mb-1 block text-xs text-muted">角度 / 要点（必填，模型据此写）</label>
            <textarea
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              rows={2}
              placeholder="例：梅西热身赛梅开二度，阿根廷状态拉满；结合我们的夺冠概率聊聊"
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">标题提示（可选）</label>
            <input value={titleHint} onChange={(e) => setTitleHint(e.target.value)} className={inputCls} />
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted">语言：</span>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={en} onChange={(e) => setEn(e.target.checked)} /> EN
            </label>
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={zh} onChange={(e) => setZh(e.target.checked)} /> 中文
            </label>
          </div>

          {/* 素材清单 */}
          <div className="space-y-2">
            <div className="text-xs text-muted">素材（按顺序，模型自动排版插入）</div>
            {assets.map((a, i) => (
              <div key={i} className="space-y-1.5 rounded-md border border-border bg-surface p-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={a.type}
                    onChange={(e) => patch(i, { type: e.target.value as "embed" | "image" })}
                    className="rounded border border-border bg-surface-2 px-1.5 py-1"
                  >
                    <option value="embed">推文嵌入</option>
                    <option value="image">图片</option>
                  </select>
                  <span className="text-muted">#{i + 1}</span>
                  {assets.length > 1 && (
                    <button
                      onClick={() => setAssets((arr) => arr.filter((_, j) => j !== i))}
                      className="ml-auto text-red hover:underline"
                    >
                      删除
                    </button>
                  )}
                </div>
                {a.type === "image" ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && upload(i, e.target.files[0])}
                        className="text-xs"
                      />
                      {a.uploading && <span className="text-xs text-muted">上传中…</span>}
                      {a.url && !a.uploading && <span className="text-xs text-green">✓ 已上传</span>}
                    </div>
                    <input
                      value={a.credit}
                      onChange={(e) => patch(i, { credit: e.target.value })}
                      placeholder="来源/署名（必填，会渲染出处）"
                      className={inputCls}
                    />
                    <label className="flex items-center gap-1.5 text-[11px] text-muted">
                      <input type="checkbox" checked={a.rightsOk} onChange={(e) => patch(i, { rightsOk: e.target.checked })} />
                      我确认有权使用此图
                    </label>
                  </div>
                ) : (
                  <input
                    value={a.url}
                    onChange={(e) => patch(i, { url: e.target.value })}
                    placeholder="推文 URL，如 https://x.com/.../status/..."
                    className={inputCls}
                  />
                )}
                <input
                  value={a.desc}
                  onChange={(e) => patch(i, { desc: e.target.value })}
                  placeholder={a.type === "image" ? "说明（可选，模型会直接看图解读）" : "推文说明（必填，模型抓不到推文，靠它理解）"}
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input value={a.captionEn} onChange={(e) => patch(i, { captionEn: e.target.value })} placeholder="图注 EN(可选)" className={inputCls} />
                  <input value={a.captionZh} onChange={(e) => patch(i, { captionZh: e.target.value })} placeholder="图注 中文(可选)" className={inputCls} />
                </div>
              </div>
            ))}
            <button
              onClick={() => setAssets((arr) => [...arr, emptyAsset()])}
              className="rounded border border-border px-2 py-1 text-xs text-muted hover:text-text"
            >
              + 加一条素材
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={busy}
              className="rounded-md bg-green px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {busy ? "生成中…" : "生成草稿"}
            </button>
            {msg && (
              <span className={`text-sm font-medium ${msg.startsWith("✓") ? "text-green" : msg.startsWith("生成中") ? "text-muted" : "text-red"}`}>
                {msg}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted">
            手动文章生成后为「待审」草稿，需你在下方列表预览、满意后手动发布（不自动发）。嵌入用官方 X，图片走本站存储。
          </p>
        </div>
      )}
    </div>
  );
}
