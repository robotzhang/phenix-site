import { useEffect, useMemo, useState } from "react";
import { Link, useParams, type LoaderFunctionArgs } from "react-router";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileArchive,
  FileCheck2,
  LockKeyhole,
  PackageCheck,
  Pencil,
  ReceiptText,
  Ruler,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  formatProductAssetPrice,
  getMergedProductAssetById,
  getProductAssetDisplayName,
  type ProductAsset,
} from "@/data/product-assets";
import { getRwaSellerCategoryClassName } from "@/lib/rwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import { AssetBreadcrumb, AssetHeader } from "./asset/shared";

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

const ASSET_DETAIL_TAB_TRIGGER_CLASS =
  "relative h-11 flex-none rounded-none border-0 bg-transparent px-0 pr-7 text-sm font-semibold text-muted-foreground shadow-none after:absolute after:bottom-0 after:left-0 after:right-7 after:h-0.5 after:bg-transparent after:content-[''] data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-foreground";
const BASESCAN_TX_BASE = "https://basescan.org/tx/";

function getAssetChainStatusLabel(status?: ProductAsset["chainStatus"]) {
  if (status === "confirmed") return "已上链";
  if (status === "pending") return "上链中";
  if (status === "failed") return "上链失败";
  return "草稿";
}

function getAssetChainStatusClassName(status?: ProductAsset["chainStatus"]) {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-neutral-200 bg-neutral-50 text-neutral-700";
}

function formatPackageSize(value?: string) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "未知大小";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminPage(context, request);
  return null;
}

export function meta() {
  return [
    { title: "资产详情 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminAssetDetail() {
  const { assetId } = useParams();
  const adminMetadataMap = useRwaAdminMetadataMap();
  const asset = getMergedProductAssetById(assetId, adminMetadataMap);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("product");

  useEffect(() => {
    setSelectedImageIndex(0);
    setActiveTab("product");
  }, [assetId]);

  if (!asset) {
    return (
      <div className="min-h-screen bg-neutral-100 text-neutral-950">
        <AssetHeader
          title="资产详情"
          leading={<AssetBreadcrumb items={[{ label: "资产库", to: "/admin/asset" }, { label: "未找到" }]} />}
        />
        <main className="mx-auto max-w-4xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>资产不存在</CardTitle>
              <CardDescription>没有找到这个资产编号，或后台资料还在加载。</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link to="/admin/asset">返回资产列表</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const displayName = getProductAssetDisplayName(asset);
  const imageURLs = [...asset.imageURLs, ...asset.certificateURLs];
  const selectedImageURL = imageURLs[selectedImageIndex] ?? imageURLs[0] ?? asset.imageURL;
  const hasMultipleImages = imageURLs.length > 1;

  const showPreviousImage = () => {
    setSelectedImageIndex((current) => (current - 1 + imageURLs.length) % imageURLs.length);
  };

  const showNextImage = () => {
    setSelectedImageIndex((current) => (current + 1) % imageURLs.length);
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader
        title="资产详情"
        leading={<AssetBreadcrumb items={[{ label: "资产库", to: "/admin/asset" }, { label: asset.id }]} />}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col px-6 pb-12 pt-10">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <h1 className="truncate text-[30px] font-semibold leading-tight tracking-[-0.04em]">
                {displayName}
              </h1>
              <Badge variant="secondary" className="shrink-0 rounded-md">
                {asset.id}
              </Badge>
              <Badge className={getAssetChainStatusClassName(asset.chainStatus)}>
                {getAssetChainStatusLabel(asset.chainStatus)}
              </Badge>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button size="icon" variant="ghost" className="size-8 text-muted-foreground" asChild>
              <Link to={`/asset/${asset.id}`} target="_blank" rel="noreferrer" aria-label="打开前台资产详情">
                <ExternalLink className="size-4" />
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to={`/admin/asset/${asset.id}/edit`}>
                {asset.chainStatus === "confirmed" ? (
                  <LockKeyhole data-icon="inline-start" />
                ) : (
                  <Pencil data-icon="inline-start" />
                )}
                {asset.chainStatus === "confirmed" ? "查看锁定资料" : "编辑"}
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="h-11 w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="product" className={ASSET_DETAIL_TAB_TRIGGER_CLASS}>
              产品信息
            </TabsTrigger>
            <TabsTrigger value="materials" className={ASSET_DETAIL_TAB_TRIGGER_CLASS}>
              资料证书
            </TabsTrigger>
            <TabsTrigger value="orders" className={ASSET_DETAIL_TAB_TRIGGER_CLASS}>
              链上订单
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product" className="mt-8 grid gap-8">
            <section className="grid gap-10 lg:grid-cols-[1fr_0.95fr]">
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
                        className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center border border-white/80 bg-white/90 text-sky-950 shadow-sm transition hover:bg-white"
                        onClick={showPreviousImage}
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="下一张产品图片"
                        className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center border border-white/80 bg-white/90 text-sky-950 shadow-sm transition hover:bg-white"
                        onClick={showNextImage}
                      >
                        <ChevronRight className="size-5" />
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
                      const isCertificate = asset.certificateURLs.includes(imageURL);

                      return (
                        <button
                          type="button"
                          key={`${imageURL}-${index}`}
                          className={`relative overflow-hidden border bg-sky-50 transition ${
                            index === selectedImageIndex
                              ? "border-sky-500"
                              : "border-sky-100 hover:border-sky-300"
                          }`}
                          onClick={() => setSelectedImageIndex(index)}
                          aria-label={`查看第 ${index + 1} 张资产图片`}
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
                  <Badge variant="outline" className="rounded-none px-3 py-1">
                    {asset.categoryLabel}
                  </Badge>
                  <span
                    className={`border px-3 py-1 text-sm font-semibold ${getRwaSellerCategoryClassName(
                      asset.sellerCategoryLabel,
                    )}`}
                  >
                    {asset.sellerCategoryLabel}
                  </span>
                  {asset.certificateURLs.length > 0 ? (
                    <span className="inline-flex items-center gap-1 border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                      <BadgeCheck className="size-4" />
                      含证书影像
                    </span>
                  ) : null}
                </div>
                <div className="mt-5 text-sm font-semibold text-sky-700">{asset.id}</div>
                <h1 className="mt-2 text-4xl font-semibold leading-tight text-sky-950 sm:text-5xl">
                  {displayName}
                </h1>
                <p className="mt-5 leading-8 text-sky-900/70">
                  该资产来自 PHENIX 产品目录，已整理产品影像、规格、会员价与文件包 hash。
                  页面用于资产库展示、会员配置沟通和后续托管确权材料索引。
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <MetricCard label="会员价" value={formatProductAssetPrice(asset.priceCny)} />
                  <MetricCard label="PHENIX 价格" value={asset.pricePhenix || "待补充"} />
                  <MetricCard label="资产编号" value={asset.id} />
                  <MetricCard label="链上状态" value={getAssetChainStatusLabel(asset.chainStatus)} />
                  <MetricCard icon={PackageCheck} label="规格" value={asset.spec || "待补充"} />
                  <MetricCard icon={Ruler} label="尺寸" value={asset.size || "待补充"} />
                </div>

                <div className="mt-6 border border-sky-100 bg-white/80 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm text-sky-900/60">资产文件包 hash</div>
                      <div className="mt-2 break-all font-mono text-sm text-sky-950">
                        {asset.fileHash}
                      </div>
                    </div>
                    {asset.packageURL ? (
                      <Button asChild variant="outline" size="sm">
                        <a href={asset.packageURL} target="_blank" rel="noreferrer">
                          <FileArchive className="size-4" />
                          下载 ZIP
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <TrustRecordGrid />

            <section className="grid gap-8 border border-sky-100 bg-white/70 p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                  Product Record
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-sky-950">产品目录记录</h2>
                <p className="mt-5 leading-8 text-sky-900/70">
                  产品目录记录用于展示真实资产信息，并与后续线上确权、第三方托管、保险及流通资料建立索引关系。
                </p>
              </div>
              <ProductRecordTable asset={asset} displayName={displayName} />
            </section>
          </TabsContent>

          <TabsContent value="materials" className="mt-5">
            <MaterialsPanel asset={asset} displayName={displayName} />
          </TabsContent>

          <TabsContent value="orders" className="mt-5">
            <ChainOrdersPanel asset={asset} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof PackageCheck;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-sky-100 bg-white/80 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-sky-900/60">
        {Icon ? <Icon className="size-4 text-sky-700" /> : null}
        {label}
      </div>
      <div className="mt-2 break-all text-2xl font-semibold text-sky-950">{value}</div>
    </div>
  );
}

function TrustRecordGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {trustRecords.map((item) => (
        <article
          key={item.title}
          className="border border-sky-100 bg-white/80 p-5 shadow-sm"
        >
          <item.icon className="size-5 text-sky-700" />
          <h2 className="mt-4 font-semibold text-sky-950">{item.title}</h2>
          <p className="mt-3 text-sm leading-6 text-sky-900/70">{item.text}</p>
        </article>
      ))}
    </section>
  );
}

function ProductRecordTable({
  asset,
  displayName,
}: {
  asset: ProductAsset;
  displayName: string;
}) {
  return (
    <div className="divide-y divide-sky-100 border border-sky-100 bg-white/80 shadow-sm">
      <RecordRow label="资产名称" value={displayName} />
      <RecordRow label="文件包 hash" value={asset.fileHash} mono />
      <RecordRow label="文件包大小" value={asset.packageSize ? formatPackageSize(asset.packageSize) : "未生成"} />
      <RecordRow label="接收地址" value={asset.recipient || "未填写"} mono />
      <RecordRow label="PHENIX 价格" value={asset.pricePhenix || "未填写"} />
      <RecordRow label="链上 Token" value={asset.chainTokenId || "未上链"} mono />
      <RecordRow
        label="证书影像"
        value={asset.certificateURLs.length > 0 ? `${asset.certificateURLs.length} 张` : "暂无"}
      />
      <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
        <div className="text-sm text-sky-900/60">卖家类别</div>
        <div>
          <span
            className={`inline-flex border px-3 py-1 text-sm font-semibold ${getRwaSellerCategoryClassName(
              asset.sellerCategoryLabel,
            )}`}
          >
            {asset.sellerCategoryLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

function RecordRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-2 p-5 sm:grid-cols-[160px_1fr]">
      <div className="text-sm text-sky-900/60">{label}</div>
      <div className={mono ? "break-all font-mono text-sm text-sky-950" : "font-semibold text-sky-950"}>
        {value}
      </div>
    </div>
  );
}

function MaterialsPanel({
  asset,
  displayName,
}: {
  asset: ProductAsset;
  displayName: string;
}) {
  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="size-5" />
            文件包
          </CardTitle>
          <CardDescription>产品图片、证书图片和 manifest 自动打包后的 ZIP 文件。</CardDescription>
        </CardHeader>
        <CardContent>
          {asset.packageURL ? (
            <div className="grid gap-4 rounded-lg border bg-white/70 p-4">
              <div>
                <div className="text-sm text-muted-foreground">SHA-256 Hash</div>
                <div className="mt-2 break-all font-mono text-sm">{asset.fileHash}</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{formatPackageSize(asset.packageSize)}</Badge>
                <Button asChild variant="outline" size="sm">
                  <a href={asset.packageURL} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    下载 ZIP
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              暂未生成文件包。
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>产品图片</CardTitle>
          <CardDescription>第一张图片作为资产封面，后续图片用于多角度展示。</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageGrid urls={asset.imageURLs} title={displayName} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>证书 / 确权资料</CardTitle>
          <CardDescription>用于展示证书、确权资料和托管文件截图。</CardDescription>
        </CardHeader>
        <CardContent>
          {asset.certificateURLs.length > 0 ? (
            <ImageGrid urls={asset.certificateURLs} title={`${displayName} 证书`} />
          ) : (
            <div className="rounded-lg border border-dashed bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              暂无证书影像。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChainOrdersPanel({ asset }: { asset: ProductAsset }) {
  const rows = useMemo(
    () => [
      { label: "资产编号", value: asset.id },
      { label: "链上状态", value: getAssetChainStatusLabel(asset.chainStatus) },
      { label: "Token ID", value: asset.chainTokenId || "未上链" },
      { label: "接收地址", value: asset.recipient || "未填写" },
      { label: "PHENIX 价格", value: asset.pricePhenix || "未填写" },
      {
        label: "交易 Hash",
        value: asset.chainTxHash ? (
          <a
            className="inline-flex items-center gap-1 break-all font-mono text-sky-700 hover:underline"
            href={`${BASESCAN_TX_BASE}${asset.chainTxHash}`}
            target="_blank"
            rel="noreferrer"
          >
            {asset.chainTxHash}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        ) : (
          "未提交"
        ),
      },
      { label: "Token URI", value: asset.tokenURI || "未生成" },
      { label: "结算状态", value: "等待订单索引服务接入后展示" },
    ],
    [
      asset.chainStatus,
      asset.chainTokenId,
      asset.chainTxHash,
      asset.id,
      asset.pricePhenix,
      asset.recipient,
      asset.tokenURI,
    ],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptText className="size-5" />
          链上订单
        </CardTitle>
        <CardDescription>
          后续可在这里聚合链上订单、支付记录、持有人变更和结算状态。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid gap-1 rounded-lg border bg-white/70 p-4 sm:grid-cols-[160px_1fr]"
          >
            <div className="text-sm text-muted-foreground">{row.label}</div>
            <div className="break-all font-medium">{row.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ImageGrid({ urls, title }: { urls: string[]; title: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {urls.map((url, index) => (
        <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border bg-sky-50">
          <img src={url} alt={`${title} ${index + 1}`} className="aspect-square w-full object-cover" />
          <div className="absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold shadow-sm">
            {index === 0 ? "封面" : index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
