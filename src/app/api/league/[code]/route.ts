import { NextResponse } from "next/server";
import { getLeagueBoard } from "@/lib/league/getLeagueBoard";
import { normalizeLeagueCode } from "@/lib/league/code";

// 擂台榜单 API（任务 5）：口令即凭证（不二次鉴权——码本身就是私密邀请）。
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const board = await getLeagueBoard(normalizeLeagueCode(code));
  if (!board) return NextResponse.json({ error: "league_not_found" }, { status: 404 });
  return NextResponse.json(board);
}
