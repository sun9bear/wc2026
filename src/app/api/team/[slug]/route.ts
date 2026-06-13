import { NextResponse } from "next/server";
import { getTeamDetail } from "@/lib/prob/getTeamDetail";

export const maxDuration = 60;

// 球队详情 JSON（任务 C）：/me 的「我的主队」卡片客户端拉取。slug 未匹配返回 404。
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getTeamDetail(slug).catch(() => null);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json(detail);
}
