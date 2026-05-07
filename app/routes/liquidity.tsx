import { Link } from "react-router";
import { ArrowRight, BadgeDollarSign, Gavel, Landmark, Repeat2 } from "lucide-react";

const channels = [
  {
    icon: Landmark,
    title: "典当机构",
    text: "对接知名典当机构，围绕资产评估、短期资金需求与赎回机制提供快速流通路径。",
  },
  {
    icon: Gavel,
    title: "拍卖渠道",
    text: "连接国内外拍卖资源，通过专业营销、买家网络与公开竞价推动资产价值发现。",
  },
  {
    icon: Repeat2,
    title: "回收机构",
    text: "布局长期回收与再流通网络，为资产持有人提供更清晰的退出选项。",
  },
];

const process = [
  "资产信息确认",
  "托管与确权记录复核",
  "渠道评估与价格发现",
  "交易、结算与合规服务",
];

export function meta() {
  return [
    { title: "变现机制 | PHENIX" },
    { name: "description", content: "PHENIX 提前连接典当、拍卖与回收渠道，为文化资产建立可预期退出路径。" },
  ];
}

export default function Liquidity() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-neutral-200 bg-white px-4 py-16 sm:px-0 sm:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Liquidity Mechanism</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-neutral-950 sm:text-6xl">
            流通，是信任的结果。
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-neutral-600">
            PHENIX 提前打通典当、拍卖、回收等渠道，为会员建立更可预期的退出路径。变现机制不是收益承诺，而是围绕真实资产与专业服务搭建的流通网络。
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {channels.map((item) => (
            <article key={item.title} className="border border-neutral-200 bg-white p-6">
              <item.icon className="h-6 w-6 text-red-700" />
              <h2 className="mt-5 text-xl font-semibold text-neutral-950">{item.title}</h2>
              <p className="mt-3 leading-7 text-neutral-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-y border-neutral-200 bg-white px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Exit Path</p>
          <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">从资产确认到交易结算</h2>
          <p className="mt-6 leading-8 text-neutral-600">
            平台围绕托管、确权、估值、渠道匹配和结算服务，把原本分散的退出流程组织成可追踪的服务链路。
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {process.map((item, index) => (
            <div key={item} className="border border-neutral-200 p-5">
              <div className="text-sm font-semibold text-red-700">{String(index + 1).padStart(2, "0")}</div>
              <div className="mt-5 font-semibold text-neutral-950">{item}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="bg-neutral-950 p-8 text-white">
          <BadgeDollarSign className="h-7 w-7 text-red-300" />
          <h2 className="mt-5 text-2xl font-semibold sm:text-3xl">不承诺收益，只建设更可信的流通基础设施</h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/70">
            文化资产价格受市场、资产稀缺性、保存状况、交易渠道和宏观环境影响。PHENIX 的目标是降低信息不对称与流通摩擦，而不是提供固定收益承诺。
          </p>
          <Link
            to="/rwa"
            className="mt-8 inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            浏览资产池
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
