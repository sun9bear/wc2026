// Foundation 阶段的本地占位赛程，便于无数据库即可渲染首页。
// 中性命名，不含 FIFA / 世界杯 字样（设计方案红线 7）。正式数据见 supabase/seed/。
export interface FixtureTeam {
  name: string;
  flag: string;
}

export interface FixtureMatch {
  id: string;
  stage: string;
  group?: string;
  kickoffAt: string; // ISO 8601
  home: FixtureTeam;
  away: FixtureTeam;
}

export const FIXTURES: FixtureMatch[] = [
  {
    id: "m1",
    stage: "小组赛",
    group: "A 组",
    kickoffAt: "2026-06-11T19:00:00Z",
    home: { name: "东道主", flag: "🏟️" },
    away: { name: "A2", flag: "⚽" },
  },
  {
    id: "m2",
    stage: "小组赛",
    group: "C 组",
    kickoffAt: "2026-06-18T03:00:00Z",
    home: { name: "巴西", flag: "🇧🇷" },
    away: { name: "阿根廷", flag: "🇦🇷" },
  },
  {
    id: "m3",
    stage: "小组赛",
    group: "E 组",
    kickoffAt: "2026-06-19T18:00:00Z",
    home: { name: "法国", flag: "🇫🇷" },
    away: { name: "西班牙", flag: "🇪🇸" },
  },
  {
    id: "m4",
    stage: "小组赛",
    group: "G 组",
    kickoffAt: "2026-06-20T21:00:00Z",
    home: { name: "德国", flag: "🇩🇪" },
    away: { name: "葡萄牙", flag: "🇵🇹" },
  },
];
