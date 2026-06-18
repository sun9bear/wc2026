// 主导航 Tab 的单一真理源：底部栏(手机) 与 顶部栏(桌面) 共用，避免两处漂移。
// 小组赛期间「出线计算器」占主导航位（独家传播资产）；排行榜让位「人气榜」(可分享资产)。

export interface NavTab {
  href: string;
  label: string;
  icon: string;
}

interface NavDict {
  predict: string;
  calc: string;
  forecast: string;
  popularity: string;
  me: string;
}

export function buildNavTabs(nav: NavDict): NavTab[] {
  return [
    { href: "/", label: nav.predict, icon: "⚽" },
    { href: "/calculator", label: nav.calc, icon: "🧮" },
    { href: "/forecast", label: nav.forecast, icon: "📊" },
    { href: "/popularity", label: nav.popularity, icon: "⭐" },
    { href: "/me", label: nav.me, icon: "👤" },
  ];
}

// 当前 tab 高亮判定（bare = stripLocale 后的裸路径）。
// "/" 额外覆盖 /match/* 详情；其余按前缀匹配（/calculator 覆盖 /calculator/group/*，/forecast 覆盖 /forecast/best-thirds）。
export function isNavActive(bare: string, href: string): boolean {
  if (href === "/") return bare === "/" || bare.startsWith("/match");
  return bare.startsWith(href);
}
