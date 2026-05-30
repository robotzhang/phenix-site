import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router";
import {
  BadgeCheck,
  ExternalLink,
  FileArchive,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { base } from "viem/chains";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMergedProductAssetById,
  getProductAssetStorageKey,
  normalizeProductAssetCode,
} from "@/data/product-assets";
import { useSafeContractWrite } from "@/hooks/useSafeContractWrite";
import { createAndUploadRwaAssetPackage } from "@/lib/rwa-asset-package";
import {
  refreshRwaAdminMetadataMap,
  saveRwaAdminMetadata,
  uploadRwaAdminImage,
  useRwaAdminMetadataMap,
} from "@/lib/rwa-admin-storage";
import { PHENIX_DECIMALS, RWA_ADDRESS } from "@/lib/constants";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import type { RwaAdminMetadataInput } from "@/lib/rwa-admin-storage.shared";
import {
  AssetBreadcrumb,
  AssetDatalists,
  AssetHeader,
  MAX_CATALOG_IMAGES,
  MAX_CERTIFICATE_IMAGES,
  ProductAssetFields,
  ProductAssetImageUploader,
  ProductAssetPreviewCard,
  compressProductImage,
  createEmptyProductAssetForm,
  createProductAssetFormFromAsset,
  normalizeError,
  normalizeImageURLList,
  parsePositiveCurrency,
  type ProductAssetFormState,
} from "./asset/shared";

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminPage(context, request);
  return null;
}

export function meta() {
  return [
    { title: "编辑资产 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

const PACKAGE_HASH_PATTERN = /^[a-f0-9]{64}$/i;
const BASESCAN_TX_BASE = "https://basescan.org/tx/";
const RWA_CONTRACT_ADDRESS = RWA_ADDRESS as Address;

type ValidatedAssetMetadata = {
  assetCode: string;
  name: string;
  fileHash: string;
  recipient: string;
  pricePhenix: string;
  pricePhenixRaw: bigint;
  metadata: RwaAdminMetadataInput;
};

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

function isUploadedPackageReady(form: ProductAssetFormState) {
  const fileHash = form.fileHash.trim();

  return (
    PACKAGE_HASH_PATTERN.test(fileHash) &&
    Boolean(form.packageURL.trim()) &&
    Boolean(form.packageKey.trim()) &&
    form.packageKey.toLowerCase().includes(fileHash.toLowerCase())
  );
}

function invalidateGeneratedPackage(form: ProductAssetFormState): ProductAssetFormState {
  if (form.chainStatus === "confirmed") {
    return form;
  }

  return {
    ...form,
    fileHash: "",
    packageURL: "",
    packageKey: "",
    packageSize: "",
    chainStatus: "draft",
    chainTokenId: "",
    chainTxHash: "",
    chainConfirmedAt: "",
    tokenURI: "",
  };
}

function formatPackageSize(value: string) {
  const bytes = Number(value);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "未知大小";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getChainStatusLabel(status: ProductAssetFormState["chainStatus"]) {
  if (status === "confirmed") return "已上链";
  if (status === "pending") return "上链中";
  if (status === "failed") return "上链失败";
  return "草稿";
}

function getChainStatusClassName(status: ProductAssetFormState["chainStatus"]) {
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

export default function AdminAssetEdit() {
  const { assetId } = useParams();
  const navigate = useNavigate();
  const adminMetadataMap = useRwaAdminMetadataMap();
  const asset = getMergedProductAssetById(assetId, adminMetadataMap);
  const normalizedParamAssetId = normalizeProductAssetCode(assetId || "");
  const [form, setForm] = useState<ProductAssetFormState>(() =>
    asset
      ? createProductAssetFormFromAsset(asset)
      : createEmptyProductAssetForm(normalizedParamAssetId),
  );
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [uploadingCertificateImages, setUploadingCertificateImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: base.id });
  const { write } = useSafeContractWrite();
  const ownerRead = useReadContract({
    address: RWA_CONTRACT_ADDRESS,
    abi: rwaAbi,
    chainId: base.id,
    functionName: "owner",
  });
  const issuerRead = useReadContract({
    address: RWA_CONTRACT_ADDRESS,
    abi: rwaAbi,
    chainId: base.id,
    functionName: "authorizedIssuer",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const isLocked = form.chainStatus === "confirmed" && Boolean(form.chainTokenId);
  const packageReady = isUploadedPackageReady(form);
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
  const chainBlockReason = useMemo(() => {
    if (isLocked) return "资产已完成上链，资料已锁定";
    if (!packageReady && form.imageURLs.length < 1) return "请先上传产品图片";
    if (!isConnected || !address) return "请先连接钱包";
    if (chainId !== base.id) return "请切换到 Base 网络";
    if (chainPermissionLoading) return "正在检查发行权限";
    if (!isIssuerWallet) return "当前钱包不是 RWA 合约 owner 或授权 issuer";
    if (!isAddress(form.recipient.trim())) return "请输入有效的接收钱包地址";
    if (parsePositivePhenixAmount(form.pricePhenix) <= 0n) {
      return "请输入正确的 PHENIX 价格";
    }
    if (!publicClient) return "链上客户端未就绪";
    return "";
  }, [
    address,
    chainId,
    chainPermissionLoading,
    form.imageURLs.length,
    form.pricePhenix,
    form.recipient,
    isConnected,
    isIssuerWallet,
    isLocked,
    packageReady,
    publicClient,
  ]);

  useEffect(() => {
    if (asset) {
      setForm(createProductAssetFormFromAsset(asset));
    }
  }, [asset]);

  const handleUploadImages = async (
    files: FileList | null,
    target: "product" | "certificate",
  ) => {
    if (!files?.length) return;

    if (isLocked) {
      toast.error("资产已上链，图片资料已锁定");
      return;
    }

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
        uploaded.push(await uploadRwaAdminImage(compressed));
      }

      setForm((current) => {
        const nextURLs = target === "product"
          ? normalizeImageURLList([...current.imageURLs, ...uploaded], maxImages)
          : normalizeImageURLList([...current.certificateURLs, ...uploaded], maxImages);

        return invalidateGeneratedPackage({
          ...current,
          [target === "product" ? "imageURLs" : "certificateURLs"]: nextURLs,
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
    if (isLocked) return;

    setForm((current) =>
      invalidateGeneratedPackage({
        ...current,
        [target === "product" ? "imageURLs" : "certificateURLs"]: current[
          target === "product" ? "imageURLs" : "certificateURLs"
        ].filter((item) => item !== imageURL),
      }),
    );
  };

  const setCoverImage = (imageURL: string) => {
    if (isLocked) return;

    setForm((current) =>
      invalidateGeneratedPackage({
        ...current,
        imageURLs: [
          imageURL,
          ...current.imageURLs.filter((item) => item !== imageURL),
        ],
      }),
    );
  };

  const buildValidatedAssetMetadata = (
    {
      requireGeneratedPackage = true,
      requireRecipient = false,
      requirePricePhenix = false,
    }: {
      requireGeneratedPackage?: boolean;
      requireRecipient?: boolean;
      requirePricePhenix?: boolean;
    } = {},
    sourceForm = form,
  ): ValidatedAssetMetadata => {
    const assetCode = normalizeProductAssetCode(sourceForm.assetCode);
    const name = sourceForm.name.trim();
    const category = sourceForm.categoryLabel.trim();
    const sellerCategory = sourceForm.sellerCategoryLabel.trim();
    const spec = sourceForm.spec.trim();
    const size = sourceForm.size.trim();
    const priceCny = sourceForm.priceCny.trim();
    const fileHash = sourceForm.fileHash.trim();
    const recipient = sourceForm.recipient.trim();
    const pricePhenix = normalizeDecimalInput(sourceForm.pricePhenix);
    const pricePhenixRaw = parsePositivePhenixAmount(pricePhenix);
    const imageURLs = normalizeImageURLList(sourceForm.imageURLs, MAX_CATALOG_IMAGES);
    const certificateURLs = normalizeImageURLList(
      sourceForm.certificateURLs,
      MAX_CERTIFICATE_IMAGES,
    );

    if (!assetCode) {
      throw new Error("请输入资产编号");
    }

    if (!name) {
      throw new Error("请输入资产名称");
    }

    if (!category) {
      throw new Error("请输入资产类别");
    }

    if (!sellerCategory) {
      throw new Error("请输入来源标签");
    }

    if (!spec) {
      throw new Error("请输入规格");
    }

    if (!parsePositiveCurrency(priceCny)) {
      throw new Error("请输入正确的人民币会员价");
    }

    if (requireGeneratedPackage && !isUploadedPackageReady(sourceForm)) {
      throw new Error("请先生成并上传文件包");
    }

    if (imageURLs.length < 1) {
      throw new Error("请至少上传 1 张产品图片");
    }

    if (requireRecipient && !isAddress(recipient)) {
      throw new Error("请输入有效的接收钱包地址");
    }

    if (requirePricePhenix && pricePhenixRaw <= 0n) {
      throw new Error("请输入正确的 PHENIX 价格");
    }

    return {
      assetCode,
      name,
      fileHash,
      recipient,
      pricePhenix,
      pricePhenixRaw,
      metadata: {
        assetKind: "product",
        assetCode,
        name,
        categoryLabel: category,
        sellerCategoryLabel: sellerCategory,
        spec,
        size,
        priceCny,
        recipient: recipient || undefined,
        pricePhenix: pricePhenix || undefined,
        fileHash,
        imageURL: imageURLs[0],
        imageURLs,
        certificateURLs,
        packageURL: sourceForm.packageURL.trim() || undefined,
        packageKey: sourceForm.packageKey.trim() || undefined,
        packageSize: sourceForm.packageSize.trim() || undefined,
        chainStatus: sourceForm.chainStatus,
        chainTokenId: sourceForm.chainTokenId.trim() || undefined,
        chainTxHash: sourceForm.chainTxHash.trim() || undefined,
        chainConfirmedAt: sourceForm.chainConfirmedAt.trim() || undefined,
        tokenURI: sourceForm.tokenURI.trim() || undefined,
      },
    };
  };

  const generatePackageForForm = async (sourceForm = form) => {
    const assetCode = normalizeProductAssetCode(sourceForm.assetCode);
    const imageURLs = normalizeImageURLList(sourceForm.imageURLs, MAX_CATALOG_IMAGES);
    const certificateURLs = normalizeImageURLList(
      sourceForm.certificateURLs,
      MAX_CERTIFICATE_IMAGES,
    );

    if (!assetCode) {
      throw new Error("请先填写资产编号");
    }

    if (imageURLs.length < 1) {
      throw new Error("请至少上传 1 张产品图片");
    }

    setPackaging(true);

    try {
      const result = await createAndUploadRwaAssetPackage({
        assetCode,
        imageURLs,
        certificateURLs,
      });
      const nextForm: ProductAssetFormState = {
        ...sourceForm,
        fileHash: result.packageHash,
        packageURL: result.packageURL,
        packageKey: result.packageKey,
        packageSize: result.packageSize,
        chainStatus: sourceForm.chainStatus === "confirmed" ? "confirmed" : "draft",
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

  const handleGeneratePackage = async () => {
    if (isLocked) {
      toast.error("资产已上链，文件包已锁定");
      return;
    }

    try {
      await generatePackageForForm();
      toast.success("文件包已生成并上传");
    } catch (error) {
      toast.error(normalizeError(error));
    }
  };

  const handleSave = async () => {
    if (isLocked) {
      toast.error("资产已上链，资料已锁定");
      return;
    }

    let validated: ValidatedAssetMetadata;

    try {
      buildValidatedAssetMetadata({ requireGeneratedPackage: false });
      const workingForm = isUploadedPackageReady(form)
        ? form
        : await generatePackageForForm(form);
      validated = buildValidatedAssetMetadata({}, workingForm);
    } catch (error) {
      toast.error(normalizeError(error));
      return;
    }

    try {
      setSaving(true);
      await saveRwaAdminMetadata(
        getProductAssetStorageKey(validated.assetCode),
        validated.metadata,
      );
      await refreshRwaAdminMetadataMap();
      toast.success(`${validated.assetCode} 已保存`);
      navigate(`/admin/asset/${validated.assetCode}`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOnChain = async () => {
    if (chainBlockReason) {
      toast.error(chainBlockReason);
      return;
    }

    if (!address || !publicClient) {
      toast.error("链上客户端未就绪");
      return;
    }

    let validated: ValidatedAssetMetadata;

    try {
      buildValidatedAssetMetadata({
        requireGeneratedPackage: false,
        requireRecipient: true,
        requirePricePhenix: true,
      });
      const workingForm = isUploadedPackageReady(form)
        ? form
        : await generatePackageForForm(form);
      validated = buildValidatedAssetMetadata({
        requireGeneratedPackage: true,
        requireRecipient: true,
        requirePricePhenix: true,
      }, workingForm);
    } catch (error) {
      toast.error(normalizeError(error));
      return;
    }

    const pendingMetadata = {
      ...validated.metadata,
      chainStatus: "pending" as const,
      chainTokenId: undefined,
      chainTxHash: undefined,
      chainConfirmedAt: undefined,
      tokenURI: undefined,
    };
    let createdTokenId = "";

    try {
      setIssuing(true);
      await saveRwaAdminMetadata(
        getProductAssetStorageKey(validated.assetCode),
        pendingMetadata,
      );
      setForm((current) => ({
        ...current,
        chainStatus: "pending",
        chainTokenId: "",
        chainTxHash: "",
        chainConfirmedAt: "",
        tokenURI: "",
      }));

      const simulation = await publicClient.simulateContract({
        address: RWA_CONTRACT_ADDRESS,
        abi: rwaAbi,
        functionName: "createRWA",
        args: [
          validated.recipient as Address,
          validated.name,
          validated.pricePhenixRaw,
          validated.fileHash,
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
      const tokenURI = await publicClient
        .readContract({
          address: RWA_CONTRACT_ADDRESS,
          abi: rwaAbi,
          functionName: "tokenURI",
          args: [BigInt(tokenId)],
        })
        .then((value) => String(value || ""))
        .catch(() => `/asset/metadata?id=${tokenId}&hash=${validated.fileHash}`);
      const confirmedAt = new Date().toISOString();
      const confirmedMetadata = {
        ...validated.metadata,
        chainStatus: "confirmed" as const,
        chainTokenId: tokenId,
        chainTxHash,
        chainConfirmedAt: confirmedAt,
        tokenURI,
        status: 0,
      };

      await saveRwaAdminMetadata(
        getProductAssetStorageKey(validated.assetCode),
        confirmedMetadata,
      );
      await saveRwaAdminMetadata(tokenId, {
        ...confirmedMetadata,
        assetKind: "chain",
      });
      await refreshRwaAdminMetadataMap();
      setForm((current) => ({
        ...current,
        chainStatus: "confirmed",
        chainTokenId: tokenId,
        chainTxHash,
        chainConfirmedAt: confirmedAt,
        tokenURI,
      }));
      toast.success(`资产已上链，Token ID ${tokenId}`);
      navigate(`/admin/asset/${validated.assetCode}`);
    } catch (error) {
      if (!createdTokenId) {
        try {
          await saveRwaAdminMetadata(getProductAssetStorageKey(validated.assetCode), {
            ...validated.metadata,
            chainStatus: "failed",
          });
          await refreshRwaAdminMetadataMap();
          setForm((current) => ({ ...current, chainStatus: "failed" }));
        } catch {
          // Keep the original chain error visible to the admin.
        }
      }

      toast.error(normalizeError(error));
    } finally {
      setIssuing(false);
    }
  };

  const title = asset ? `编辑 ${asset.id}` : "添加资产";
  const breadcrumbItems = asset
    ? [
      { label: "资产库", to: "/admin/asset" },
      { label: asset.id, to: `/admin/asset/${asset.id}` },
      { label: "编辑" },
    ]
    : [
      { label: "资产库", to: "/admin/asset" },
      { label: "添加资产" },
    ];
  const formDisabled = isLocked || issuing || packaging || saving;
  const saveDisabled = saving || packaging || issuing || isLocked;
  const packageDisabled = packaging || saving || issuing || isLocked;
  const setEditableForm: typeof setForm = (next) => {
    setForm((current) => {
      const updated = typeof next === "function" ? next(current) : next;
      return updated.assetCode !== current.assetCode
        ? invalidateGeneratedPackage(updated)
        : updated;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader title={title} leading={<AssetBreadcrumb items={breadcrumbItems} />}>
        <Button size="sm" onClick={() => void handleSave()} disabled={saveDisabled}>
          {saving ? <LoaderCircle className="animate-spin" /> : <BadgeCheck />}
          {isLocked ? "已锁定" : "保存"}
        </Button>
      </AssetHeader>

      <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>资产资料</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {isLocked ? (
              <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                <span>
                  该资产已完成链上发行，资产名称、价格、接收地址、图片和证书资料已锁定。
                </span>
              </div>
            ) : null}

            <ProductAssetFields form={form} setForm={setEditableForm} disabled={formDisabled} />

            <ProductAssetImageUploader
              title="产品图片"
              description="第一张作为资产封面，可上传多角度图片。"
              imageURLs={form.imageURLs}
              maxImages={MAX_CATALOG_IMAGES}
              uploading={uploadingProductImages}
              disabled={formDisabled || packaging || saving}
              onUpload={(files) => void handleUploadImages(files, "product")}
              onRemove={(imageURL) => removeImageURL(imageURL, "product")}
              onCover={setCoverImage}
            />

            <ProductAssetImageUploader
              title="证书 / 确权资料图片"
              description="上传证书、确权资料、托管文件截图等影像。"
              imageURLs={form.certificateURLs}
              maxImages={MAX_CERTIFICATE_IMAGES}
              uploading={uploadingCertificateImages}
              disabled={formDisabled || packaging || saving}
              onUpload={(files) => void handleUploadImages(files, "certificate")}
              onRemove={(imageURL) => removeImageURL(imageURL, "certificate")}
            />

            <AssetPackagePanel
              form={form}
              ready={packageReady}
              disabled={packageDisabled}
              packaging={packaging}
              onGenerate={handleGeneratePackage}
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-900/70">
                保存或上链时会自动生成文件包。文件包会包含产品图片、证书图片和
                manifest，服务端会对 ZIP 内容计算 SHA-256 并写入 hash。
              </div>
              <Button
                className="h-full"
                onClick={() => void handleSave()}
                disabled={saveDisabled}
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                {isLocked ? "已上链锁定" : "保存资产资料"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <aside className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-sky-700" />
                资产卡片预览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductAssetPreviewCard form={form} />
            </CardContent>
          </Card>

          <ChainIssuePanel
            form={form}
            address={address}
            isIssuerWallet={isIssuerWallet}
            blockReason={chainBlockReason}
            issuing={issuing}
            onCreate={handleCreateOnChain}
          />
        </aside>
      </main>

      <AssetDatalists />
    </div>
  );
}

function AssetPackagePanel({
  form,
  ready,
  disabled,
  packaging,
  onGenerate,
}: {
  form: ProductAssetFormState;
  ready: boolean;
  disabled: boolean;
  packaging: boolean;
  onGenerate: () => void;
}) {
  const fileCount = form.imageURLs.length + form.certificateURLs.length;

  return (
    <div className="grid gap-4 border border-sky-100 bg-white/80 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
            <FileArchive className="size-4 text-sky-700" />
            自动文件包
          </div>
          <p className="mt-2 text-sm leading-6 text-sky-900/60">
            产品图片和证书图片会被打包成 ZIP，上传后用 ZIP 内容 SHA-256 作为合约 fileHash。
          </p>
        </div>
        <Badge className={ready ? "bg-emerald-600" : "bg-neutral-950"}>
          {ready ? "已生成" : "待生成"}
        </Badge>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-3">
        <PackageStat label="产品图片" value={`${form.imageURLs.length} 张`} />
        <PackageStat label="证书图片" value={`${form.certificateURLs.length} 张`} />
        <PackageStat
          label="文件包大小"
          value={form.packageSize ? formatPackageSize(form.packageSize) : "待生成"}
        />
      </div>

      {ready ? (
        <div className="grid gap-2 border border-sky-100 bg-sky-50/60 p-4 text-sm">
          <div className="text-sky-900/60">文件包 hash</div>
          <div className="break-all font-mono text-sky-950">{form.fileHash}</div>
          <div className="flex flex-wrap items-center gap-2 pt-2">
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
          当前会打包 {fileCount} 个文件。图片或证书变更后需要重新生成文件包。
        </div>
      )}

      <Button
        type="button"
        variant={ready ? "outline" : "default"}
        onClick={() => void onGenerate()}
        disabled={disabled || form.imageURLs.length < 1}
      >
        {packaging ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <FileArchive className="size-4" />
        )}
        {ready ? "重新生成并上传文件包" : "生成并上传文件包"}
      </Button>
    </div>
  );
}

function ChainIssuePanel({
  form,
  address,
  isIssuerWallet,
  blockReason,
  issuing,
  onCreate,
}: {
  form: ProductAssetFormState;
  address?: Address;
  isIssuerWallet: boolean;
  blockReason: string;
  issuing: boolean;
  onCreate: () => void;
}) {
  const isConfirmed = form.chainStatus === "confirmed" && Boolean(form.chainTokenId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WalletCards className="size-5 text-sky-700" />
          链上发行
        </CardTitle>
        <CardDescription>
          使用 RWA 合约 createRWA 写入接收地址、资产名称、PHENIX 价格和文件包 hash。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={getChainStatusClassName(form.chainStatus)}>
            {getChainStatusLabel(form.chainStatus)}
          </Badge>
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
              <LockKeyhole className="size-4" />
              资料已锁定
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 text-sm">
          <ChainInfoRow label="当前钱包" value={address ?? "未连接"} mono />
          <ChainInfoRow label="发行权限" value={isIssuerWallet ? "已授权" : "未确认"} />
          <ChainInfoRow label="接收地址" value={form.recipient || "待填写"} mono />
          <ChainInfoRow label="PHENIX 价格" value={form.pricePhenix || "待填写"} />
          <ChainInfoRow label="Token ID" value={form.chainTokenId || "未上链"} mono />
          <ChainInfoRow
            label="交易"
            value={
              form.chainTxHash ? (
                <a
                  className="inline-flex items-center gap-1 break-all font-mono text-sky-700 hover:underline"
                  href={`${BASESCAN_TX_BASE}${form.chainTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {form.chainTxHash}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ) : (
                "未提交"
              )
            }
          />
        </div>

        {blockReason ? (
          <div className="border border-amber-100 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            {blockReason}
          </div>
        ) : (
          <div className="border border-emerald-100 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
            当前资料可以提交链上发行。提交成功后资产资料会自动锁定。
          </div>
        )}

        <Button
          type="button"
          onClick={() => void onCreate()}
          disabled={Boolean(blockReason) || issuing}
        >
          {issuing ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : isConfirmed ? (
            <LockKeyhole className="size-4" />
          ) : (
            <BadgeCheck className="size-4" />
          )}
          {isConfirmed ? "已完成上链" : issuing ? "正在提交上链" : "保存并提交上链"}
        </Button>
      </CardContent>
    </Card>
  );
}

function PackageStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-sky-100 bg-sky-50/60 p-3">
      <div className="text-xs text-sky-900/50">{label}</div>
      <div className="mt-1 font-semibold text-sky-950">{value}</div>
    </div>
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
    <div className="grid gap-1 border border-sky-100 bg-white/70 p-3 sm:grid-cols-[92px_1fr]">
      <div className="text-sky-900/50">{label}</div>
      <div className={mono ? "break-all font-mono text-xs text-sky-950" : "break-all text-sky-950"}>
        {value}
      </div>
    </div>
  );
}
