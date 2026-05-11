import { Link } from "react-router";
import {
  ArrowRight,
  BookOpenCheck,
  Coins,
  Gift,
  HeartHandshake,
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
    title: "康养产品",
    text: "积分可用于兑换平台提供的绿色产品，支持会员共同参与精选商品与服务。",
  },
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
              className="inline-flex items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              <Coins className="h-4 w-4" />
              锁仓领积分
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
          <article
            key={item.title}
            className="flex min-h-[260px] flex-col border border-sky-100 bg-white/80 p-6 shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center border border-sky-100 bg-sky-50">
              <item.icon className="h-6 w-6 text-sky-700" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-sky-950">{item.title}</h2>
            <p className="mt-3 leading-7 text-sky-900/70">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="border-t border-sky-100 bg-sky-50/60 px-4 py-10 sm:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Points Mall</p>
            <h2 className="mt-2 text-2xl font-semibold text-sky-950">积分商城</h2>
          </div>
          <Link
            to="/points-redemption"
            className="inline-flex w-fit min-w-[132px] items-center justify-center border border-sky-300 bg-white px-8 py-3 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-900"
          >
            积分兑换
          </Link>
        </div>
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Community Code</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">社区成员守则</h2>
          </div>
          <div className="border border-sky-100 bg-white p-6 shadow-sm">
            <HeartHandshake className="h-7 w-7 text-sky-700" />
            <h3 className="mt-5 text-2xl font-semibold text-sky-950">“龙凤呈祥社区”成员守则</h3>
            <p className="mt-4 leading-8 text-sky-900/70">
              社区基本原则：平等、实干、共赢。
            </p>
            <Link
              to="/community-code"
              className="mt-6 inline-flex items-center justify-center gap-2 border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              查看成员守则
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-8 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Member Redemption</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">年度兑换统计</h2>
          <p className="mt-6 leading-8 text-sky-900/70">
            登录查看兑换记录
          </p>
        </div>

        <div className="border border-sky-100 bg-white p-6 shadow-sm">
          <WalletCards className="h-7 w-7 text-sky-700" />
          <h3 className="mt-5 text-2xl font-semibold text-sky-950">钱包登录状态</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bg-sky-50 p-5">
              <div className="text-sm text-sky-900/60">会员钱包</div>
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
