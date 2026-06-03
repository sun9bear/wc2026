import { zh } from "@/i18n/messages/zh";

// 合规免责声明组件：文案取自 i18n 文案模块（不硬编码），且必须通过雷词 lint。
export function Disclaimer() {
  return <p className="text-muted text-[11px]">{zh.disclaimer}</p>;
}
