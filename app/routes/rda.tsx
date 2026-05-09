import FQA from "@/components/biz/FQA";
import { Buy } from "@/components/biz/Buy";
import { Link } from "react-router";
import { BadgeCheck, BriefcaseBusiness, Gem, Network, ShieldCheck } from "lucide-react";

const benefits = [
  { icon: Gem, title: "资产配置服务", text: "获取平台严选资产库相关信息与配置服务入口。" },
  { icon: Network, title: "圈层资源对接", text: "进入 PHENIX 高净值会员与战略伙伴生态。" },
  { icon: BriefcaseBusiness, title: "项目合作机会", text: "围绕文化艺术品资产、品牌、展陈与跨境流通建立连接。" },
  { icon: ShieldCheck, title: "优先流通支持", text: "对接典当、拍卖、回收等退出路径的信息与服务。" },
];

export function meta() {
  return [
    { title: "PHENIX 会员凭证" },
    { name: "description", content: "获取 PHENIX 会员凭证，进入文化艺术品资产配置与可信流通生态。" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function Rda() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="grid gap-10 border-b border-sky-100 bg-white/80 px-4 py-14 sm:px-0 sm:py-20 lg:grid-cols-[1fr_460px] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Membership Credential</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
            PHENIX 会员凭证
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            会员凭证是进入 PHENIX 文化艺术品资产配置生态的链上入口。它连接资产配置服务、圈层资源、项目合作机会与优先流通支持。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/membership" className="inline-flex items-center justify-center border border-sky-300 bg-white/80 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50">
              查看会员体系
            </Link>
            <Link to="/asset" className="inline-flex items-center justify-center border border-sky-300 bg-white/80 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50">
              浏览资产库
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {benefits.map((item) => (
              <article key={item.title} className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                <item.icon className="h-5 w-5 text-sky-700" />
                <h2 className="mt-4 font-semibold text-sky-950">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-sky-900/70">{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="relative border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3 border-b border-sky-100 pb-5">
            <BadgeCheck className="h-5 w-5 text-sky-700" />
            <div>
              <h2 className="font-semibold text-sky-950">获取链上会员凭证</h2>
              <p className="text-sm text-sky-900/60">线上直接采购鉴定服务卡，买满10张的，联系我们领取黄金会员卡。</p>
            </div>
          </div>
          <div className="relative flex flex-col gap-1 bg-card text-card-foreground">
            <Buy />
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 grid gap-8 px-4 py-14 sm:px-0 sm:py-20 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">FAQ</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">常见问题</h2>
          <p className="mt-6 leading-8 text-sky-900/70">
            先了解 PHENIX 为什么存在、适合谁参与，再进一步理解会员权益、服务卡、PHENIX 积分和流通边界。
          </p>
        </div>
        <FQA />
      </section>
    </div>
  );
}
