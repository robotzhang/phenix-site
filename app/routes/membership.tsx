import { Link } from "react-router";
import { ArrowRight, BriefcaseBusiness, Gem, Network, ShieldCheck } from "lucide-react";

const rights = [
  {
    icon: Gem,
    title: "资产配置服务",
    text: "基于平台严选资产池，为会员提供文化艺术品资产配置建议与入池资产信息。",
  },
  {
    icon: Network,
    title: "圈层资源对接",
    text: "围绕高净值人群、机构伙伴与文化资源方，建立长期可信的资源连接网络。",
  },
  {
    icon: BriefcaseBusiness,
    title: "项目合作机会",
    text: "对接文化资产、展陈、品牌合作与跨境流通机会，推动资产价值被持续发现。",
  },
  {
    icon: ShieldCheck,
    title: "优先流通权",
    text: "在典当、拍卖、回收等通道中，为会员提供更清晰、更可预期的流通支持。",
  },
];

const tiers = [
  { name: "Seed Member", focus: "资产配置入门", value: "获得会员凭证、基础资产池信息与生态活动资格。" },
  { name: "Premier Member", focus: "配置与流通支持", value: "获得优先资产沟通、托管信息追踪与流通路径建议。" },
  { name: "Strategic Member", focus: "资源与战略合作", value: "面向机构与战略伙伴，参与资产池共建与全球流通网络建设。" },
];

export function meta() {
  return [
    { title: "会员体系 | PHENIX" },
    { name: "description", content: "PHENIX 以资产为纽带、以资源为价值，构建高端会员与文化资产流通生态。" },
  ];
}

export default function Membership() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-neutral-200 bg-white px-4 py-16 sm:px-0 sm:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Membership Model</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-neutral-950 sm:text-6xl">
            资产是纽带，资源是价值。
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600">
            PHENIX 的会员体系不同于传统年费制。会员通过配置平台精选资产进入生态，在资产服务、圈层资源、项目合作与优先流通中获得长期价值。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/nft"
              className="inline-flex items-center justify-center gap-2 bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              获取会员凭证
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/rwa"
              className="inline-flex items-center justify-center gap-2 border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              浏览资产池
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-4 md:grid-cols-2">
          {rights.map((item) => (
            <article key={item.title} className="border border-neutral-200 bg-white p-6">
              <item.icon className="h-6 w-6 text-red-700" />
              <h2 className="mt-5 text-xl font-semibold text-neutral-950">{item.title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white px-4 py-16 sm:px-0 sm:py-24">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Member Journey</p>
          <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">从资产配置进入信任生态</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.name} className="border border-neutral-200 p-6">
              <div className="text-sm font-semibold text-red-700">{tier.name}</div>
              <h3 className="mt-3 text-xl font-semibold text-neutral-950">{tier.focus}</h3>
              <p className="mt-4 leading-7 text-neutral-600">{tier.value}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-sm leading-7 text-muted-foreground">
          会员权益以实际平台规则、资产状态与合作机构服务能力为准。PHENIX 不公开募资，不承诺固定收益。
        </p>
      </section>
    </div>
  );
}
