import { NextRequest, NextResponse } from "next/server";
import { getMatchSwing } from "@/lib/prob/getMatchSwing";

// 「爆冷瞬间」摆动数据查询（公开只读）：结算抽屉据此判断本人押中的是不是爆冷场、并构造分享。
// 数据本就公开（比赛页/OG 卡都显），无需鉴权；底层 getMatchSwing 已 unstable_cache 600s。
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json(null, { status: 400 });
  try {
    const swing = await getMatchSwing(id);
    return NextResponse.json(swing, {
      headers: { "Cache-Control": "public, max-age=120, s-maxage=300" },
    });
  } catch {
    return NextResponse.json(null);
  }
}
