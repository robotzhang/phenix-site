import { useEffect, useState } from "react";
import GlobalLoading from "@/components/ui/global-loading";
import {
  formatProductAssetPrice,
  getProductAssetDisplayName,
  getMergedProductAssetById,
} from "@/data/product-assets";
import { useRwaDetail } from "@/hooks/useRwa";
import {
  formatRwaPriceWithCurrency,
  getRwaSellerCategoryClassName,
} from "@/lib/rwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  LockKeyhole,
  PackageCheck,
  Ruler,
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
    text: "资产文件包作为线上索引，用于关联线下鉴定、托管与影像材料。",
  },
  {
    icon: LockKeyhole,
    title: "数字确权",
    text: "线上存证、持有人信息与状态记录共同形成可追踪的权属凭证。",
  },
  {
    icon: ShieldCheck,
    title: "托管服务",
    text: "资产可进入第三方托管、保险、安保与跨境流通服务网络。",
  },
  {
    icon: WalletCards,
    title: "流通支持",
    text: "围绕典当、拍卖、回收等渠道建立更清晰的服务申请路径。",
  },
];

export function meta() {
  return [
    { title: "文化艺术品资产详情 | PHENIX" },
    {
      name: "description",
      content:
        "查看 PHENIX 线上文化艺术品资产的确权记录、资产文件包 hash 与流通信息。",
    },
  ];
}

export default function RwaShow() {
  const { assetId } = useParams();
  const adminMetadataMap = useRwaAdminMetadataMap();
  const productAsset = getMergedProductAssetById(assetId, adminMetadataMap);
  const shouldReadChainAsset = !productAsset && !!assetId && /^\d+$/.test(assetId);
  const { data: rwa, loading } = useRwaDetail(shouldReadChainAsset ? assetId : undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [assetId]);

  if (productAsset) {
    const displayName = getProductAssetDisplayName(productAsset);
    const imageURLs = [...productAsset.imageURLs, ...productAsset.certificateURLs];
    const selectedImageURL =
      imageURLs[selectedImageIndex] ?? imageURLs[0] ?? productAsset.imageURL;
    const hasMultipleImages = imageURLs.length > 1;

    const showPreviousImage = () => {
      setSelectedImageIndex((current) => (current - 1 + imageURLs.length) % imageURLs.length);
    };

    const showNextImage = () => {
      setSelectedImageIndex((current) => (current + 1) % imageURLs.length);
    };

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
            <div>
              <div className="relative overflow-hidden border border-sky-100 bg-sky-50 shadow-sm">
                <img
                  src={selectedImageURL}
                  alt={displayName}
                  className="aspect-[4/3] h-full w-full object-cover"
                />
                {hasMultipleImages ? (
                  <>
                    <button
                      type="button"
                      aria-label="上一张产品图片"
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/80 bg-white/90 text-sky-950 shadow-sm transition hover:bg-white"
                      onClick={showPreviousImage}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="下一张产品图片"
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/80 bg-white/90 text-sky-950 shadow-sm transition hover:bg-white"
                      onClick={showNextImage}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 border border-white/80 bg-white/90 px-3 py-1 text-sm font-semibold text-sky-950 shadow-sm">
                      {selectedImageIndex + 1} / {imageURLs.length}
                    </div>
                  </>
                ) : null}
              </div>

              {hasMultipleImages ? (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {imageURLs.map((imageURL, index) => {
                    const isCertificate = productAsset.certificateURLs.includes(imageURL);

                    return (
                      <button
                        type="button"
                        key={imageURL}
                        className={`relative overflow-hidden border bg-sky-50 transition ${
                          index === selectedImageIndex
                            ? "border-sky-500"
                            : "border-sky-100 hover:border-sky-300"
                        }`}
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`查看第 ${index + 1} 张产品图片`}
                      >
                        <img src={imageURL} alt="" className="aspect-square w-full object-cover" />
                        {isCertificate ? (
                          <span className="absolute bottom-1 right-1 bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            证书
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="border border-sky-100 px-3 py-1 text-sm text-sky-900/60">
                  {productAsset.categoryLabel}
                </span>
                <span
                  className={`border px-3 py-1 text-sm font-semibold ${getRwaSellerCategoryClassName(
                    productAsset.sellerCategoryLabel,
                  )}`}
                >
                  {productAsset.sellerCategoryLabel}
                </span>
                {productAsset.certificateURLs.length > 0 ? (
                  <span className="inline-flex items-center gap-1 border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    含证书影像
                  </span>
                ) : null}
              </div>
              <div className="mt-5 text-sm font-semibold text-sky-700">{productAsset.id}</div>
              <h1 className="mt-2 text-4xl font-semibold leading-tight text-sky-950 sm:text-5xl">
                {displayName}
              </h1>
              <p className="mt-5 leading-8 text-sky-900/70">
                该资产来自 PHENIX 产品目录，已整理产品影像、规格、会员价与文件包 hash。
                页面用于资产库展示、会员配置沟通和后续托管确权材料索引。
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                  <div className="text-sm text-sky-900/60">会员价</div>
                  <div className="mt-2 text-3xl font-semibold text-sky-950">
                    {formatProductAssetPrice(productAsset.priceCny)}
                  </div>
                </div>
                <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                  <div className="text-sm text-sky-900/60">资产编号</div>
                  <div className="mt-2 break-all text-2xl font-semibold text-sky-950">
                    {productAsset.id}
                  </div>
                </div>
                <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-sky-900/60">
                    <PackageCheck className="h-4 w-4 text-sky-700" />
                    规格
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-sky-950">
                    {productAsset.spec}
                  </div>
                </div>
                <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-sky-900/60">
                    <Ruler className="h-4 w-4 text-sky-700" />
                    尺寸
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-sky-950">
                    {productAsset.size || "待补充"}
                  </div>
                </div>
              </div>

              <div className="mt-6 border border-sky-100 bg-white/80 p-5 shadow-sm">
                <div className="text-sm text-sky-900/60">资产文件包 hash</div>
                <div className="mt-2 break-all font-mono text-sm text-sky-950">
                  {productAsset.fileHash}
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
              Product Record
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950">产品目录记录</h2>
            <p className="mt-5 leading-8 text-sky-900/70">
              产品目录记录用于展示真实资产信息，并与后续线上确权、第三方托管、保险及流通资料建立索引关系。
            </p>
          </div>
          <div className="divide-y divide-sky-100 border border-sky-100 bg-white/80 shadow-sm">
            <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
              <div className="text-sm text-sky-900/60">资产名称</div>
              <div className="font-semibold text-sky-950">{displayName}</div>
            </div>
            <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
              <div className="text-sm text-sky-900/60">文件包 hash</div>
              <div className="break-all font-mono text-sm text-sky-950">
                {productAsset.fileHash}
              </div>
            </div>
            <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
              <div className="text-sm text-sky-900/60">证书影像</div>
              <div className="text-sm font-semibold text-sky-950">
                {productAsset.certificateURLs.length > 0
                  ? `${productAsset.certificateURLs.length} 张`
                  : "暂无"}
              </div>
            </div>
            <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
              <div className="text-sm text-sky-900/60">卖家类别</div>
              <div>
                <span
                  className={`inline-flex border px-3 py-1 text-sm font-semibold ${getRwaSellerCategoryClassName(
                    productAsset.sellerCategoryLabel,
                  )}`}
                >
                  {productAsset.sellerCategoryLabel}
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
              展示资产信息与服务路径，不公开募资，不承诺收益。
            </p>
          </div>
        </section>
      </div>
    );
  }

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
  const imageURLs =
    adminMetadataMap[tokenId]?.imageURLs && adminMetadataMap[tokenId].imageURLs.length > 0
      ? adminMetadataMap[tokenId].imageURLs
      : rwa.imageURLs;
  const selectedImageURL = imageURLs[selectedImageIndex] ?? imageURLs[0] ?? rwa.imageURL;
  const hasMultipleImages = imageURLs.length > 1;

  const showPreviousImage = () => {
    setSelectedImageIndex((current) => (current - 1 + imageURLs.length) % imageURLs.length);
  };

  const showNextImage = () => {
    setSelectedImageIndex((current) => (current + 1) % imageURLs.length);
  };

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
          <div>
            <div className="relative overflow-hidden border border-sky-100 bg-sky-50 shadow-sm">
              <img
                src={selectedImageURL}
                alt={rwa.asset.name}
                className="aspect-[4/3] h-full w-full object-cover"
              />
              {hasMultipleImages ? (
                <>
                  <button
                    type="button"
                    aria-label="上一张产品图片"
                    className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/80 bg-white/90 text-sky-950 shadow-sm transition hover:bg-white"
                    onClick={showPreviousImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="下一张产品图片"
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-white/80 bg-white/90 text-sky-950 shadow-sm transition hover:bg-white"
                    onClick={showNextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 border border-white/80 bg-white/90 px-3 py-1 text-sm font-semibold text-sky-950 shadow-sm">
                    {selectedImageIndex + 1} / {imageURLs.length}
                  </div>
                </>
              ) : null}
            </div>

            {hasMultipleImages ? (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {imageURLs.map((imageURL, index) => (
                  <button
                    type="button"
                    key={imageURL}
                    className={`overflow-hidden border bg-sky-50 transition ${
                      index === selectedImageIndex
                        ? "border-sky-500"
                        : "border-sky-100 hover:border-sky-300"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    aria-label={`查看第 ${index + 1} 张产品图片`}
                  >
                    <img src={imageURL} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
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
              该资产已形成线上索引，可用于连接线下资产文件、托管记录与后续流通服务。页面展示的信息来自
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
          <h2 className="mt-4 text-3xl font-semibold text-sky-950">线上记录</h2>
          <p className="mt-5 leading-8 text-sky-900/70">
            PHENIX 使用线上信息作为资产索引，并通过文件包 hash
            关联线下资料。线上凭证不等同于收益承诺，也不替代专业鉴定与托管文件。
          </p>
        </div>
        <div className="divide-y divide-sky-100 border border-sky-100 bg-white/80 shadow-sm">
          <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
            <div className="text-sm text-sky-900/60">链上资产</div>
            <a
              href={rwa.explorerURL}
              target="_blank"
              rel="noreferrer"
              className="flex min-w-0 items-center gap-2 break-all text-sm font-semibold text-sky-950 hover:text-sky-700"
            >
              {rwa.explorerURL}
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
          </div>
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
              展示资产信息与服务路径，不公开募资，不承诺收益。
            </p>
        </div>
      </section>
    </div>
  );
}
