import { Link } from "react-router";
import { ArrowRight, BriefcaseBusiness, Coins, Gem, Network, ShieldCheck } from "lucide-react";
import RightsBoundaryNotice from "@/components/biz/RightsBoundaryNotice";

const rights = [
  {
    icon: Gem,
    title: "资产配置服务",
    text: "基于平台严选资产库，为会员提供文化艺术品资产配置建议与入库资产信息。",
  },
  {
    icon: Network,
    title: "圈层资源对接",
    text: "围绕高净值人群、机构伙伴与文化资源方，建立长期可信的资源连接网络。",
  },
  {
    icon: BriefcaseBusiness,
    title: "项目合作机会",
    text: "对接文化艺术品资产、展陈、品牌合作与跨境流通机会，推动资产价值被持续发现。",
  },
  {
    icon: ShieldCheck,
    title: "流通服务协助",
    text: "在典当、拍卖、回收等通道中，为会员提供资料整理、渠道沟通和服务登记支持，不承诺成交。",
  },
];

const tiers = [
  { name: "Seed Member", focus: "资产配置入门", value: "获得会员凭证、基础资产库信息与生态活动资格。" },
  { name: "Premier Member", focus: "配置与流通支持", value: "获得优先资产沟通、托管信息追踪与流通路径建议。" },
  { name: "Strategic Member", focus: "资源与战略合作", value: "面向机构与战略伙伴，参与资产库共建与全球流通网络建设。" },
];

export function meta() {
  return [
    { title: "会员体系 | PHENIX" },
    { name: "description", content: "PHENIX 以资产为纽带、以资源为价值，构建高端会员与文化艺术品资产流通生态。" },
  ];
}

export default function Membership() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-14 sm:px-0 sm:py-20">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Membership Model</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
            资产是纽带，资源是价值。
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            PHENIX 的会员体系不同于传统年费制。会员通过配置平台精选资产进入生态，在资产服务、圈层资源、项目合作与流通服务协助中持续参与平台权益。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/assets"
              className="inline-flex w-full items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50 sm:w-auto"
            >
              会员凭证入口
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/asset"
              className="inline-flex w-full items-center justify-center gap-2 border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50 sm:w-auto"
            >
              浏览资产库
            </Link>
            <Link
              to="/staking"
              className="inline-flex w-full items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 sm:w-auto"
            >
              <Coins className="h-4 w-4" />
              权益积分规则
            </Link>
          </div>
          <RightsBoundaryNotice className="mt-6 max-w-3xl" compact />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          {rights.map((item) => (
            <article key={item.title} className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <item.icon className="h-6 w-6 text-sky-700" />
              <h2 className="mt-5 text-xl font-semibold text-sky-950">{item.title}</h2>
              <p className="mt-3 leading-7 text-sky-900/70">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Member Journey</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">从资产配置进入信任生态</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <div className="text-sm font-semibold text-sky-700">{tier.name}</div>
              <h3 className="mt-3 text-xl font-semibold text-sky-950">{tier.focus}</h3>
              <p className="mt-4 leading-7 text-sky-900/70">{tier.value}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-7 text-sky-900/60">
          会员权益以实际平台规则、资产状态与合作机构服务能力为准。PHENIX 不公开募资，不承诺固定收益。
        </p>
      </section>
    </div>
  );
}
