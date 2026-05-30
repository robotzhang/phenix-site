import { useEffect, useMemo, useState } from "react";
import { Link, useParams, type LoaderFunctionArgs } from "react-router";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileArchive,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  PackageCheck,
  Pencil,
  ReceiptText,
  Ruler,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  decodeEventLog,
  isAddress,
  parseUnits,
  type Address,
} from "viem";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
} from "wagmi";

import rwaAbi from "@/abi/rwa.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConnectButton from "@/components/wallet/ConnectButton";
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
  getProductAssetStorageKey,
  type ProductAsset,
} from "@/data/product-assets";
import { useSafeContractWrite } from "@/hooks/useSafeContractWrite";
import { PHENIX_DECIMALS } from "@/lib/constants";
import { getRwaSellerCategoryClassName } from "@/lib/rwa";
import { createAndUploadRwaAssetPackage } from "@/lib/rwa-asset-package";
import {
  RWA_CHAIN,
  RWA_CONTRACT_ADDRESS,
  RWA_EXPLORER_TX_BASE,
} from "@/lib/rwa-chain-config";
import {
  refreshRwaAdminMetadataMap,
  saveRwaAdminMetadata,
  uploadRwaAdminImage,
  useRwaAdminMetadataMap,
} from "@/lib/rwa-admin-storage";
import type { RwaAdminMetadataInput } from "@/lib/rwa-admin-storage.shared";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import {
  AssetBreadcrumb,
  AssetHeader,
  MAX_CATALOG_IMAGES,
  MAX_CERTIFICATE_IMAGES,
  ProductAssetImageUploader,
  compressProductImage,
  createProductAssetFormFromAsset,
  normalizeError,
  normalizeImageURLList,
  type ProductAssetFormState,
} from "./asset/shared";
import { OffchainAssetEditor } from "./asset/offchain-editor";

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
const PACKAGE_HASH_PATTERN = /^[a-f0-9]{64}$/i;

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

function normalizeDecimalInput(value: string) {
  return value.trim().replace(/[,\s]/g, "");
}

function parsePositivePhenixAmount(value: string) {
  const normalized = normalizeDecimalInput(value);

  if (!normalized) return 0n;

  try {
    const parsed = parseUnits(normalized, PHENIX_DECIMALS);
    return parsed > 0n ? parsed : 0n;
  } catch {
    return 0n;
  }
}

function isAssetPackageReady(asset: ProductAsset) {
  const fileHash = asset.fileHash.trim();
  const packageKey = asset.packageKey?.trim() ?? "";

  return (
    PACKAGE_HASH_PATTERN.test(fileHash) &&
    Boolean(asset.packageURL?.trim()) &&
    Boolean(packageKey) &&
    packageKey.toLowerCase().includes(fileHash.toLowerCase())
  );
}

function isFormPackageReady(form: ProductAssetFormState) {
  const fileHash = form.fileHash.trim();
  const packageKey = form.packageKey.trim();

  return (
    PACKAGE_HASH_PATTERN.test(fileHash) &&
    Boolean(form.packageURL.trim()) &&
    Boolean(packageKey) &&
    packageKey.toLowerCase().includes(fileHash.toLowerCase())
  );
}

function invalidateFormPackage(form: ProductAssetFormState): ProductAssetFormState {
  if (form.chainStatus === "confirmed" && form.chainTokenId) {
    return form;
  }

  return {
    ...form,
    fileHash: "",
    packageURL: "",
    packageKey: "",
    packageSize: "",
    chainStatus: "draft",
  };
}

function buildProductMetadata(
  asset: ProductAsset,
  displayName: string,
  overrides: Partial<RwaAdminMetadataInput> = {},
): RwaAdminMetadataInput {
  return {
    assetKind: "product",
    assetCode: asset.id,
    name: displayName,
    categoryLabel: asset.categoryLabel,
    sellerCategoryLabel: asset.sellerCategoryLabel,
    spec: asset.spec,
    size: asset.size,
    priceCny: String(asset.priceCny || ""),
    recipient: asset.recipient,
    pricePhenix: asset.pricePhenix,
    fileHash: asset.fileHash,
    imageURL: asset.imageURLs[0] ?? asset.imageURL,
    imageURLs: asset.imageURLs,
    certificateURLs: asset.certificateURLs,
    packageURL: asset.packageURL,
    packageKey: asset.packageKey,
    packageSize: asset.packageSize,
    chainStatus: asset.chainStatus ?? "draft",
    chainTokenId: asset.chainTokenId,
    chainTxHash: asset.chainTxHash,
    chainConfirmedAt: asset.chainConfirmedAt,
    tokenURI: asset.tokenURI,
    ...overrides,
  };
}

function extractRwaCreatedTokenId(receipt: { logs?: unknown[] } | undefined) {
  for (const log of receipt?.logs ?? []) {
    try {
      const decoded = decodeEventLog({
        abi: rwaAbi,
        data: (log as { data: `0x${string}` }).data,
        topics: (log as { topics: [`0x${string}`, ...`0x${string}`[]] }).topics,
      });

      if (decoded.eventName === "RWACreated") {
        const args = decoded.args as { tokenId?: bigint };
        return args.tokenId?.toString() ?? "";
      }
    } catch {
      // Ignore logs from other contracts in the same transaction.
    }
  }

  return "";
}

function readOnchainAssetSnapshot(value: unknown) {
  const asset =
    value && typeof value === "object" && "asset" in value
      ? (value as { asset?: unknown }).asset
      : undefined;

  if (!asset || typeof asset !== "object") {
    return null;
  }

  const snapshot = asset as {
    name?: unknown;
    pricePhenix?: unknown;
    fileHash?: unknown;
  };

  return {
    name: String(snapshot.name ?? ""),
    pricePhenix:
      typeof snapshot.pricePhenix === "bigint"
        ? snapshot.pricePhenix
        : BigInt(String(snapshot.pricePhenix ?? "0")),
    fileHash: String(snapshot.fileHash ?? ""),
  };
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
  const [offchainModalOpen, setOffchainModalOpen] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(0);
    setActiveTab("product");
    setOffchainModalOpen(false);
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
            <Button type="button" size="sm" onClick={() => setOffchainModalOpen(true)}>
              {asset.chainStatus === "confirmed" ? (
                <LockKeyhole data-icon="inline-start" />
              ) : (
                <Pencil data-icon="inline-start" />
              )}
              维护链下资料
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="h-11 w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="product" className={ASSET_DETAIL_TAB_TRIGGER_CLASS}>
              产品信息
            </TabsTrigger>
            <TabsTrigger value="chain" className={ASSET_DETAIL_TAB_TRIGGER_CLASS}>
              链上
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

          <TabsContent value="chain" className="mt-5">
            <ChainPanel asset={asset} displayName={displayName} />
          </TabsContent>

          <TabsContent value="orders" className="mt-5">
            <ChainOrdersPanel asset={asset} />
          </TabsContent>
        </Tabs>
      </main>

      {offchainModalOpen ? (
        <OffchainAssetEditor
          assetId={asset.id}
          mode="modal"
          onClose={() => setOffchainModalOpen(false)}
          onSaved={() => setOffchainModalOpen(false)}
        />
      ) : null}
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

function ChainPanel({
  asset,
  displayName,
}: {
  asset: ProductAsset;
  displayName: string;
}) {
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const isConfirmed = asset.chainStatus === "confirmed" && Boolean(asset.chainTokenId);

  return (
    <div className="grid gap-5">
      <ChainInfoPanel
        asset={asset}
        displayName={displayName}
        onEdit={() => setDraftModalOpen(true)}
      />
      <MaterialsPanel asset={asset} displayName={displayName} />
      {!isConfirmed ? (
        <ChainDraftEditorModal
          asset={asset}
          displayName={displayName}
          open={draftModalOpen}
          onClose={() => setDraftModalOpen(false)}
        />
      ) : null}
    </div>
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

function ChainDraftEditorModal({
  asset,
  displayName,
  open,
  onClose,
}: {
  asset: ProductAsset;
  displayName: string;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden border bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <div className="text-lg font-semibold text-sky-950">填写链上信息</div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="关闭弹窗">
            <X className="size-5" />
          </Button>
        </div>
        <ChainDraftEditorPanel
          asset={asset}
          displayName={displayName}
          onSaved={onClose}
        />
      </div>
    </div>
  );
}

function ChainDraftEditorPanel({
  asset,
  onSaved,
}: {
  asset: ProductAsset;
  displayName: string;
  onSaved?: () => void;
}) {
  const [form, setForm] = useState<ProductAssetFormState>(() =>
    createProductAssetFormFromAsset(asset),
  );
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [uploadingCertificateImages, setUploadingCertificateImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const packageReady = isFormPackageReady(form);

  useEffect(() => {
    setForm(createProductAssetFormFromAsset(asset));
  }, [asset]);

  const handleUploadImages = async (
    files: FileList | null,
    target: "product" | "certificate",
  ) => {
    if (!files?.length) return;

    const currentURLs = target === "product" ? form.imageURLs : form.certificateURLs;
    const maxImages = target === "product" ? MAX_CATALOG_IMAGES : MAX_CERTIFICATE_IMAGES;
    const remaining = maxImages - currentURLs.length;

    if (remaining <= 0) {
      toast.error(`最多上传 ${maxImages} 张图片`);
      return;
    }

    try {
      if (target === "product") {
        setUploadingProductImages(true);
      } else {
        setUploadingCertificateImages(true);
      }

      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, remaining)) {
        const compressed = await compressProductImage(file);
        uploaded.push(await uploadRwaAdminImage(compressed, target));
      }

      setForm((current) => {
        const key = target === "product" ? "imageURLs" : "certificateURLs";
        const nextURLs = normalizeImageURLList([...current[key], ...uploaded], maxImages);
        return invalidateFormPackage({
          ...current,
          [key]: nextURLs,
        });
      });
      toast.success(`已上传 ${uploaded.length} 张${target === "product" ? "产品图片" : "证书图片"}`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setUploadingProductImages(false);
      setUploadingCertificateImages(false);
    }
  };

  const removeImageURL = (imageURL: string, target: "product" | "certificate") => {
    setForm((current) => {
      const key = target === "product" ? "imageURLs" : "certificateURLs";
      return invalidateFormPackage({
        ...current,
        [key]: current[key].filter((item) => item !== imageURL),
      });
    });
  };

  const setCoverImage = (imageURL: string) => {
    setForm((current) =>
      invalidateFormPackage({
        ...current,
        imageURLs: [
          imageURL,
          ...current.imageURLs.filter((item) => item !== imageURL),
        ],
      }),
    );
  };

  const generatePackageForForm = async (sourceForm = form) => {
    const imageURLs = normalizeImageURLList(sourceForm.imageURLs, MAX_CATALOG_IMAGES);
    const certificateURLs = normalizeImageURLList(
      sourceForm.certificateURLs,
      MAX_CERTIFICATE_IMAGES,
    );

    if (imageURLs.length < 1) {
      throw new Error("请至少上传 1 张产品图片");
    }

    setPackaging(true);

    try {
      const result = await createAndUploadRwaAssetPackage({
        assetCode: asset.id,
        imageURLs,
        certificateURLs,
      });
      const nextForm: ProductAssetFormState = {
        ...sourceForm,
        fileHash: result.packageHash,
        packageURL: result.packageURL,
        packageKey: result.packageKey,
        packageSize: result.packageSize,
        chainStatus: "draft",
      };

      setForm((current) => ({
        ...current,
        fileHash: nextForm.fileHash,
        packageURL: nextForm.packageURL,
        packageKey: nextForm.packageKey,
        packageSize: nextForm.packageSize,
        chainStatus: nextForm.chainStatus,
      }));

      return nextForm;
    } finally {
      setPackaging(false);
    }
  };

  const handleSaveDraft = async () => {
    const name = form.name.trim();
    const recipient = form.recipient.trim();
    const pricePhenix = normalizeDecimalInput(form.pricePhenix);

    if (!name) {
      toast.error("请输入资产名称");
      return;
    }

    if (recipient && !isAddress(recipient)) {
      toast.error("请输入有效的接收钱包地址");
      return;
    }

    if (pricePhenix && parsePositivePhenixAmount(pricePhenix) <= 0n) {
      toast.error("请输入正确的 PHENIX 价格");
      return;
    }

    let workingForm = form;

    try {
      if (!isFormPackageReady(workingForm)) {
        workingForm = await generatePackageForForm(workingForm);
      }

      setSaving(true);
      const imageURLs = normalizeImageURLList(workingForm.imageURLs, MAX_CATALOG_IMAGES);
      const certificateURLs = normalizeImageURLList(
        workingForm.certificateURLs,
        MAX_CERTIFICATE_IMAGES,
      );
      const workingAsset: ProductAsset = {
        ...asset,
        name: `${asset.id} ${name}`,
        recipient: recipient || undefined,
        pricePhenix: pricePhenix || undefined,
        fileHash: workingForm.fileHash.trim(),
        imageURL: imageURLs[0] ?? asset.imageURL,
        imageURLs,
        certificateURLs,
        packageURL: workingForm.packageURL.trim() || undefined,
        packageKey: workingForm.packageKey.trim() || undefined,
        packageSize: workingForm.packageSize.trim() || undefined,
        chainStatus: "draft",
        chainTokenId: undefined,
        chainTxHash: undefined,
        chainConfirmedAt: undefined,
        tokenURI: undefined,
      };

      await saveRwaAdminMetadata(
        getProductAssetStorageKey(asset.id),
        buildProductMetadata(workingAsset, name, {
          pricePhenix: pricePhenix || undefined,
          chainStatus: "draft",
        }),
      );
      await refreshRwaAdminMetadataMap();
      toast.success("链上资料已保存");
      onSaved?.();
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setSaving(false);
    }
  };

  const disabled = saving || packaging || uploadingProductImages || uploadingCertificateImages;

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6 text-sm leading-6 text-sky-900/70">
          未上链前可直接维护写入合约和 ZIP 的资料：名称、接收地址、PHENIX 价格、图片、证书和文件包。
        </div>
        <div className="grid gap-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <label className="grid gap-2">
              <span className="text-sm font-medium">资产名称</span>
              <Input
                value={form.name}
                disabled={disabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="链上 RWA 名称"
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">PHENIX 价格</span>
              <Input
                inputMode="decimal"
                value={form.pricePhenix}
                disabled={disabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pricePhenix: event.target.value,
                  }))
                }
                placeholder="例如：1200"
              />
            </label>
            <label className="grid gap-2 lg:col-span-2">
              <span className="text-sm font-medium">接收钱包地址</span>
              <Input
                value={form.recipient}
                disabled={disabled}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    recipient: event.target.value,
                  }))
                }
                placeholder="0x..."
              />
            </label>
          </div>

          <ProductAssetImageUploader
            title="产品图片"
            description="第一张只作为链上 metadata 封面；所有产品图片都会和证书、manifest 一起参与 ZIP hash。"
            imageURLs={form.imageURLs}
            maxImages={MAX_CATALOG_IMAGES}
            uploading={uploadingProductImages}
            disabled={disabled}
            onUpload={(files) => void handleUploadImages(files, "product")}
            onRemove={(imageURL) => removeImageURL(imageURL, "product")}
            onCover={setCoverImage}
          />

          <ProductAssetImageUploader
            title="证书 / 确权资料"
            description="证书和确权资料并入链上 ZIP 文件包，资产上链后锁定。"
            imageURLs={form.certificateURLs}
            maxImages={MAX_CERTIFICATE_IMAGES}
            uploading={uploadingCertificateImages}
            disabled={disabled}
            onUpload={(files) => void handleUploadImages(files, "certificate")}
            onRemove={(imageURL) => removeImageURL(imageURL, "certificate")}
          />

          <ChainDraftPackagePanel form={form} ready={packageReady} />
        </div>
      </div>
      <div className="shrink-0 border-t bg-white px-6 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm leading-6 text-sky-900/60">
            保存链上资料时会自动确保 ZIP 已生成；图片或证书变化后会重新打包。
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" onClick={() => void handleSaveDraft()} disabled={disabled}>
              {saving || packaging ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <BadgeCheck className="size-4" />
              )}
              保存链上资料
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function ChainDraftPackagePanel({
  form,
  ready,
}: {
  form: ProductAssetFormState;
  ready: boolean;
}) {
  const fileCount = form.imageURLs.length + form.certificateURLs.length;

  return (
    <div className="grid gap-4 border border-sky-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
            <FileArchive className="size-4 text-sky-700" />
            链上文件包
          </div>
          <p className="mt-2 text-sm leading-6 text-sky-900/60">
            产品图片、证书和 manifest 会打包成 ZIP，ZIP 内容 SHA-256 会作为合约 fileHash。
          </p>
        </div>
        <Badge className={ready ? "bg-emerald-600" : "bg-neutral-950"}>
          {ready ? "已生成" : "待生成"}
        </Badge>
      </div>

      {ready ? (
        <div className="grid gap-2 border border-sky-100 bg-sky-50/60 p-4 text-sm">
          <div className="text-sky-900/60">文件包 hash</div>
          <div className="break-all font-mono text-sky-950">{form.fileHash}</div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="secondary">{formatPackageSize(form.packageSize)}</Badge>
            <Button asChild variant="outline" size="sm">
              <a href={form.packageURL} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                下载 ZIP
              </a>
            </Button>
            <span className="text-xs text-sky-900/50">{form.packageKey}</span>
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-sky-200 bg-sky-50/60 p-4 text-sm leading-6 text-sky-900/60">
          当前会打包 {fileCount} 个文件。保存链上资料时会自动生成文件包。
        </div>
      )}
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

function ChainInfoPanel({
  asset,
  displayName,
  onEdit,
}: {
  asset: ProductAsset;
  displayName: string;
  onEdit: () => void;
}) {
  const [packaging, setPackaging] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: RWA_CHAIN.id });
  const { write } = useSafeContractWrite();
  const isConfirmed = asset.chainStatus === "confirmed" && Boolean(asset.chainTokenId);
  const packageReady = isAssetPackageReady(asset);
  const walletConnecting = isConnecting || isReconnecting;
  const ownerRead = useReadContract({
    address: RWA_CONTRACT_ADDRESS,
    abi: rwaAbi,
    chainId: RWA_CHAIN.id,
    functionName: "owner",
    query: { enabled: !isConfirmed },
  });
  const issuerRead = useReadContract({
    address: RWA_CONTRACT_ADDRESS,
    abi: rwaAbi,
    chainId: RWA_CHAIN.id,
    functionName: "authorizedIssuer",
    args: address ? [address] : undefined,
    query: { enabled: !isConfirmed && Boolean(address) },
  });
  const chainPermissionLoading = Boolean(
    ownerRead.isLoading ||
      issuerRead.isLoading ||
      ownerRead.isFetching ||
      issuerRead.isFetching,
  );
  const isIssuerWallet = Boolean(
    address &&
      ((typeof ownerRead.data === "string" &&
        ownerRead.data.toLowerCase() === address.toLowerCase()) ||
        issuerRead.data === true),
  );
  const issueBlockReason = useMemo(() => {
    if (isConfirmed) return "";
    if (asset.imageURLs.length < 1) return "请先在本页上传产品图片";
    if (walletConnecting) return "正在恢复钱包连接";
    if (!isConnected || !address) return "请先连接交易钱包";
    if (chainId !== RWA_CHAIN.id) return `请切换到 ${RWA_CHAIN.name} 网络`;
    if (chainPermissionLoading) return "正在检查发行权限";
    if (!isIssuerWallet) return "当前钱包不是 RWA 合约 owner 或授权 issuer";
    if (!isAddress(asset.recipient?.trim() ?? "")) {
      return "请先在本页填写并保存有效的接收钱包地址";
    }
    if (parsePositivePhenixAmount(asset.pricePhenix ?? "") <= 0n) {
      return "请先在本页填写并保存正确的 PHENIX 价格";
    }
    if (!publicClient) return "链上客户端未就绪";
    return "";
  }, [
    address,
    asset.imageURLs.length,
    asset.pricePhenix,
    asset.recipient,
    chainId,
    chainPermissionLoading,
    isConnected,
    isConfirmed,
    isIssuerWallet,
    publicClient,
    walletConnecting,
  ]);

  const handleCreateOnChain = async () => {
    if (isConfirmed) return;

    if (issueBlockReason) {
      toast.error(issueBlockReason);
      return;
    }

    if (!address || !publicClient) {
      toast.error("链上客户端未就绪");
      return;
    }

    let workingAsset = asset;
    let createdTokenId = "";

    try {
      if (!packageReady) {
        setPackaging(true);
        const result = await createAndUploadRwaAssetPackage({
          assetCode: asset.id,
          imageURLs: asset.imageURLs,
          certificateURLs: asset.certificateURLs,
        });
        workingAsset = {
          ...asset,
          fileHash: result.packageHash,
          packageURL: result.packageURL,
          packageKey: result.packageKey,
          packageSize: result.packageSize,
          chainStatus: "draft",
        };
      }

      const recipient = workingAsset.recipient?.trim() ?? "";
      const pricePhenix = normalizeDecimalInput(workingAsset.pricePhenix ?? "");
      const pricePhenixRaw = parsePositivePhenixAmount(pricePhenix);

      if (!isAddress(recipient)) {
        throw new Error("请先在本页填写并保存有效的接收钱包地址");
      }

      if (pricePhenixRaw <= 0n) {
        throw new Error("请先在本页填写并保存正确的 PHENIX 价格");
      }

      setIssuing(true);
      const pendingMetadata = buildProductMetadata(workingAsset, displayName, {
        pricePhenix,
        chainStatus: "pending",
        chainTokenId: undefined,
        chainTxHash: undefined,
        chainConfirmedAt: undefined,
        tokenURI: undefined,
      });

      await saveRwaAdminMetadata(getProductAssetStorageKey(workingAsset.id), pendingMetadata);

      const simulation = await publicClient.simulateContract({
        address: RWA_CONTRACT_ADDRESS,
        abi: rwaAbi,
        functionName: "createRWA",
        args: [
          recipient as Address,
          displayName,
          pricePhenixRaw,
          workingAsset.fileHash,
        ],
        account: address,
      });
      const receipt = await write(simulation.request);

      if (!receipt) {
        throw new Error("交易未提交");
      }

      const tokenId = extractRwaCreatedTokenId(receipt);

      if (!tokenId) {
        throw new Error("交易已确认，但未解析到 tokenId");
      }

      createdTokenId = tokenId;
      const chainTxHash = String(receipt.transactionHash || "");
      const onchainView = await publicClient.readContract({
        address: RWA_CONTRACT_ADDRESS,
        abi: rwaAbi,
        functionName: "getRWA",
        args: [BigInt(tokenId)],
      });
      const onchainAsset = readOnchainAssetSnapshot(onchainView);

      if (
        !onchainAsset ||
        onchainAsset.name !== displayName ||
        onchainAsset.pricePhenix !== pricePhenixRaw ||
        onchainAsset.fileHash !== workingAsset.fileHash
      ) {
        throw new Error("链上资产数据和后台草稿不一致，已停止锁定数据库记录");
      }

      const tokenURI = await publicClient
        .readContract({
          address: RWA_CONTRACT_ADDRESS,
          abi: rwaAbi,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        })
        .then((value) => String(value || ""))
        .catch(() => `/asset/metadata?id=${tokenId}&hash=${workingAsset.fileHash}`);
      const confirmedAt = new Date().toISOString();
      const confirmedMetadata = buildProductMetadata(workingAsset, displayName, {
        pricePhenix,
        chainStatus: "confirmed",
        chainTokenId: tokenId,
        chainTxHash,
        chainConfirmedAt: confirmedAt,
        tokenURI,
        status: 0,
      });

      await saveRwaAdminMetadata(getProductAssetStorageKey(workingAsset.id), confirmedMetadata);
      await saveRwaAdminMetadata(tokenId, {
        ...confirmedMetadata,
        assetKind: "chain",
      });
      await refreshRwaAdminMetadataMap();
      toast.success(`资产已上链，Token ID ${tokenId}`);
    } catch (error) {
      if (!createdTokenId) {
        try {
          await saveRwaAdminMetadata(getProductAssetStorageKey(workingAsset.id), {
            ...buildProductMetadata(workingAsset, displayName),
            chainStatus: "failed",
          });
          await refreshRwaAdminMetadataMap();
        } catch {
          // Keep the original chain error visible to the admin.
        }
      }

      toast.error(normalizeError(error));
    } finally {
      setPackaging(false);
      setIssuing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="size-5 text-sky-700" />
            链上信息
          </CardTitle>
        </div>
        {!isConfirmed ? (
          <Button type="button" onClick={onEdit}>
            <Pencil className="size-4" />
            填写链上信息
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <ChainInfoRow label="资产名称" value={displayName || "待填写"} />
          <ChainInfoRow label="接收地址" value={asset.recipient || "待填写"} mono={Boolean(asset.recipient)} />
          <ChainInfoRow label="PHENIX 价格" value={asset.pricePhenix || "待填写"} />
          <ChainInfoRow
            label="文件包"
            value={
              packageReady ? (
                <div className="grid gap-2">
                  <div className="inline-flex flex-wrap items-center gap-2">
                    <span>已生成</span>
                    <Badge variant="secondary">{formatPackageSize(asset.packageSize)}</Badge>
                    <Button asChild variant="outline" size="sm">
                      <a href={asset.packageURL} target="_blank" rel="noreferrer">
                        <ExternalLink className="size-4" />
                        下载 ZIP
                      </a>
                    </Button>
                  </div>
                  <div className="break-all font-mono text-sm text-sky-950">
                    {asset.fileHash}
                  </div>
                </div>
              ) : (
                "提交时自动生成"
              )
            }
          />
          <ChainInfoRow label="图片 / 证书" value={`${asset.imageURLs.length} 张图片 / ${asset.certificateURLs.length} 张证书`} />
        </div>

        <div className="grid gap-3 border-t border-sky-100 pt-4 text-sm sm:grid-cols-2">
          {!isConfirmed ? (
            <>
              <ChainInfoRow
                label="交易钱包"
                value={
                  address ? (
                    address
                  ) : walletConnecting ? (
                    <span className="inline-flex items-center gap-2 text-sky-900/70">
                      <LoaderCircle className="size-3.5 animate-spin" />
                      正在恢复钱包连接
                    </span>
                  ) : (
                    <ConnectButton connectLabel="连接交易钱包" connectedTo={null} />
                  )
                }
                mono={Boolean(address)}
              />
              <ChainInfoRow label="钱包权限" value={isIssuerWallet ? "可提交上链" : "未确认"} />
            </>
          ) : null}
          <ChainInfoRow label="Token ID" value={asset.chainTokenId || "未上链"} mono />
          <ChainInfoRow
            label="上链交易"
            value={
              asset.chainTxHash ? (
                <a
                  className="inline-flex items-center gap-1 break-all font-mono text-sky-700 hover:underline"
                  href={`${RWA_EXPLORER_TX_BASE}${asset.chainTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {asset.chainTxHash}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ) : (
                "未提交上链交易"
              )
            }
          />
          <ChainInfoRow label="Token URI" value={asset.tokenURI || "未生成"} mono />
        </div>

        {isConfirmed ? (
          <div className="border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            该资产已完成链上，链上资料已锁定。会员价、资产类别、来源标签、规格和尺寸仍可通过“维护链下资料”弹窗维护。
          </div>
        ) : issueBlockReason ? (
          <div className="border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            {issueBlockReason}
          </div>
        ) : (
          <div className="border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            当前资料可以提交链上。提交时会自动补齐文件包，交易确认后链上资料会锁定。
          </div>
        )}

        {!isConfirmed ? (
          <Button
            type="button"
            onClick={() => void handleCreateOnChain()}
            disabled={Boolean(issueBlockReason) || issuing || packaging}
          >
            {issuing || packaging ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <BadgeCheck className="size-4" />
            )}
            {packaging ? "正在生成文件包" : issuing ? "正在提交上链" : "提交上链"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChainInfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid gap-1 rounded-lg border bg-white/70 p-4 sm:grid-cols-[160px_1fr]">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={mono ? "break-all font-mono text-sm font-medium" : "break-all font-medium"}>
        {value}
      </div>
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
            href={`${RWA_EXPLORER_TX_BASE}${asset.chainTxHash}`}
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
