import { ShieldCheck } from "lucide-react";

type RightsBoundaryNoticeProps = {
  className?: string;
  compact?: boolean;
};

export default function RightsBoundaryNotice({
  className = "",
  compact = false,
}: RightsBoundaryNoticeProps) {
  return (
    <div className={`border border-amber-200 bg-amber-50/80 p-4 text-amber-950 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        权益边界提示
      </div>
      <p className={`${compact ? "mt-2" : "mt-3"} text-sm leading-6 text-amber-950/80`}>
        会员权益、服务卡与 PHENIX 积分用于平台权益识别、服务记录和权益核算，不代表固定收益、现金价值或平台兜底退出；服务卡转让/退出服务由平台协助登记，不承诺成交。
      </p>
    </div>
  );
}
