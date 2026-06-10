import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Gavel,
  Gem,
  Landmark,
  LockKeyhole,
  Network,
  Repeat2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { PRODUCT_ASSETS } from "@/data/product-assets";

const heroStats = [
  { value: String(PRODUCT_ASSETS.length), label: "严选文化艺术品" },
  { value: "4 层", label: "鉴定、存证、托管、流通协同" },
  { value: "3 类", label: "典当、拍卖、回收服务通道" },
];

const marketSignals = [
  { title: "交易链路长", text: "文化艺术品实物交易周期长，优质资产需要更清晰的资料与服务链路。" },
  { title: "存证难", text: "真伪、来源、托管与实物交易记录分散，持有人缺少可持续沉淀的资产索引。" },
  { title: "流通难", text: "典当、拍卖、回收等渠道割裂，资产持有人缺少清晰的服务申请与资料对接路径。" },
];

const solutionItems = [
  { icon: BadgeCheck, title: "严选资产库", text: "多层鉴定与专家评审，优先筛选稀缺性强、具备实物流通基础的文化艺术品。" },
  { icon: Blocks, title: "线上存证", text: "通过线上记录沉淀资料、权属记录、实物交易与资产文件哈希，让核心信息透明、可追溯。" },
  { icon: LockKeyhole, title: "第三方托管", text: "联合托管、安保、保险等专业机构建立分离式协作体系，提升资产安全与公信力。" },
  { icon: Network, title: "交易渠道协同", text: "提前连接典当、拍卖、回收等实物交易渠道，为会员建立更清晰的服务申请、资料审核与渠道对接路径。" },
];

const serviceSteps = [
  { step: "01", title: "资料沉淀", text: "整理影像、规格、文件包 hash 与证书索引。" },
  { step: "02", title: "线上存证", text: "沉淀权属记录、第三方托管与资产状态记录。" },
  { step: "03", title: "服务协同", text: "连接典当、拍卖、回收等服务申请路径。" },
];

const platformPaths = [
  {
    icon: Gem,
    to: "/asset",
    label: "Asset Pool",
    title: "文化艺术品资产库",
    text: "查看 PHENIX 严选文化艺术品库、资产状态与实物交易服务信息。",
    accent: "border-amber-200 bg-amber-50/70 text-amber-900",
  },
  {
    icon: WalletCards,
    to: "/membership",
    label: "Membership",
    title: "会员服务体系",
    text: "通过会员凭证、服务卡和积分体系连接真实资产服务、生态活动与长期服务。",
    accent: "border-sky-200 bg-sky-50/80 text-sky-900",
  },
  {
    icon: Building2,
    to: "/custody",
    label: "Custody",
    title: "托管与存证",
    text: "把鉴定、托管、保险、线上存证拆分给专业角色协作，降低信息不对称。",
    accent: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  },
  {
    icon: Network,
    to: "/liquidity",
    label: "Liquidity",
    title: "文化艺术品实物流通",
    text: "连接典当、拍卖、回收等渠道，为真实资产建立更可追踪的服务申请链路。",
    accent: "border-cyan-200 bg-cyan-50/70 text-cyan-900",
  },
];

const operatingSteps = [
  { step: "01", title: "资产入库", text: "围绕真伪、稀缺性、来源材料与流通能力完成初筛。" },
  { step: "02", title: "线上存证", text: "建立文件包 hash、线上存证、第三方托管与资产状态记录。" },
  { step: "03", title: "会员服务", text: "向会员开放资产信息、服务卡、积分与生态服务入口。" },
  { step: "04", title: "实物流通", text: "通过典当、拍卖、回收等合作渠道推进资料审核、价格发现与实物交易服务。" },
];

const channelItems = [
  { icon: Landmark, title: "典当机构", text: "围绕短期资金需求、赎回机制和资产评估提供快速流通路径。" },
  { icon: Gavel, title: "拍卖渠道", text: "连接专业买家网络与公开竞价场景，推动资产价值发现。" },
  { icon: Repeat2, title: "回收机构", text: "布局长期回收与再流通网络，为资产持有人提供服务申请选项。" },
];

const flywheel = ["资产库扩容", "会员规模增长", "圈层价值增强", "流通效率提升", "平台公信力增强", "更多资产进入"];

const milestones = [
  { stage: "第一阶段", title: "基础建设期", goal: "建立核心资产储备、严选入库机制、托管体系和种子会员网络。" },
  { stage: "第二阶段", title: "规模扩张期", goal: "扩展资产规模与会员网络，推动托管、回收和流通渠道落地。" },
  { stage: "第三阶段", title: "生态成熟期", goal: "建设全球文化艺术品可信流通服务中心，形成行业标准与全球化运营能力。" },
];

export function meta() {
  return [
    { title: "PHENIX | 华夏文化艺术品资产服务与流通协同平台" },
    {
      name: "description",
      content: "构建文化艺术品可信流通的服务基础设施，以严选资产库、线上存证、第三方托管与实物交易渠道协同支持真实资产长期沉淀。",
    },
  ];
}

export default function Home() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="home-hero relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-b border-sky-100 bg-[linear-gradient(180deg,#fbfeff_0%,#e4f8ff_100%)] pb-8 pt-20 text-sky-950 sm:min-h-[calc(100vh-8rem)] sm:pb-10 sm:pt-24 lg:pt-20">
        <div className="home-hero-clouds absolute inset-0" aria-hidden="true" />
        <div className="home-hero-ornament absolute inset-y-16 right-[-10%] w-[82%] opacity-55 sm:right-[-5%] lg:w-[68%]" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,rgba(228,248,255,0),rgba(247,251,253,0.98))]" />

        <div className="relative z-10 mx-auto grid w-full max-w-[1500px] gap-8 px-4 pt-8 sm:px-8 lg:min-h-[calc(100vh-19rem)] lg:grid-cols-[minmax(0,1fr)_610px] lg:items-center lg:pt-0 2xl:px-10">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex w-fit items-center gap-2 border border-sky-200 bg-white/78 px-3 py-1.5 text-sm font-medium text-sky-800 shadow-sm backdrop-blur-md">
              <ClipboardCheck className="h-4 w-4 text-amber-600" />
              文化艺术品真实资产服务生态
            </div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl lg:text-7xl">
              PHENIX
              <span className="mt-3 block text-[1.55rem] font-medium leading-tight text-sky-950 sm:text-4xl lg:text-[2.75rem]">
                华夏文化艺术品真实资产服务平台
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-xl font-medium leading-8 text-sky-900 sm:mt-6 sm:text-2xl">
              构建文化艺术品可信流通的服务基础设施
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-sky-900/68 sm:text-lg">
              以严选资产库、线上存证、第三方托管与交易渠道协同为基础，服务文化艺术品的资料沉淀、权属记录与可信流通。
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["严选资产库", "线上存证", "第三方托管", "交易渠道协同"].map((item) => (
                <span key={item} className="border border-sky-200 bg-white/68 px-3 py-1.5 text-sm font-medium text-sky-800 backdrop-blur">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-2xl border-l border-amber-400 pl-4 text-sm leading-7 text-sky-950/72">
              PHENIX 不做虚拟数字交易平台，不做资产代币化发行，不承诺收益，不提供公众投资入口。围绕真实文化艺术品，提供实物交易、严选入库、鉴定服务、托管协同、线上存证与第三方服务申请路径协同。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
              <Link
                to="/asset"
                className="inline-flex items-center justify-center gap-2 border border-sky-800 bg-sky-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                浏览资产库
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/custody"
                className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white/76 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-white"
              >
                查看托管存证
              </Link>
            </div>
          </div>

          <div className="hidden border border-sky-200 bg-white/82 p-8 shadow-[0_28px_80px_rgba(14,116,144,0.14)] backdrop-blur-md lg:block">
            <div className="text-2xl font-semibold text-sky-950">服务路径</div>
            <div className="mt-8 space-y-5">
              {serviceSteps.map((item, index) => (
                <div key={item.step} className="relative border border-sky-200 bg-sky-50/58 p-5">
                  {index < serviceSteps.length - 1 && (
                    <span className="absolute left-[3.25rem] top-[4.75rem] h-5 border-l-2 border-sky-300" aria-hidden="true" />
                  )}
                  <div className="grid grid-cols-[3.75rem_1fr] items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-400 bg-sky-50 text-xs font-semibold text-sky-700">
                      {item.step}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-sky-950">{item.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-sky-900/64">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-8 w-full max-w-[1500px] px-4 sm:mt-10 sm:px-8 2xl:px-10">
          <div className="grid max-w-5xl gap-3 sm:grid-cols-3">
            {heroStats.map((item) => (
              <div key={item.label} className="border border-sky-200 bg-white/82 p-4 shadow-sm backdrop-blur">
                <div className="text-2xl font-semibold text-sky-950">{item.value}</div>
                <div className="mt-1 text-sm leading-5 text-sky-900/70">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-700">Market Opportunity</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              行业缺的不是故事，而是可信服务系统。
            </h2>
          </div>
          <p className="text-base leading-8 text-sky-900/70 sm:text-lg">
            全球艺术品市场长期保持在 6000 亿美元以上，中国拥有庞大的文化艺术品存量和活跃的实物流通需求。
            真正限制流通的，是信任、流动性与标准化基础设施的缺口。
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {marketSignals.map((item) => (
            <article key={item.title} className="border border-sky-100 bg-white/85 p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-sky-950">{item.title}</h3>
              <p className="mt-4 leading-7 text-sky-900/70">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-700">Our Solution</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              信任驱动型文化艺术品资产服务平台
            </h2>
            <p className="mt-6 leading-8 text-sky-900/70">
              PHENIX 以资产为纽带、以规则为边界，连接文化艺术品持有人、会员与专业服务机构。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {solutionItems.map((item) => (
              <article key={item.title} className="border border-sky-100 bg-white/80 p-6 shadow-sm">
                <item.icon className="h-6 w-6 text-emerald-700" />
                <h3 className="mt-5 text-lg font-semibold text-sky-950">{item.title}</h3>
                <p className="mt-3 leading-7 text-sky-900/70">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-0 sm:py-20">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-700">Platform Entrances</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              从资产到服务，四个入口直接进入。
            </h2>
          </div>
          <p className="text-base leading-8 text-sky-900/70 sm:text-lg">
            官网不只展示项目，也承载会员使用路径。资产库、会员体系、托管存证与流通机制共同组成 PHENIX 的服务中台。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {platformPaths.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group border border-sky-100 bg-white/85 p-6 shadow-sm transition hover:border-sky-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center border ${item.accent}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold text-sky-700">{item.label}</span>
              </div>
              <h3 className="mt-8 text-2xl font-semibold text-sky-950">{item.title}</h3>
              <p className="mt-4 leading-7 text-sky-900/70">{item.text}</p>
              <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-sky-950">
                进入
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-10 border-y border-sky-100 bg-[linear-gradient(180deg,#f8fbfd_0%,#edf6f5_100%)] px-4 py-14 sm:px-8 sm:py-20 lg:grid-cols-[0.82fr_1.18fr]">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Operating Model</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
            把分散的实物交易申请，组织成可追踪的服务链路。
          </h2>
          <p className="mt-6 leading-8 text-sky-900/70">
            PHENIX 的核心不是单一资产展示，而是把线下鉴定、第三方托管、线上记录和流通渠道接入同一套会员服务流程。
          </p>
        </div>
        <div className="grid gap-3">
          {operatingSteps.map((item) => (
            <article key={item.step} className="grid gap-4 border border-sky-100 bg-white/85 p-5 shadow-sm sm:grid-cols-[72px_1fr]">
              <div className="text-2xl font-semibold text-emerald-700">{item.step}</div>
              <div>
                <h3 className="text-xl font-semibold text-sky-950">{item.title}</h3>
                <p className="mt-2 leading-7 text-sky-900/70">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-amber-700">Member Service</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              会员不是旁观者，而是资产生态的参与者。
            </h2>
            <p className="mt-6 leading-8 text-sky-900/70">
              服务卡、权益积分规则、真实资产服务与社区商城共同形成会员入口。平台通过真实资产、真实服务和实物交易记录，帮助会员长期参与文化艺术品流通生态。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/staking"
                className="inline-flex items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                权益积分规则
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/points-mall"
                className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white/80 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-white"
              >
                查看社区商城
              </Link>
            </div>
          </div>
          <div className="overflow-hidden border border-sky-100 bg-white/85 shadow-sm">
            <img src="/fnft-blue-vivid.png" alt="PHENIX service card" className="aspect-[4/3] w-full object-cover" />
            <div className="grid grid-cols-3 border-t border-sky-100">
              <div className="border-r border-sky-100 p-4">
                <div className="text-sm text-sky-900/60">服务卡</div>
                <div className="mt-2 font-semibold text-sky-950">会员入口</div>
              </div>
              <div className="border-r border-sky-100 p-4">
                <div className="text-sm text-sky-900/60">积分</div>
                <div className="mt-2 font-semibold text-sky-950">规则累计</div>
              </div>
              <div className="p-4">
                <div className="text-sm text-sky-900/60">商城</div>
                <div className="mt-2 font-semibold text-sky-950">权益兑换</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-700">Liquidity Channels</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              服务路径提前建设，流通协助才更清晰。
            </h2>
            <p className="mt-6 leading-8 text-sky-900/70">
              PHENIX 不承诺收益或成交，而是减少资产流通中的信息断点。典当、拍卖和回收通道共同服务于不同周期、不同需求的资产服务场景。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {channelItems.map((item) => (
              <article key={item.title} className="border border-sky-100 bg-white/85 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <item.icon className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
                  <div>
                    <h3 className="font-semibold text-sky-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-sky-900/70">{item.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-700">Growth Flywheel</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              资产、会员与公信力形成正循环。
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {flywheel.map((item, index) => (
              <div key={item} className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                <div className="text-sm text-sky-700">{String(index + 1).padStart(2, "0")}</div>
                <div className="mt-6 font-semibold text-sky-950">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-sky-100 px-4 py-14 sm:px-0 sm:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-sky-700">Development Plan</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">三阶段战略路径</h2>
          </div>
          <Link to="/custody" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-900 hover:text-sky-700">
            查看托管与存证体系
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {milestones.map((item) => (
            <article key={item.stage} className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <div className="text-sm font-semibold text-sky-700">{item.stage}</div>
              <h3 className="mt-3 text-xl font-semibold text-sky-950">{item.title}</h3>
              <p className="mt-4 leading-7 text-sky-900/70">{item.goal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 border border-sky-100 bg-[linear-gradient(180deg,#f7fbfd_0%,#eef8f2_100%)] px-4 py-12 text-sky-950 sm:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-700" />
              <h2 className="text-2xl font-semibold sm:text-3xl">面向合规机构与长期战略伙伴</h2>
            </div>
            <p className="mt-4 max-w-3xl leading-7 text-sky-900/70">
              PHENIX 不做虚拟数字交易平台，不做资产代币化发行，不承诺收益，不提供公众投资入口。平台以真实资产、真实资料、真实服务为基础，欢迎长期认同文化艺术品可信流通价值的伙伴共同参与基础设施建设。
            </p>
          </div>
          <Link
            to="/liquidity"
            className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white/80 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-white"
          >
            了解流通机制
            <BriefcaseBusiness className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
