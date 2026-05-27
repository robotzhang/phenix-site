import {
  formatProductAssetPrice,
  getProductAssetDisplayName,
  mergeProductAssetsWithAdminMetadata,
} from "@/data/product-assets";
import { useRwaList } from "@/hooks/useRwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import {
  formatRwaPriceWithCurrency,
  getRwaSellerCategoryClassName,
} from "@/lib/rwa";
import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  FileCheck2,
  LockKeyhole,
  PackageCheck,
  Ruler,
  ShieldCheck,
} from "lucide-react";

export function meta() {
  return [
    { title: "资产库 | PHENIX" },
    {
      name: "description",
      content:
        "浏览 PHENIX 精选文化艺术品资产，查看产品影像、规格、会员价、文件包 hash 与证书资料。",
    },
  ];
}

export default function RwaList() {
  const adminMetadataMap = useRwaAdminMetadataMap();
  const { data: onlineAssets } = useRwaList();
  const productAssets = mergeProductAssetsWithAdminMetadata(adminMetadataMap);
  const publishedOnlineAssets = onlineAssets.filter((asset) => asset.asset.status === 0);
  const certificateCount = productAssets.reduce(
    (count, asset) => count + asset.certificateURLs.length,
    0,
  );
  const categoryLabels = Array.from(
    new Set(
      [
        ...productAssets.map((asset) => asset.categoryLabel),
        ...publishedOnlineAssets.map((asset) => asset.categoryLabel),
      ].filter(Boolean),
    ),
  );
  const assetCount = productAssets.length + publishedOnlineAssets.length;

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-14 sm:px-0 sm:py-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Asset Pool
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
              文化艺术品资产库
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
              PHENIX 不卖单品，而是构建可配置资产库。Phenix严选资产入库，每个资产都经过资料收集整理、文件包
              hash 与确权资料，用于支撑后续第三方托管、第三方典当等服务申请，让平台会员持有的文化艺术品资产拥有更清晰的资料索引和流通服务路径。
            </p>
          </div>
          <div className="grid grid-cols-3 border border-sky-100 bg-white/90 shadow-sm">
            <div className="border-r border-sky-100 p-4">
              <div className="text-2xl font-semibold text-sky-950">
                {assetCount}
              </div>
              <div className="mt-1 text-sm text-sky-900/60">精选资产</div>
            </div>
            <div className="border-r border-sky-100 p-4">
              <div className="text-2xl font-semibold text-sky-950">
                {certificateCount}
              </div>
              <div className="mt-1 text-sm text-sky-900/60">证书影像</div>
            </div>
            <div className="p-4">
              <div className="text-2xl font-semibold text-sky-950">
                {categoryLabels.length} 类
              </div>
              <div className="mt-1 text-sm text-sky-900/60">
                {categoryLabels.slice(0, 2).join(" / ") || "待入库"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-b border-sky-100 bg-[linear-gradient(180deg,#f7fbfd_0%,#edf6fb_100%)] px-4 py-8 text-sky-950 sm:px-8 md:grid-cols-3">
        <div className="flex gap-3">
          <ShieldCheck className="mt-1 h-5 w-5 text-sky-700" />
          <div>
            <h2 className="font-semibold">严选入库</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900/70">
              围绕真伪、稀缺性、历史意义与流通能力进行多层评估。
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <LockKeyhole className="mt-1 h-5 w-5 text-sky-700" />
          <div>
            <h2 className="font-semibold">托管优先</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900/70">
              资产信息展示服务于后续第三方托管、保险与流通服务。
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <FileCheck2 className="mt-1 h-5 w-5 text-sky-700" />
          <div>
            <h2 className="font-semibold">资料索引</h2>
            <p className="mt-2 text-sm leading-6 text-sky-900/70">
              通过资产编号与文件包 hash 关联产品影像、证书和托管资料。
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-0 sm:py-14">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-sky-950">精选资产</h2>
          </div>
          <div className="flex items-center gap-2 border border-sky-100 bg-white/80 px-3 py-2 text-sm text-sky-900/60 shadow-sm">
            <CircleAlert className="h-4 w-4" />
            严选文化艺术品资产
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {productAssets.map((asset) => (
            <Link
              key={asset.id}
              to={`/asset/${asset.id}`}
              className="group overflow-hidden border border-sky-100 bg-white/90 shadow-sm transition hover:border-sky-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-sky-50">
                <img
                  src={asset.imageURL}
                  alt={getProductAssetDisplayName(asset)}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 border border-white/80 bg-white/90 px-2 py-1 text-xs font-semibold text-sky-950 shadow-sm">
                  {asset.id}
                </div>
                {asset.certificateURLs.length > 0 ? (
                  <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 border border-emerald-100 bg-white/90 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    证书
                  </div>
                ) : null}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex border border-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                      {asset.categoryLabel}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold leading-snug text-sky-950">
                      {getProductAssetDisplayName(asset)}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 border px-2 py-1 text-xs font-semibold ${getRwaSellerCategoryClassName(
                      asset.sellerCategoryLabel,
                    )}`}
                  >
                    {asset.sellerCategoryLabel}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 border-t border-sky-100 pt-4 sm:grid-cols-2">
                  <div className="flex gap-2 text-sm text-sky-900/70">
                    <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                    <span>{asset.spec}</span>
                  </div>
                  {asset.size ? (
                    <div className="flex gap-2 text-sm text-sky-900/70">
                      <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
                      <span>{asset.size}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-5">
                  <div className="text-sm text-sky-900/60">会员价</div>
                  <div className="mt-1 text-2xl font-semibold text-sky-950">
                    {formatProductAssetPrice(asset.priceCny)}
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between text-sm text-sky-900/70">
                  <span className="max-w-[68%] truncate">
                    Hash {asset.fileHash}
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-950">
                    查看详情
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {publishedOnlineAssets.map((asset) => {
            const tokenId = asset.tokenId.toString();
            const displayCode =
              asset.asset.name.match(/[A-Z]{2,4}\d{4,}/i)?.[0]?.toUpperCase() ??
              `A${tokenId}`;

            return (
              <Link
                key={`online-${tokenId}`}
                to={`/asset/${tokenId}`}
                className="group overflow-hidden border border-sky-100 bg-white/90 shadow-sm transition hover:border-sky-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sky-50">
                  <img
                    src={asset.imageURL}
                    alt={asset.asset.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 border border-white/80 bg-white/90 px-2 py-1 text-xs font-semibold text-sky-950 shadow-sm">
                    {displayCode}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex border border-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                        {asset.categoryLabel}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold leading-snug text-sky-950">
                        {asset.asset.name}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 border px-2 py-1 text-xs font-semibold ${getRwaSellerCategoryClassName(
                        asset.sellerCategoryLabel,
                      )}`}
                    >
                      {asset.sellerCategoryLabel}
                    </span>
                  </div>
                  <div className="mt-5 border-t border-sky-100 pt-4">
                    <div className="text-sm text-sky-900/60">会员价</div>
                    <div className="mt-1 text-2xl font-semibold text-sky-950">
                      {formatRwaPriceWithCurrency(asset.asset.pricePhenixFormatted)}
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-sm text-sky-900/70">
                    <span className="max-w-[68%] truncate">
                      Hash {asset.asset.fileHash}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-950">
                      查看详情
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
