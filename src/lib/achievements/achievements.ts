// 成就徽章——由现有战绩数据派生（无需额外存储）。
export interface Achievement {
  id: string;
  icon: string;
  label: string;
  desc: string;
  earned: boolean;
}

export interface AchievementInput {
  total: number;
  won: number;
  hitRate: number; // 0-100
  biggestPayout: number;
  checkinStreak: number;
  balance: number;
}

export function computeAchievements(s: AchievementInput): Achievement[] {
  return [
    { id: "first_bet", icon: "🎯", label: "初出茅庐", desc: "完成首次预测", earned: s.total >= 1 },
    { id: "first_win", icon: "🏆", label: "旗开得胜", desc: "首次命中", earned: s.won >= 1 },
    { id: "sharp", icon: "🔥", label: "神准", desc: "命中率≥60%（≥10场）", earned: s.hitRate >= 60 && s.total >= 10 },
    { id: "underdog", icon: "🦄", label: "冷门猎手", desc: "单笔派分≥500", earned: s.biggestPayout >= 500 },
    { id: "checkin7", icon: "📅", label: "签到达人", desc: "连续签到≥7天", earned: s.checkinStreak >= 7 },
    { id: "veteran", icon: "💎", label: "百战之身", desc: "预测≥50场", earned: s.total >= 50 },
    { id: "gold", icon: "🛡", label: "段位跃迁", desc: "积分达黄金段（≥2500）", earned: s.balance >= 2500 },
  ];
}
