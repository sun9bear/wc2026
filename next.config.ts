import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // 历史路径（含博彩词），301 到合规命名（去博彩化雷词整改）。
    return [
      { source: "/parlay", destination: "/combo", permanent: true },
    ];
  },
};

export default nextConfig;
