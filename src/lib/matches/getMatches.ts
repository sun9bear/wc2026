import { FIXTURES, type FixtureMatch } from "@/lib/fixtures/matches";

// Foundation 阶段：从本地占位赛程读取，便于无数据库即可渲染。
// TODO（Plan 1 Task 5-7）：配置 Supabase 后改为查询 matches + teams 表。
export async function getMatches(): Promise<FixtureMatch[]> {
  return [...FIXTURES].sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));
}
