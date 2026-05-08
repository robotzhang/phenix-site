import { Link } from "react-router";
import {
  ArrowRight,
  BookOpenCheck,
  Gift,
  ShoppingBag,
  TicketPercent,
  Users,
  WalletCards,
} from "lucide-react";

const scenarios = [
  {
    icon: BookOpenCheck,
    title: "线上课程",
    text: "使用 PHENIX 积分兑换文化艺术品鉴赏、资产配置、托管确权等线上课程。",
  },
  {
    icon: Gift,
    title: "虚拟物品",
    text: "兑换数字权益、会员虚拟徽章、活动资格、资料包等线上虚拟物品。",
  },
  {
    icon: Users,
    title: "兑换康养产品",
    text: "积分可用于兑换平台提供的绿色产品，支持会员共同参与精选商品与服务。",
  },
];

const products = [
  { type: "课程", name: "文化艺术品资产配置入门课", points: "800 PHENIX", status: "即将上线" },
  { type: "虚拟物品", name: "会员专属线上资料包", points: "300 PHENIX", status: "即将上线" },
  { type: "康养产品", name: "精选绿色产品兑换权益", points: "1200 PHENIX", status: "规划中" },
];

export function meta() {
  return [
    { title: "社区商城 | PHENIX" },
    { name: "description", content: "PHENIX 积分可用于兑换课程、虚拟物品、康养产品等应用场景。" },
  ];
}

export default function PointsMall() {
  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-16 sm:px-0 sm:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Points Mall</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
            PHENIX 积分用途
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            PHENIX 积分可用于兑换商城的商品、服务及各种权益。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/staking"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              质押领积分
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/assets"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              查看我的资产
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-4 py-16 sm:px-0 sm:py-24 md:grid-cols-3">
        {scenarios.map((item) => (
          <article key={item.title} className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <item.icon className="h-7 w-7 text-sky-700" />
            <h2 className="mt-5 text-xl font-semibold text-sky-950">{item.title}</h2>
            <p className="mt-3 leading-7 text-sky-900/70">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Catalog Preview</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">积分商品目录</h2>
        </div>

        <div className="grid gap-4">
          {products.map((product) => (
            <article
              key={product.name}
              className="grid gap-4 border border-sky-100 bg-white p-5 shadow-sm sm:grid-cols-[120px_1fr_auto_auto] sm:items-center"
            >
              <div className="inline-flex w-fit items-center gap-2 border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                <ShoppingBag className="h-4 w-4" />
                {product.type}
              </div>
              <div>
                <h3 className="font-semibold text-sky-950">{product.name}</h3>
                <p className="mt-1 text-sm text-sky-900/60">支持使用 PHENIX 积分兑换</p>
              </div>
              <div className="font-semibold text-sky-950">{product.points}</div>
              <div className="text-sm text-sky-700">{product.status}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-8 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Member Redemption</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">年度兑换统计</h2>
          <p className="mt-6 leading-8 text-sky-900/70">
            会员通过链接钱包方式登录后，平台可按钱包地址统计当年积分兑换额，用于会员等级、活动资格和后续权益策略。
          </p>
        </div>

        <div className="border border-sky-100 bg-white p-6 shadow-sm">
          <WalletCards className="h-7 w-7 text-sky-700" />
          <h3 className="mt-5 text-2xl font-semibold text-sky-950">钱包登录状态</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bg-sky-50 p-5">
              <div className="text-sm text-sky-900/60">会员钱包</div>
              <div className="mt-3 break-all text-lg font-semibold text-sky-950">
                通过导航栏连接钱包登录
              </div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="text-sm text-sky-900/60">年度兑换额</div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">0 PHENIX</div>
            </div>
          </div>
          <div className="mt-5 border border-sky-100 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
              <TicketPercent className="h-4 w-4 text-sky-700" />
              后续可扩展
            </div>
            <p className="mt-3 text-sm leading-7 text-sky-900/60">
              积分余额、积分扣减、订单记录、团购进度、年度兑换排行榜和会员权益升级。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
