import { Link } from "react-router";
import { ArrowRight, BriefcaseBusiness, Coins, Gem, Network, ShieldCheck, WalletCards } from "lucide-react";

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
    title: "优先流通权",
    text: "在典当、拍卖、回收等通道中，为会员提供更清晰、更可预期的流通支持。",
  },
];

const tiers = [
  { name: "Seed Member", focus: "资产配置入门", value: "获得会员凭证、基础资产库信息与生态活动资格。" },
  { name: "Premier Member", focus: "配置与流通支持", value: "获得优先资产沟通、托管信息追踪与流通路径建议。" },
  { name: "Strategic Member", focus: "资源与战略合作", value: "面向机构与战略伙伴，参与资产库共建与全球流通网络建设。" },
];

const heroHighlights = [
  { label: "服务卡价值", value: "1 张 = 1000 PHENIX" },
  { label: "积分获取方式", value: "通过质押服务卡获取PHENIX 积分" },
  { label: "流通路径", value: "未质押的服务卡，可申请平台出售" },
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Membership Model</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
              资产是纽带，资源是价值。
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
              PHENIX 的会员体系不同于传统年费制。会员通过配置平台精选资产进入生态，在资产服务、圈层资源、项目合作与优先流通中获得长期价值。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/rda"
                className="inline-flex w-full items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50 sm:w-auto"
              >
                获取会员凭证
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
                质押领积分
              </Link>
            </div>
          </div>

          <aside className="border border-sky-100 bg-sky-50/70 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-sky-200 bg-white text-sky-700">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Member Path</p>
                <h2 className="mt-1 text-xl font-semibold text-sky-950">会员权益路径</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {heroHighlights.map((item) => (
                <div key={item.label} className="border-b border-sky-100 pb-3 last:border-b-0 last:pb-0">
                  <div className="text-sm text-sky-900/60">{item.label}</div>
                  <div className="mt-1 font-semibold text-sky-950">{item.value}</div>
                </div>
              ))}
            </div>
          </aside>
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
