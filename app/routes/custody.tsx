import { Link } from "react-router";
import { ArrowRight, BadgeCheck, Building2, FileCheck2, LockKeyhole, Shield } from "lucide-react";

const custodyLayers = [
  {
    icon: BadgeCheck,
    title: "多层鉴定",
    text: "通过专家团队、来源材料与历史记录交叉验证，降低真伪与信息不对称风险。",
  },
  {
    icon: Building2,
    title: "分离式托管",
    text: "将平台交易、资产保管、资金结算与保险保障拆分给专业机构协作完成。",
  },
  {
    icon: Shield,
    title: "保险与安保",
    text: "围绕保管环境、运输、展陈与跨境流通环节建立资产安全保障。",
  },
  {
    icon: FileCheck2,
    title: "链上存证",
    text: "记录资产文件包 hash、所有权与关键流通信息，形成透明、可追溯的数字凭证。",
  },
];

const records = [
  "资产名称与文件包 hash",
  "链上 Token ID 与持有人地址",
  "资产状态与流通记录",
  "托管、鉴定、保险等线下文件索引",
];

export function meta() {
  return [
    { title: "托管与确权 | PHENIX" },
    { name: "description", content: "PHENIX 通过第三方托管、数字确权与链上存证构建文化资产可信流通基础设施。" },
  ];
}

export default function Custody() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-neutral-200 bg-neutral-950 px-4 py-16 text-white sm:px-8 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-300">Custody System</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">分离式第三方托管</h1>
          </div>
          <p className="text-lg leading-8 text-white/72">
            PHENIX 联合金融机构、安保机构与保险机构，建立资产保管、资金监管、风险保障和链上存证相互分离的托管体系，提升文化资产的国际流通能力与全球公信力。
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-4 md:grid-cols-2">
          {custodyLayers.map((item) => (
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
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">On-chain Proof</p>
          <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">让关键资产信息可追溯</h2>
          <p className="mt-6 leading-8 text-neutral-600">
            链上记录不是替代线下鉴定与托管，而是把核心信息组织成可验证、可追踪、可持续沉淀的资产索引。
          </p>
        </div>
        <div className="border border-neutral-200 p-6">
          <LockKeyhole className="h-6 w-6 text-red-700" />
          <h3 className="mt-5 text-xl font-semibold text-neutral-950">资产凭证记录</h3>
          <ul className="mt-5 space-y-4 text-neutral-600">
            {records.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 bg-red-700" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="bg-neutral-950 p-8 text-white">
          <h2 className="text-2xl font-semibold sm:text-3xl">托管是流通的前提</h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/70">
            当资产的真伪、保管、权属与记录可被持续验证，文化艺术品才具备成为长期资产配置工具的基础条件。
          </p>
          <Link
            to="/liquidity"
            className="mt-8 inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            查看变现机制
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
