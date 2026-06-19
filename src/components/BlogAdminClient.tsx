"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AdminEntry } from "@/lib/blog/admin";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function api(body: Record<string, unknown>): Promise<{ affected?: number }> {
  const res = await fetch("/api/admin/blog", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; affected?: number };
  if (!res.ok) throw new ApiError(json.error || `HTTP ${res.status}`, res.status);
  return json;
}

export function BlogAdminLogin() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api({ action: "login", token });
      location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "登录失败");
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="mx-auto mt-16 max-w-xs space-y-3">
      <h1 className="font-head text-lg font-bold">Blog Admin</h1>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="管理口令"
        autoFocus
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
      />
      {err && <p className="text-xs text-red">{err}</p>}
      <button
        type="submit"
        disabled={busy || !token}
        className="w-full rounded-md bg-green px-3 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {busy ? "…" : "登录"}
      </button>
    </form>
  );
}

const FILTERS = ["all", "needs_review", "published", "draft", "hidden", "rejected"] as const;
const STATUS_LABEL: Record<string, string> = {
  draft: "草稿",
  needs_review: "待审",
  published: "已发布",
  hidden: "隐藏",
  rejected: "拒绝",
};
const STATUS_COLOR: Record<string, string> = {
  published: "text-green",
  needs_review: "text-amber",
  rejected: "text-red",
  hidden: "text-muted",
  draft: "text-muted",
};

// 模块级（不在 render 内创建组件，避免 react-hooks/purity 重建）。
function AdminBtn({
  onClick,
  children,
  danger,
  busy,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
  busy: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded border px-2 py-1 text-xs transition-colors disabled:opacity-40 ${
        danger ? "border-red/40 text-red hover:border-red" : "border-border text-text hover:border-green/60"
      }`}
    >
      {children}
    </button>
  );
}

export function BlogAdminClient({ entries }: { entries: AdminEntry[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [openWhy, setOpenWhy] = useState<string | null>(null);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: entries.length };
    for (const e of entries) m[e.status] = (m[e.status] ?? 0) + 1;
    return m;
  }, [entries]);
  const shown = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.status === filter)),
    [entries, filter]
  );

  const toggle = (slug: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(slug)) n.delete(slug);
      else n.add(slug);
      return n;
    });
  const allShownSelected = shown.length > 0 && shown.every((e) => sel.has(e.slug));
  const toggleAll = () =>
    setSel((s) => {
      const n = new Set(s);
      if (allShownSelected) shown.forEach((e) => n.delete(e.slug));
      else shown.forEach((e) => n.add(e.slug));
      return n;
    });

  const run = async (body: Record<string, unknown>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await api(body);
      setMsg(`✓ ${r.affected ?? 0} 条`);
      setSel(new Set());
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        location.reload(); // 会话过期 → 服务端重新评估 isAuthed() → 回到登录表单
        return;
      }
      setMsg(`✗ ${e instanceof Error ? e.message : "失败"}`);
    } finally {
      setBusy(false);
    }
  };

  const selArr = [...sel];

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <h1 className="font-head text-xl font-bold">Blog Admin</h1>
        <button onClick={() => run({ action: "logout" })} className="text-xs text-muted hover:text-text">
          退出
        </button>
      </div>

      {/* 状态筛选 */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              filter === f ? "border-green bg-green/10 text-green" : "border-border text-muted hover:text-text"
            }`}
          >
            {f === "all" ? "全部" : STATUS_LABEL[f]} {counts[f] ?? 0}
          </button>
        ))}
      </div>

      {/* 批量操作条 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          <input type="checkbox" checked={allShownSelected} onChange={toggleAll} /> 全选({shown.length})
        </label>
        <span className="text-xs text-muted">已选 {selArr.length}</span>
        <div className="ml-auto flex flex-wrap gap-1.5">
          <AdminBtn busy={busy} onClick={() => run({ action: "setStatus", status: "published", slugs: selArr })}>批量发布</AdminBtn>
          <AdminBtn busy={busy} onClick={() => run({ action: "setStatus", status: "needs_review", slugs: selArr })}>转待审</AdminBtn>
          <AdminBtn busy={busy} onClick={() => run({ action: "setStatus", status: "hidden", slugs: selArr })}>隐藏</AdminBtn>
          <AdminBtn busy={busy} danger onClick={() => run({ action: "delete", slugs: selArr }, `删除 ${selArr.length} 条？不可恢复`)}>
            批量删除
          </AdminBtn>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-muted">{msg}</p>}

      {/* 列表 */}
      <ul className="mt-3 space-y-2">
        {shown.map((e) => (
          <li key={e.slug} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={sel.has(e.slug)} onChange={() => toggle(e.slug)} className="mt-1" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-semibold ${STATUS_COLOR[e.status] ?? "text-muted"}`}>
                    {STATUS_LABEL[e.status] ?? e.status}
                  </span>
                  {e.eventType && <span className="text-[10px] text-muted">{e.eventType}</span>}
                </div>
                <div className="mt-0.5 truncate text-sm font-medium">{e.titleEn || e.titleZh || e.slug}</div>
                {e.titleZh && <div className="truncate text-xs text-muted">{e.titleZh}</div>}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted">
                  <code className="text-muted">{e.slug}</code>
                  {e.status === "published" && (
                    <a href={`/blog/${e.slug}`} target="_blank" rel="noreferrer" className="text-green hover:underline">
                      查看 ↗
                    </a>
                  )}
                  {(e.reason || e.hardEn?.length || e.hardZh?.length) && (
                    <button onClick={() => setOpenWhy(openWhy === e.slug ? null : e.slug)} className="hover:text-text">
                      为何待审/拒绝？
                    </button>
                  )}
                </div>
                {openWhy === e.slug && (
                  <div className="mt-1.5 rounded border border-border bg-surface-2 p-2 text-[11px] text-muted">
                    {e.reason && <div>reason: {e.reason}</div>}
                    {e.hardEn?.length ? <div>en 硬闸: {e.hardEn.join("; ")}</div> : null}
                    {e.hardZh?.length ? <div>zh 硬闸: {e.hardZh.join("; ")}</div> : null}
                  </div>
                )}
                {/* 单条操作 */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {e.status !== "published" && (
                    <AdminBtn busy={busy} onClick={() => run({ action: "setStatus", status: "published", slugs: [e.slug] })}>发布</AdminBtn>
                  )}
                  {e.status === "published" && (
                    <AdminBtn busy={busy} onClick={() => run({ action: "setStatus", status: "needs_review", slugs: [e.slug] })}>撤下</AdminBtn>
                  )}
                  {e.status !== "rejected" && (
                    <AdminBtn busy={busy} onClick={() => run({ action: "setStatus", status: "rejected", slugs: [e.slug] })}>拒绝</AdminBtn>
                  )}
                  <AdminBtn busy={busy} danger onClick={() => run({ action: "delete", slugs: [e.slug] }, `删除「${e.slug}」？不可恢复`)}>
                    删除
                  </AdminBtn>
                </div>
              </div>
            </div>
          </li>
        ))}
        {shown.length === 0 && <li className="py-8 text-center text-sm text-muted">无条目</li>}
      </ul>
    </div>
  );
}
