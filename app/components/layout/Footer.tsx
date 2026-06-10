import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <div className="border-t border-sky-100 bg-white/[0.82] backdrop-blur-sm">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <img src="/logo-porcelain.svg" className="h-10" alt="PHENIX" />
            <p className="mt-4 max-w-xl text-sm leading-7 text-sky-900/70">
              PHENIX 构建文化艺术品可信流通的服务基础设施，以真实资产、真实资料、真实服务推动文化艺术品实物流通。
            </p>
            <div className="mt-5 max-w-xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-950">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                合规与风险提示
              </div>
              <p className="mt-2 text-amber-950/[0.78]">
                本网站信息不构成投资建议、收益承诺或公开募资邀约。PHENIX 不做虚拟数字交易平台，不做资产代币化发行；文化艺术品服务涉及鉴定、托管、实物交易渠道及市场风险，请独立判断。
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-2">
              <Link to="/asset" className="hover:text-sky-700">资产库</Link>
              <Link to="/membership" className="hover:text-sky-700">会员体系</Link>
              <Link to="/points-mall" className="hover:text-sky-700">社区商城</Link>
              <Link to="/custody" className="hover:text-sky-700">托管与存证</Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/liquidity" className="hover:text-sky-700">流通服务</Link>
              <Link to="/assets" className="hover:text-sky-700">会员凭证</Link>
              <Link to="/assets" className="hover:text-sky-700">我的资产</Link>
              <Link to="/faq" className="hover:text-sky-700">FAQ</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-sky-100 pt-6 text-sm text-sky-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>&copy;{new Date().getFullYear()} Phenix Labs. All rights reserved.</div>
            <div>不公开募资，不承诺收益，不提供公众投资入口。真实资产服务存在风险，请独立判断。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
