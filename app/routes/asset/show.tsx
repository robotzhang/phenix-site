import GlobalLoading from "@/components/ui/global-loading";
import { useRwaDetail } from "@/hooks/useRwa";
import {
  formatRwaPriceWithCurrency,
  getRwaSellerCategoryClassName,
} from "@/lib/rwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ExternalLink,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

function shortAddress(value?: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

const trustRecords = [
  {
    icon: FileCheck2,
    title: "文件包 hash",
    text: "资产文件包作为链上索引，用于关联线下鉴定、托管与影像材料。",
  },
  {
    icon: LockKeyhole,
    title: "数字确权",
    text: "Token ID、持有人地址与状态记录共同形成可追踪的权属凭证。",
  },
  {
    icon: ShieldCheck,
    title: "托管服务",
    text: "资产可进入第三方托管、保险、安保与跨境流通服务网络。",
  },
  {
    icon: WalletCards,
    title: "流通支持",
    text: "围绕典当、拍卖、回收等渠道建立更清晰的退出路径。",
  },
];

export function meta() {
  return [
    { title: "文化艺术品资产详情 | PHENIX" },
    {
      name: "description",
      content:
        "查看 PHENIX 链上文化艺术品资产的确权记录、资产文件包 hash 与流通信息。",
    },
  ];
}

export default function RwaShow() {
  const { assetId } = useParams();
  const { data: rwa, loading } = useRwaDetail(assetId);
  const adminMetadataMap = useRwaAdminMetadataMap();

  if (loading) return <GlobalLoading />;

  if (!rwa) {
    return (
      <div className="py-16">
        <Link
          to="/asset"
          className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          返回资产库
        </Link>
        <div className="mt-8 border border-neutral-200 bg-white p-8 text-center text-muted-foreground">
          未找到该资产。
        </div>
      </div>
    );
  }

  const tokenId = rwa.tokenId.toString();
  const categoryLabel = adminMetadataMap[tokenId]?.categoryLabel ?? rwa.categoryLabel;
  const sellerCategoryLabel =
    adminMetadataMap[tokenId]?.sellerCategoryLabel ?? rwa.sellerCategoryLabel;

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-8 sm:px-0 sm:py-12">
        <Link
          to="/asset"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-900/70 hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回资产库
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.95fr]">
          <div className="overflow-hidden border border-sky-100 bg-sky-50 shadow-sm">
            <img
              src={rwa.imageURL}
              alt={rwa.asset.name}
              className="aspect-[4/3] h-full w-full object-cover"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-sky-100 px-3 py-1 text-sm text-sky-900/60">
                {categoryLabel}
              </span>
              <span
                className={`border px-3 py-1 text-sm font-semibold ${getRwaSellerCategoryClassName(
                  sellerCategoryLabel,
                )}`}
              >
                {sellerCategoryLabel}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-sky-950 sm:text-5xl">
              {rwa.asset.name}
            </h1>
            <p className="mt-5 leading-8 text-sky-900/70">
              该资产已形成链上索引，可用于连接线下资产文件、托管记录与后续流通服务。页面展示的信息来自
              资产合约读取结果。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                <div className="text-sm text-sky-900/60">会员价</div>
                <div className="mt-2 text-3xl font-semibold text-sky-950">
                  {formatRwaPriceWithCurrency(rwa.asset.pricePhenixFormatted)}
                </div>
              </div>
              <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                <div className="text-sm text-sky-900/60">当前持有人</div>
                <div className="mt-2 break-all text-xl font-semibold text-sky-950">
                  {shortAddress(rwa.owner)}
                </div>
              </div>
            </div>

            <div className="mt-6 border border-sky-100 bg-white/80 p-5 shadow-sm">
              <div className="text-sm text-sky-900/60">资产文件包 hash</div>
              <div className="mt-2 break-all font-mono text-sm text-sky-950">
                {rwa.asset.fileHash}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-4 py-12 sm:px-0 sm:py-16 md:grid-cols-2 lg:grid-cols-4">
        {trustRecords.map((item) => (
          <article
            key={item.title}
            className="border border-sky-100 bg-white/80 p-5 shadow-sm"
          >
            <item.icon className="h-5 w-5 text-sky-700" />
            <h2 className="mt-4 font-semibold text-sky-950">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-sky-900/70">
              {item.text}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 border-y border-sky-100 bg-white/70 px-4 py-12 sm:px-0 sm:py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            Asset Record
          </p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950">链上记录</h2>
          <p className="mt-5 leading-8 text-sky-900/70">
            PHENIX 使用链上信息作为资产索引，并通过文件包 hash
            关联线下资料。链上凭证不等同于收益承诺，也不替代专业鉴定与托管文件。
          </p>
        </div>
        <div className="divide-y divide-sky-100 border border-sky-100 bg-white/80 shadow-sm">
          <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
            <div className="text-sm text-sky-900/60">Token URI</div>
            <a
              href={rwa.tokenURI}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2 break-all text-sm font-semibold text-sky-950 hover:text-sky-700"
            >
              {rwa.tokenURI}
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          </div>
          <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
            <div className="text-sm text-sky-900/60">Owner</div>
            <div className="break-all font-mono text-sm text-sky-950">
              {rwa.owner}
            </div>
          </div>
          <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
            <div className="text-sm text-sky-900/60">卖家类别</div>
            <div>
              <span
                className={`inline-flex border px-3 py-1 text-sm font-semibold ${getRwaSellerCategoryClassName(
                  sellerCategoryLabel,
                )}`}
              >
                {sellerCategoryLabel}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-0 sm:py-16">
        <div className="border border-sky-100 bg-[linear-gradient(180deg,#f7fbfd_0%,#e8f2f8_100%)] p-8 text-sky-950 shadow-sm">
          <h2 className="text-2xl font-semibold">风险提示</h2>
          <p className="mt-4 max-w-4xl leading-7 text-sky-900/70">
            文化艺术品资产价格受市场需求、稀缺性、保存状态、交易渠道和宏观环境影响。PHENIX
            展示链上资产信息与服务路径，不公开募资，不承诺收益。
          </p>
        </div>
      </section>
    </div>
  );
}
