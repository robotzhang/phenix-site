import { Link } from "react-router";

export function Footer() {
  return (
    <div className="border-t border-sky-100 bg-white/70 backdrop-blur-sm">
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <img src="/logo-porcelain.svg" className="h-10" alt="PHENIX" />
            <p className="mt-4 max-w-xl text-sm leading-7 text-sky-900/70">
              PHENIX 构建文化艺术品资产的信任基础设施，以真实资产、真实交易、真实服务推动文化艺术品资产可信流通。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-2">
              <Link to="/rwa" className="hover:text-sky-700">资产库</Link>
              <Link to="/membership" className="hover:text-sky-700">会员体系</Link>
              <Link to="/points-mall" className="hover:text-sky-700">积分商城</Link>
              <Link to="/custody" className="hover:text-sky-700">托管与确权</Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link to="/liquidity" className="hover:text-sky-700">变现机制</Link>
              <Link to="/nft" className="hover:text-sky-700">会员凭证</Link>
              <Link to="/assets" className="hover:text-sky-700">我的资产</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-sky-100 pt-6 text-sm text-sky-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>&copy;{new Date().getFullYear()} Phenix Labs. All rights reserved.</div>
            <div>不公开募资，不承诺收益。资产配置存在风险，请独立判断。</div>
          </div>
        </div>
      </div>
    </div>
  );
}
