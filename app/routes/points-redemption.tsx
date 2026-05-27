import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ExternalLink,
  Gift,
  Leaf,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import RightsBoundaryNotice from "@/components/biz/RightsBoundaryNotice";

const redemptionProducts = [
  {
    id: "culture-course",
    type: "课程",
    name: "文化艺术品资产配置入门课",
    points: 800,
    status: "即将上线",
    image: "/rda-blue-vivid.png",
    summary: "面向新会员的文化艺术品资产配置基础课程。",
    description:
      "围绕文化艺术品资产识别、托管确权、会员权益与流通边界展开，帮助会员建立参与 PHENIX 生态前的基础认知。",
    rights: ["线上课程访问资格", "课程资料包", "后续专题活动优先通知"],
    actionLabel: "预约兑换",
    icon: BookOpenCheck,
  },
  {
    id: "member-kit",
    type: "虚拟物品",
    name: "会员专属线上资料包",
    points: 300,
    status: "即将上线",
    image: "/member-credential.svg",
    summary: "用于会员学习与项目理解的线上资料权益。",
    description:
      "资料包包含会员体系说明、资产库阅读指引、积分使用规则和社区活动资料，后续可接入下载或外部权益链接。",
    rights: ["线上资料包", "会员规则说明", "社区活动信息更新"],
    actionLabel: "查看权益",
    icon: Gift,
  },
  {
    id: "wellness-green",
    type: "康养产品",
    name: "精选绿色产品兑换权益",
    points: 1200,
    status: "规划中",
    image: "/fnft-blue-vivid.png",
    summary: "面向会员的绿色产品兑换权益预告。",
    description:
      "后续可对接绿色产品、康养服务或品牌权益。正式上线后，会员可使用 PHENIX 积分申请兑换。",
    rights: ["产品兑换资格", "品牌权益通知", "团购或活动优先参与"],
    actionLabel: "了解规划",
    icon: Leaf,
  },
];

type RedemptionProduct = (typeof redemptionProducts)[number];

function formatPoints(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function meta() {
  return [
    { title: "积分兑换 | PHENIX" },
    {
      name: "description",
      content: "PHENIX 积分兑换入口，展示可兑换产品、权益说明与后续兑换流程。",
    },
  ];
}

export default function PointsRedemption() {
  const [selectedProductId, setSelectedProductId] = useState<RedemptionProduct["id"]>(
    redemptionProducts[0].id,
  );
  const [step, setStep] = useState<"detail" | "confirm">("detail");

  const selectedProduct = useMemo(
    () =>
      redemptionProducts.find((product) => product.id === selectedProductId) ??
      redemptionProducts[0],
    [selectedProductId],
  );
  const SelectedIcon = selectedProduct.icon;

  const handleSelectProduct = (productId: RedemptionProduct["id"]) => {
    setSelectedProductId(productId);
    setStep("detail");
  };

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-10 sm:px-0 sm:py-14">
        <Link
          to="/points-mall"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-900/70 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回社区商城
        </Link>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Points Redemption
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
              积分兑换
            </h1>
          </div>
          <p className="text-lg leading-8 text-sky-900/70">
            选择产品查看权益详情，后续可接入外部权益链接、商品详情页或线上积分扣减流程。当前页面先展示兑换路径和确认信息。
          </p>
        </div>
        <RightsBoundaryNotice className="mt-6" compact />
      </section>

      <section className="grid gap-6 px-4 py-10 sm:px-0 sm:py-14 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-700">
            <ShoppingBag className="h-4 w-4" />
            可兑换产品
          </div>
          <div className="grid gap-4">
            {redemptionProducts.map((product) => {
              const ProductIcon = product.icon;
              const active = product.id === selectedProduct.id;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product.id)}
                  className={`grid gap-4 border p-4 text-left shadow-sm transition sm:grid-cols-[120px_1fr_auto] sm:items-center ${
                    active
                      ? "border-sky-400 bg-sky-50"
                      : "border-sky-100 bg-white hover:border-sky-300"
                  }`}
                >
                  <div className="aspect-[4/3] overflow-hidden border border-sky-100 bg-white">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 border border-sky-100 bg-white px-2 py-1 text-xs font-semibold text-sky-700">
                      <ProductIcon className="h-3.5 w-3.5" />
                      {product.type}
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-sky-950">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-sky-900/60">
                      {product.summary}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-lg font-semibold text-sky-950">
                      {formatPoints(product.points)} 积分
                    </div>
                    <div className="mt-2 text-sm text-sky-700">{product.status}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border border-sky-100 bg-white p-6 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="overflow-hidden border border-sky-100 bg-sky-50">
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700">
                <SelectedIcon className="h-4 w-4" />
                {selectedProduct.type}
              </div>
              <h2 className="mt-5 text-3xl font-semibold leading-tight text-sky-950">
                {selectedProduct.name}
              </h2>
              <p className="mt-4 leading-7 text-sky-900/70">
                {selectedProduct.description}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="border border-sky-100 bg-sky-50 p-4">
              <div className="text-sm text-sky-900/60">兑换积分</div>
              <div className="mt-2 text-2xl font-semibold text-sky-950">
                {formatPoints(selectedProduct.points)}
              </div>
            </div>
            <div className="border border-sky-100 bg-sky-50 p-4">
              <div className="text-sm text-sky-900/60">状态</div>
              <div className="mt-2 text-2xl font-semibold text-sky-950">
                {selectedProduct.status}
              </div>
            </div>
            <div className="border border-sky-100 bg-sky-50 p-4">
              <div className="text-sm text-sky-900/60">积分扣减</div>
              <div className="mt-2 text-2xl font-semibold text-sky-950">待接入</div>
            </div>
          </div>

          <div className="mt-6 border-y border-sky-100 py-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
              <Sparkles className="h-4 w-4 text-sky-700" />
              权益内容
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {selectedProduct.rights.map((right) => (
                <div key={right} className="border border-sky-100 bg-white p-4 text-sm text-sky-900/70">
                  {right}
                </div>
              ))}
            </div>
          </div>

          {step === "detail" && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="inline-flex items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                {selectedProduct.actionLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#redemption-flow"
                className="inline-flex items-center justify-center gap-2 border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
              >
                查看流程
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {step === "confirm" && (
            <div className="mt-6 border border-sky-100 bg-sky-50 p-5">
              <div className="flex items-center gap-2 font-semibold text-sky-950">
                <BadgeCheck className="h-5 w-5 text-sky-700" />
                兑换确认
              </div>
              <p className="mt-3 text-sm leading-7 text-sky-900/70">
                当前选择：{selectedProduct.name}，预计消耗{" "}
                {formatPoints(selectedProduct.points)} PHENIX 积分。正式上线后这里会连接积分扣减、商品权益发放和外部链接跳转。
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  确认兑换
                  <TicketPercent className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStep("detail")}
                  className="inline-flex items-center justify-center border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
                >
                  返回详情
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        id="redemption-flow"
        className="border-y border-sky-100 bg-white/70 px-4 py-12 sm:px-0 sm:py-16"
      >
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Redemption Flow
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">
              后续跳转与扣减路径
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["01", "查看产品详情"],
              ["02", "确认消耗积分"],
              ["03", "跳转外部权益链接或发放商品"],
              ["04", "同步 PHENIX 积分与兑换记录"],
            ].map(([index, text]) => (
              <div key={index} className="border border-sky-100 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-sky-700">{index}</div>
                <div className="mt-5 font-semibold text-sky-950">{text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-0 sm:py-16">
        <div className="border border-sky-100 bg-[linear-gradient(180deg,#f7fbfd_0%,#e8f2f8_100%)] p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
            <p className="text-sm leading-7 text-sky-900/70">
              当前为积分兑换展示与流程页面。商品上线状态、积分消耗、权益发放和外部链接以正式规则为准。
              PHENIX 积分仅用于平台权益核算与兑换记录，不代表现金价值、固定收益或可对外兑付资产。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
