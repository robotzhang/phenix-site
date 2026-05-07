import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  Blocks,
  CircleDollarSign,
  LockKeyhole,
  Network,
  Sparkles,
} from "lucide-react";

const painPoints = [
  { title: "交易难", text: "文化艺术品交易周期长，优质资产难以快速进入可信流通。" },
  { title: "流通难", text: "缺少标准化确权、托管与交易机制，资产常被长期沉淀。" },
  { title: "变现难", text: "退出渠道分散且不可预期，投资人与持有人缺少清晰路径。" },
];

const solutionItems = [
  { icon: BadgeCheck, title: "严选资产池", text: "多层鉴定与专家评审，优先筛选稀缺性强、具备长期流通潜力的文化资产。" },
  { icon: LockKeyhole, title: "第三方托管", text: "联合金融、安保、保险等机构建立分离式托管体系，提升资产安全与公信力。" },
  { icon: Blocks, title: "数字确权存证", text: "通过链上记录沉淀权属、交易与资产文件哈希，让核心信息透明、可追溯。" },
  { icon: CircleDollarSign, title: "可预期退出", text: "提前连接典当、拍卖、回收等渠道，为会员建立更清晰的流通与变现路径。" },
];

const flywheel = ["资产池扩大", "会员规模增长", "圈层价值增强", "流通效率提升", "平台公信力增强", "更多资产进入"];

const milestones = [
  { stage: "第一阶段", title: "基础建设期", goal: "建立核心资产储备、严选入池机制、托管体系和种子会员网络。" },
  { stage: "第二阶段", title: "规模扩张期", goal: "扩展资产规模与会员网络，推动托管、回收和流通渠道落地。" },
  { stage: "第三阶段", title: "生态成熟期", goal: "建设全球文化资产配置中心，形成行业标准与全球化运营能力。" },
];

export function meta() {
  return [
    { title: "PHENIX | 中国文化艺术品资产交易与配置平台" },
    {
      name: "description",
      content: "PHENIX 构建文化资产的信任基础设施，让文化艺术品资产实现可信流通。",
    },
  ];
}

export default function Home() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-neutral-950 px-4 py-16 text-white sm:px-8 sm:py-24">
        <img
          src="/fnft.jpg"
          alt="PHENIX"
          className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-20 mix-blend-screen sm:w-2/3"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.96),rgba(10,10,10,0.74),rgba(10,10,10,0.3))]" />
        <div className="relative z-10 flex min-h-[calc(100vh-12rem)] max-w-4xl flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 text-sm text-white/80">
            <Sparkles className="h-4 w-4 text-red-300" />
            文化资产流通体系构建者
          </div>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight sm:text-6xl lg:text-7xl">
            PHENIX
            <span className="mt-4 block text-2xl font-medium text-white/85 sm:text-4xl">
              中国文化艺术品资产交易与配置平台
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-white/76 sm:text-xl">
            构建文化资产的信任基础设施，让文化艺术品资产在严选、托管、确权与退出机制中实现可信流通。
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/rwa"
              className="inline-flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              浏览资产池
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              了解会员体系
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Market Opportunity</p>
            <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">
              行业缺的不是需求，而是系统。
            </h2>
          </div>
          <p className="text-base leading-8 text-neutral-600 sm:text-lg">
            全球艺术品市场长期保持在 6000 亿美元以上，中国拥有庞大的文化艺术品存量和活跃交易需求。
            真正限制流通的，是信任、流动性与标准化基础设施的缺口。
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {painPoints.map((item) => (
            <article key={item.title} className="border border-neutral-200 bg-white p-6">
              <h3 className="text-xl font-semibold text-neutral-950">{item.title}</h3>
              <p className="mt-4 leading-7 text-neutral-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-200 bg-white px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Our Solution</p>
            <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">
              信任驱动型文化资产流通平台
            </h2>
            <p className="mt-6 leading-8 text-neutral-600">
              PHENIX 以资产为纽带、以资源为价值，连接高净值人群、优质文化资产与专业服务网络。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {solutionItems.map((item) => (
              <article key={item.title} className="border border-neutral-200 p-6">
                <item.icon className="h-6 w-6 text-red-700" />
                <h3 className="mt-5 text-lg font-semibold text-neutral-950">{item.title}</h3>
                <p className="mt-3 leading-7 text-neutral-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Growth Flywheel</p>
            <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">
              资产、会员与公信力形成正循环。
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {flywheel.map((item, index) => (
              <div key={item} className="border border-neutral-200 bg-white p-5">
                <div className="text-sm text-red-700">{String(index + 1).padStart(2, "0")}</div>
                <div className="mt-6 font-semibold text-neutral-950">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 px-4 py-16 sm:px-0 sm:py-24">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Development Plan</p>
            <h2 className="mt-4 text-3xl font-semibold text-neutral-950 sm:text-5xl">三阶段战略路径</h2>
          </div>
          <Link to="/custody" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-950 hover:text-red-700">
            查看托管与确权体系
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {milestones.map((item) => (
            <article key={item.stage} className="border border-neutral-200 bg-white p-6">
              <div className="text-sm font-semibold text-red-700">{item.stage}</div>
              <h3 className="mt-3 text-xl font-semibold text-neutral-950">{item.title}</h3>
              <p className="mt-4 leading-7 text-neutral-600">{item.goal}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-10 bg-neutral-950 px-4 py-12 text-white sm:px-8">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold sm:text-3xl">面向合格机构投资者与战略伙伴</h2>
            <p className="mt-4 max-w-3xl leading-7 text-white/70">
              PHENIX 不公开募资，不承诺收益。平台以真实资产、真实交易、真实服务为基础，欢迎长期认同文化资产流通价值的伙伴共同参与基础设施建设。
            </p>
          </div>
          <Link
            to="/liquidity"
            className="inline-flex items-center justify-center gap-2 border border-white/30 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            了解流通机制
            <Network className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
