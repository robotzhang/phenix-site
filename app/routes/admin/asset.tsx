import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { base } from "viem/chains";
import { isAddress, parseEventLogs, parseUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useSwitchChain } from "wagmi";
import { toast } from "sonner";
import {
  BadgeCheck,
  CircleAlert,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tag,
  UserPlus,
} from "lucide-react";

import rwaAbi from "@/abi/rwa.json";
import ConnectButton from "@/components/wallet/ConnectButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlobalLoading from "@/components/ui/global-loading";
import { useRwaList } from "@/hooks/useRwa";
import { useSafeContractWrite } from "@/hooks/useSafeContractWrite";
import { PHENIX_DECIMALS, RWA_ADDRESS } from "@/lib/constants";
import {
  RWA_CATEGORY_LABELS,
  RWA_SELLER_CATEGORY_LABELS,
  formatRwaPriceWithCurrency,
} from "@/lib/rwa";
import {
  removeRwaAdminMetadata,
  saveRwaAdminMetadata,
  uploadRwaAdminImage,
  useRwaAdminMetadataMap,
} from "@/lib/rwa-admin-storage";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const CATEGORY_DATALIST_ID = "rwa-category-options";
const SELLER_DATALIST_ID = "rwa-seller-options";
const MIN_PRODUCT_IMAGES = 2;
const MAX_PRODUCT_IMAGES = 5;
const MAX_UPLOAD_IMAGE_BYTES = 420_000;
const IMAGE_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const statusLabels: Record<number, string> = {
  0: "已发布",
  1: "已下架",
};

function shortAddress(value?: string) {
  if (!value) return "";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "操作失败，请稍后重试";
}

function getStatusLabel(status: number) {
  return statusLabels[status] ?? `状态 ${status}`;
}

function getDefaultRwaImageURL(fileHash: string) {
  return `https://rwa-cdn.phenixmcga.com/${fileHash}/cover.png`;
}

function normalizeImageURLList(value: string[]) {
  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean))).slice(
    0,
    MAX_PRODUCT_IMAGES,
  );
}

async function compressProductImage(file: File) {
  if (!IMAGE_UPLOAD_TYPES.has(file.type)) {
    throw new Error(`${file.name} 不是支持的图片格式`);
  }

  const bitmap = await createImageBitmap(file);
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("图片压缩失败");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const qualitySteps = outputType === "image/png" ? [0.92] : [0.82, 0.72, 0.62, 0.52];

  for (const quality of qualitySteps) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, quality);
    });

    if (blob && blob.size <= MAX_UPLOAD_IMAGE_BYTES) {
      return new File([blob], file.name, { type: outputType });
    }
  }

  const fallbackBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, 0.5);
  });

  if (!fallbackBlob || fallbackBlob.size > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error(`${file.name} 压缩后仍然过大，请换一张更小的图片`);
  }

  return new File([fallbackBlob], file.name, { type: outputType });
}

function RwaAdminRow({
  rwa,
  canManage,
  onToggleStatus,
}: {
  rwa: {
    tokenId: bigint;
    owner: `0x${string}`;
    categoryLabel: string;
    sellerCategoryLabel: string;
    imageURL: string;
    imageURLs: string[];
    tokenURI: string;
    asset: {
      name: string;
      pricePhenixFormatted: string;
      fileHash: string;
      status: number;
    };
  };
  canManage: boolean;
  onToggleStatus: (tokenId: bigint, currentStatus: number) => Promise<void>;
}) {
  const [categoryLabel, setCategoryLabel] = useState(rwa.categoryLabel);
  const [sellerCategoryLabel, setSellerCategoryLabel] = useState(rwa.sellerCategoryLabel);
  const [imageURLs, setImageURLs] = useState<string[]>(() => normalizeImageURLList(rwa.imageURLs));
  const [busyAction, setBusyAction] = useState<"save" | "reset" | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setCategoryLabel(rwa.categoryLabel);
    setSellerCategoryLabel(rwa.sellerCategoryLabel);
    setImageURLs(normalizeImageURLList(rwa.imageURLs));
  }, [rwa.categoryLabel, rwa.imageURLs, rwa.sellerCategoryLabel, rwa.tokenId]);

  const handleSaveMetadata = async () => {
    const nextCategory = categoryLabel.trim();
    const nextSellerCategory = sellerCategoryLabel.trim();

    if (!nextCategory) {
      toast.error("请输入资产类别");
      return;
    }

    if (!nextSellerCategory) {
      toast.error("请输入卖家类别");
      return;
    }

    if (imageURLs.length < MIN_PRODUCT_IMAGES) {
      toast.error(`请至少上传 ${MIN_PRODUCT_IMAGES} 张产品图片`);
      return;
    }

    try {
      setBusyAction("save");
      await saveRwaAdminMetadata(rwa.tokenId, {
        categoryLabel: nextCategory,
        sellerCategoryLabel: nextSellerCategory,
        imageURLs,
        imageURL: imageURLs[0],
      });

      toast.success(`#${rwa.tokenId.toString()} 标签已保存`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files?.length) return;

    const nextFiles = Array.from(files);
    const remaining = MAX_PRODUCT_IMAGES - imageURLs.length;
    if (remaining <= 0) {
      toast.error(`每个产品最多上传 ${MAX_PRODUCT_IMAGES} 张图片`);
      return;
    }

    try {
      setUploading(true);
      const uploaded: string[] = [];

      for (const file of nextFiles.slice(0, remaining)) {
        const compressed = await compressProductImage(file);
        uploaded.push(await uploadRwaAdminImage(compressed));
      }

      setImageURLs((current) => normalizeImageURLList([...current, ...uploaded]));
      toast.success(`已上传 ${uploaded.length} 张产品图片`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setUploading(false);
    }
  };

  const removeImageURL = (imageURL: string) => {
    setImageURLs((current) => current.filter((item) => item !== imageURL));
  };

  const handleResetMetadata = async () => {
    try {
      setBusyAction("reset");
      await removeRwaAdminMetadata(rwa.tokenId);

      toast.success(`#${rwa.tokenId.toString()} 已重置为默认标签`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <article className="border border-sky-100 bg-white/90 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[220px_1fr_320px]">
        <div className="border-b border-sky-100 bg-sky-50/60 lg:border-b-0 lg:border-r">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={imageURLs[0] ?? rwa.imageURL} alt={rwa.asset.name} className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="min-w-0 border-b border-sky-100 p-5 lg:border-b-0 lg:border-r">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex border border-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
              {rwa.categoryLabel}
            </span>
            <span className="inline-flex border border-sky-100 px-2 py-1 text-xs text-sky-900/60">
              {rwa.sellerCategoryLabel}
            </span>
            <span className="inline-flex border border-sky-100 px-2 py-1 text-xs text-sky-900/60">
              {getStatusLabel(rwa.asset.status)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                Asset #{rwa.tokenId.toString()}
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-sky-950">{rwa.asset.name}</h3>
              <div className="mt-4 grid gap-2 text-sm text-sky-900/70">
                <div>Owner: {shortAddress(rwa.owner)}</div>
                <div className="truncate font-mono">Hash {rwa.asset.fileHash}</div>
                <a
                  href={rwa.tokenURI}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-500"
                >
                  打开 tokenURI
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="min-w-[180px] rounded-lg border border-sky-100 bg-white p-4">
              <div className="text-sm text-sky-900/60">会员价</div>
              <div className="mt-2 text-2xl font-semibold text-sky-950">
                {formatRwaPriceWithCurrency(rwa.asset.pricePhenixFormatted)}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link to={`/asset/${rwa.tokenId}`}>前台查看</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(rwa.tokenId, rwa.asset.status)}
              disabled={!canManage}
            >
              {rwa.asset.status === 0 ? "下架" : "发布"}
            </Button>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
            <Tag className="h-4 w-4 text-sky-700" />
            标签编辑
          </div>

          <div className="mt-4 grid gap-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-sky-950">
                  产品图片 ({imageURLs.length}/{MAX_PRODUCT_IMAGES})
                </span>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 border border-sky-300 px-3 py-2 text-xs font-semibold text-sky-950 transition hover:bg-sky-50">
                  {uploading ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  上传
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={uploading || imageURLs.length >= MAX_PRODUCT_IMAGES}
                    onChange={(event) => {
                      void handleUploadImages(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>

              {imageURLs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {imageURLs.map((imageURL, index) => (
                    <div key={imageURL} className="group relative overflow-hidden border border-sky-100 bg-sky-50">
                      <img src={imageURL} alt={`产品图 ${index + 1}`} className="aspect-square w-full object-cover" />
                      <button
                        type="button"
                        className="absolute right-1 top-1 bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-sky-950 shadow-sm opacity-0 transition group-hover:opacity-100"
                        onClick={() => removeImageURL(imageURL)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-sky-200 bg-sky-50/60 p-4 text-sm leading-6 text-sky-900/60">
                  上传 2-5 张产品图片，第一张会作为资产封面。
                </div>
              )}
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-sky-950">资产类别</span>
              <Input
                list={CATEGORY_DATALIST_ID}
                value={categoryLabel}
                onChange={(event) => setCategoryLabel(event.target.value)}
                placeholder="沉香 / 翡翠 / 自定义标签"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-sky-950">卖家类别</span>
              <Input
                list={SELLER_DATALIST_ID}
                value={sellerCategoryLabel}
                onChange={(event) => setSellerCategoryLabel(event.target.value)}
                placeholder="平台 / 会员 / 认证商家"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                className="w-full"
                onClick={handleSaveMetadata}
                disabled={busyAction === "save"}
              >
                {busyAction === "save" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <BadgeCheck className="h-4 w-4" />
                )}
                保存标签
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetMetadata}
                disabled={busyAction === "reset"}
              >
                {busyAction === "reset" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                重置
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function meta() {
  return [
    { title: "资产库管理后台 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminRwa() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { write } = useSafeContractWrite();
  const { data: rwas, loading, refetch } = useRwaList();
  const adminMetadataMap = useRwaAdminMetadataMap();

  const [recipient, setRecipient] = useState("");
  const [assetName, setAssetName] = useState("");
  const [pricePhenix, setPricePhenix] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [categoryLabel, setCategoryLabel] = useState<string>(RWA_CATEGORY_LABELS[0]);
  const [sellerCategoryLabel, setSellerCategoryLabel] = useState<string>(RWA_SELLER_CATEGORY_LABELS[0]);
  const [productImageURLs, setProductImageURLs] = useState<string[]>([]);
  const [uploadingProductImages, setUploadingProductImages] = useState(false);
  const [draggingProductImages, setDraggingProductImages] = useState(false);
  const [issuerAddress, setIssuerAddress] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    if (address && !recipient) setRecipient(address);
  }, [address, recipient]);

  const ownerRead = useReadContract({
    address: RWA_ADDRESS,
    abi: rwaAbi,
    functionName: "owner",
    chainId: base.id,
  });

  const issuerRead = useReadContract({
    address: RWA_ADDRESS,
    abi: rwaAbi,
    functionName: "authorizedIssuer",
    args: [address ?? ZERO_ADDRESS],
    chainId: base.id,
    query: { enabled: Boolean(address) },
  });

  const isBase = chainId === base.id;
  const owner = ownerRead.data as `0x${string}` | undefined;
  const isOwner = Boolean(address && owner && address.toLowerCase() === owner.toLowerCase());
  const isIssuer = Boolean(issuerRead.data);
  const canManage = isOwner || isIssuer;

  const published = useMemo(
    () => (rwas || []).filter((rwa) => rwa.asset.status === 0).length,
    [rwas]
  );

  const labeledCount = useMemo(() => Object.keys(adminMetadataMap).length, [adminMetadataMap]);

  const imagePreviewUrl = useMemo(() => {
    if (productImageURLs[0]) return productImageURLs[0];

    const hash = fileHash.trim();
    if (!hash) return "";
    return getDefaultRwaImageURL(hash);
  }, [fileHash, productImageURLs]);

  const refreshAdminReads = async () => {
    await Promise.all([refetch(), ownerRead.refetch(), issuerRead.refetch()]);
  };

  const ensureReady = async () => {
    if (!isConnected || !address) {
      toast.error("请先连接管理员钱包");
      return false;
    }

    if (!isBase) {
      try {
        await switchChainAsync({ chainId: base.id });
      } catch {
        toast.error("请切换到 Base 网络");
        return false;
      }
    }

    if (!canManage) {
      toast.error("当前钱包不是合约 owner 或授权 issuer");
      return false;
    }

    if (!publicClient) {
      toast.error("链上客户端未就绪");
      return false;
    }

    return true;
  };

  const handleCreateRwa = async () => {
    if (!(await ensureReady())) return;

    const to = recipient.trim();
    const name = assetName.trim();
    const hash = fileHash.trim();
    const nextCategory = categoryLabel.trim();
    const nextSellerCategory = sellerCategoryLabel.trim();

    if (!isAddress(to)) {
      toast.error("资产接收地址不正确");
      return;
    }

    if (!name) {
      toast.error("请输入资产名称");
      return;
    }

    if (!pricePhenix || Number(pricePhenix) <= 0) {
      toast.error("请输入大于 0 的 PHENIX 定价");
      return;
    }

    if (!hash) {
      toast.error("请输入资产文件包 hash");
      return;
    }

    if (!nextCategory) {
      toast.error("请输入资产类别");
      return;
    }

    if (!nextSellerCategory) {
      toast.error("请输入卖家类别");
      return;
    }

    if (productImageURLs.length < MIN_PRODUCT_IMAGES) {
      toast.error(`请上传 ${MIN_PRODUCT_IMAGES}-${MAX_PRODUCT_IMAGES} 张产品图片`);
      return;
    }

    try {
      setBusyAction("create");
      const price = parseUnits(pricePhenix, PHENIX_DECIMALS);
      const simulation = await publicClient!.simulateContract({
        address: RWA_ADDRESS,
        abi: rwaAbi,
        functionName: "createRWA",
        args: [to, name, price, hash],
        account: address,
      });

      const receipt = await write(simulation.request);
      if (!receipt) {
        throw new Error("交易未返回回执");
      }

      let createdTokenId: bigint | undefined;

      try {
        const logs = parseEventLogs({
          abi: rwaAbi,
          logs: receipt.logs,
          eventName: "RWACreated",
        });

        const parsedTokenId = (logs[0] as { args?: { tokenId?: unknown } } | undefined)?.args?.tokenId;
        if (typeof parsedTokenId === "bigint") {
          createdTokenId = parsedTokenId;
        }
      } catch {
        // fall back to nextTokenId below
      }

      if (!createdTokenId) {
        try {
          const nextTokenId = await publicClient!.readContract({
            address: RWA_ADDRESS,
            abi: rwaAbi,
            functionName: "nextTokenId",
          });

          if (typeof nextTokenId === "bigint" && nextTokenId > 0n) {
            createdTokenId = nextTokenId - 1n;
          }
        } catch {
          // fall through
        }
      }

      const saved = createdTokenId
        ? await saveRwaAdminMetadata(createdTokenId, {
          categoryLabel: nextCategory,
          sellerCategoryLabel: nextSellerCategory,
          imageURLs: productImageURLs,
          imageURL: productImageURLs[0],
        })
        : false;

      await refreshAdminReads();

      if (!saved && createdTokenId) {
        toast.error(`资产 #${createdTokenId.toString()} 已创建，但标签未能写入 JSON 存储`);
      } else if (createdTokenId) {
        toast.success(`资产 #${createdTokenId.toString()} 已创建并保存标签`);
      } else {
        toast.success("资产已提交上链");
      }

      setAssetName("");
      setPricePhenix("");
      setFileHash("");
      setProductImageURLs([]);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const handleStatusChange = async (tokenId: bigint, currentStatus: number) => {
    if (!(await ensureReady())) return;

    const nextStatus = currentStatus === 0 ? 1 : 0;

    try {
      setBusyAction(`status-${tokenId.toString()}`);
      const simulation = await publicClient!.simulateContract({
        address: RWA_ADDRESS,
        abi: rwaAbi,
        functionName: "updateRWAStatus",
        args: [tokenId, nextStatus],
        account: address,
      });

      await write(simulation.request);
      await refreshAdminReads();
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSetIssuer = async (enabled: boolean) => {
    if (!isConnected || !address) {
      toast.error("请先连接 owner 钱包");
      return;
    }

    if (!isOwner) {
      toast.error("只有合约 owner 可以授权管理员");
      return;
    }

    if (!publicClient) {
      toast.error("链上客户端未就绪");
      return;
    }

    const issuer = issuerAddress.trim();
    if (!isAddress(issuer)) {
      toast.error("请输入正确的钱包地址");
      return;
    }

    try {
      setBusyAction(enabled ? "issuer-enable" : "issuer-disable");
      const simulation = await publicClient.simulateContract({
        address: RWA_ADDRESS,
        abi: rwaAbi,
        functionName: "setIssuer",
        args: [issuer, enabled],
        account: address,
      });

      await write(simulation.request);
      await refreshAdminReads();
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setBusyAction(null);
    }
  };

  const handleUploadProductImages = async (files: FileList | null) => {
    if (!files?.length) return;

    const remaining = MAX_PRODUCT_IMAGES - productImageURLs.length;
    if (remaining <= 0) {
      toast.error(`每个产品最多上传 ${MAX_PRODUCT_IMAGES} 张图片`);
      return;
    }

    try {
      setUploadingProductImages(true);
      const uploaded: string[] = [];

      for (const file of Array.from(files).slice(0, remaining)) {
        const compressed = await compressProductImage(file);
        uploaded.push(await uploadRwaAdminImage(compressed));
      }

      setProductImageURLs((current) => normalizeImageURLList([...current, ...uploaded]));
      toast.success(`已上传 ${uploaded.length} 张产品图片`);
    } catch (error) {
      toast.error(normalizeError(error));
    } finally {
      setUploadingProductImages(false);
    }
  };

  const removeProductImageURL = (imageURL: string) => {
    setProductImageURLs((current) => current.filter((item) => item !== imageURL));
  };

  const productUploadDisabled =
    uploadingProductImages || productImageURLs.length >= MAX_PRODUCT_IMAGES;

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-10 sm:px-0 sm:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
              Admin Console
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
              资产库管理
            </h1>
            <p className="mt-5 max-w-3xl leading-8 text-sky-900/70">
              添加链上资产、管理标签、更新发布状态，并授权可上架资产的钱包。资产图片默认读取
              <span className="font-mono text-sky-950">
                {" "}
                rwa-cdn.phenixmcga.com/&lt;hash&gt;/cover.png
              </span>
              。
            </p>
          </div>

          <div className="grid min-w-[280px] gap-3 border border-sky-100 bg-white/90 p-4 shadow-sm">
            <ConnectButton />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="border border-sky-100 p-3">
                <div className="text-sky-900/60">网络</div>
                <div className="mt-1 font-semibold text-sky-950">
                  {isBase ? "Base" : "未切换"}
                </div>
              </div>
              <div className="border border-sky-100 p-3">
                <div className="text-sky-900/60">权限</div>
                <div className="mt-1 font-semibold text-sky-950">
                  {isOwner ? "Owner" : isIssuer ? "Issuer" : "无权限"}
                </div>
              </div>
            </div>
            {!isBase && isConnected && (
              <Button
                variant="outline"
                onClick={() => switchChainAsync({ chainId: base.id })}
                disabled={switching}
              >
                {switching && <LoaderCircle className="h-4 w-4 animate-spin" />}
                切换到 Base
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 border-b border-sky-100 bg-[linear-gradient(180deg,#f7fbfd_0%,#edf6fb_100%)] px-4 py-6 text-sky-950 sm:px-8 md:grid-cols-5">
        <div className="border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="text-sm text-sky-900/60">合约</div>
          <div className="mt-2 font-mono text-sm font-semibold">{shortAddress(RWA_ADDRESS)}</div>
        </div>
        <div className="border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="text-sm text-sky-900/60">Owner</div>
          <div className="mt-2 font-mono text-sm font-semibold">
            {owner ? shortAddress(owner) : "读取中"}
          </div>
        </div>
        <div className="border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="text-sm text-sky-900/60">资产总数</div>
          <div className="mt-2 text-2xl font-semibold">{rwas.length}</div>
        </div>
        <div className="border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="text-sm text-sky-900/60">已发布</div>
          <div className="mt-2 text-2xl font-semibold">{published}</div>
        </div>
        <div className="border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="text-sm text-sky-900/60">已标注</div>
          <div className="mt-2 text-2xl font-semibold">{labeledCount}</div>
        </div>
      </section>

      {!canManage && isConnected && (
        <section className="px-4 py-6 sm:px-0">
          <div className="flex gap-3 border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <div className="font-semibold">当前钱包没有管理权限</div>
              <p className="mt-2 text-sm leading-6">
                请使用合约 owner 钱包，或先让 owner 在下方授权该钱包为 issuer。
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-6 px-4 py-8 sm:px-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3 border-b border-sky-100 pb-5">
            <Plus className="h-5 w-5 text-sky-700" />
            <div>
              <h2 className="text-xl font-semibold text-sky-950">添加资产</h2>
              <p className="text-sm text-sky-900/60">
                调用资产合约创建链上资产，创建后默认状态为已发布。
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-sky-950">资产接收地址</span>
              <Input
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x..."
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-sky-950">资产名称</span>
              <Input
                value={assetName}
                onChange={(event) => setAssetName(event.target.value)}
                placeholder="例如：明代青花瓷器"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-sky-950">会员价</span>
                <Input
                  inputMode="decimal"
                  value={pricePhenix}
                  onChange={(event) => setPricePhenix(event.target.value)}
                  placeholder="1000000"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-sky-950">文件包 hash</span>
                <Input
                  value={fileHash}
                  onChange={(event) => setFileHash(event.target.value)}
                  placeholder="资产文件包目录名或 hash"
                />
              </label>
            </div>

            <div className="grid gap-3">
              <div>
                <div>
                  <div className="text-sm font-medium text-sky-950">
                    产品图片 ({productImageURLs.length}/{MAX_PRODUCT_IMAGES})
                  </div>
                  <p className="mt-1 text-sm text-sky-900/60">
                    上传 {MIN_PRODUCT_IMAGES}-{MAX_PRODUCT_IMAGES} 张图片，第一张作为封面。
                  </p>
                </div>
              </div>

              <label
                className={`flex min-h-[150px] cursor-pointer flex-col items-center justify-center border border-dashed px-5 py-6 text-center transition ${
                  draggingProductImages
                    ? "border-sky-500 bg-sky-100"
                    : "border-sky-200 bg-sky-50/60 hover:border-sky-400 hover:bg-sky-50"
                } ${productUploadDisabled ? "cursor-not-allowed opacity-60" : ""}`}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (!productUploadDisabled) setDraggingProductImages(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!productUploadDisabled) setDraggingProductImages(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setDraggingProductImages(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDraggingProductImages(false);
                  if (!productUploadDisabled) {
                    void handleUploadProductImages(event.dataTransfer.files);
                  }
                }}
              >
                <span className="flex h-12 w-12 items-center justify-center border border-sky-200 bg-white text-sky-700 shadow-sm">
                  {uploadingProductImages ? (
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  ) : (
                    <ImagePlus className="h-6 w-6" />
                  )}
                </span>
                <span className="mt-4 text-base font-semibold text-sky-950">
                  {productUploadDisabled ? "图片数量已达上限" : "点击上传产品图片"}
                </span>
                <span className="mt-2 text-sm leading-6 text-sky-900/60">
                  支持拖拽图片到这里，JPG / PNG / WebP，最多 {MAX_PRODUCT_IMAGES} 张
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={productUploadDisabled}
                  onChange={(event) => {
                    void handleUploadProductImages(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>

              {productImageURLs.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-5">
                  {productImageURLs.map((imageURL, index) => (
                    <div key={imageURL} className="group relative overflow-hidden border border-sky-100 bg-sky-50">
                      <img src={imageURL} alt={`产品图 ${index + 1}`} className="aspect-square w-full object-cover" />
                      <div className="absolute left-1 top-1 bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-sky-950 shadow-sm">
                        {index === 0 ? "封面" : index + 1}
                      </div>
                      <button
                        type="button"
                        className="absolute right-1 top-1 bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-sky-950 shadow-sm opacity-0 transition group-hover:opacity-100"
                        onClick={() => removeProductImageURL(imageURL)}
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-sky-100 bg-white/70 p-4 text-sm leading-6 text-sky-900/60">
                  还没有上传产品图片。图片会自动压缩后保存到后台，并同步到前台资产详情页轮播展示。
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-sky-950">资产类别</span>
                <Input
                  list={CATEGORY_DATALIST_ID}
                  value={categoryLabel}
                  onChange={(event) => setCategoryLabel(event.target.value)}
                  placeholder="沉香 / 翡翠 / 自定义标签"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-sky-950">卖家类别</span>
                <Input
                  list={SELLER_DATALIST_ID}
                  value={sellerCategoryLabel}
                  onChange={(event) => setSellerCategoryLabel(event.target.value)}
                  placeholder="平台 / 会员 / 认证商家"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              {imagePreviewUrl ? (
                <div className="aspect-[4/3] overflow-hidden border border-sky-100 bg-sky-50">
                  <img src={imagePreviewUrl} alt="资产封面预览" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-sky-200 bg-sky-50/60 text-sm text-sky-900/50">
                  封面预览
                </div>
              )}

              <div className="grid gap-3">
                <div className="border border-sky-100 bg-sky-50/70 p-4">
                  <div className="text-sm text-sky-900/60">预览</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex border border-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                      {categoryLabel || "资产类别"}
                    </span>
                    <span className="inline-flex border border-sky-100 px-2 py-1 text-xs text-sky-900/60">
                      {sellerCategoryLabel || "卖家类别"}
                    </span>
                  </div>
                  <div className="mt-4 text-sm text-sky-900/60">会员价</div>
                  <div className="mt-1 text-2xl font-semibold text-sky-950">
                    {pricePhenix ? formatRwaPriceWithCurrency(pricePhenix) : "￥ 0 元"}
                  </div>
                </div>

                <Button
                  className="h-12 bg-sky-800 text-white hover:bg-sky-700"
                  onClick={handleCreateRwa}
                  disabled={busyAction === "create"}
                >
                  {busyAction === "create" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  添加到资产库
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-sky-100 bg-white/90 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3 border-b border-sky-100 pb-5">
            <UserPlus className="h-5 w-5 text-sky-700" />
            <div>
              <h2 className="text-xl font-semibold text-sky-950">授权上架钱包</h2>
              <p className="text-sm text-sky-900/60">只有合约 owner 可以授权或取消 issuer。</p>
            </div>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-sky-950">钱包地址</span>
              <Input
                value={issuerAddress}
                onChange={(event) => setIssuerAddress(event.target.value)}
                placeholder="0x..."
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => handleSetIssuer(true)}
                disabled={!isOwner || busyAction === "issuer-enable"}
              >
                {busyAction === "issuer-enable" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                授权 issuer
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSetIssuer(false)}
                disabled={!isOwner || busyAction === "issuer-disable"}
              >
                {busyAction === "issuer-disable" && <LoaderCircle className="h-4 w-4 animate-spin" />}
                取消授权
              </Button>
            </div>
          </div>

          <div className="mt-6 flex gap-3 border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-900/70">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
            <p>
              Issuer 可以创建资产和更新资产状态，但不能授权其他管理员。请只授权可信运营钱包。
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-0">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-sky-950">资产列表</h2>
            <p className="mt-2 text-sm text-sky-900/60">
              这里读取的是当前资产合约的链上资产和后台 JSON 标签覆盖。
            </p>
          </div>
          <Button variant="outline" onClick={() => refreshAdminReads()}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2 border border-sky-100 bg-white/80 px-3 py-2 text-sm text-sky-900/60 shadow-sm">
          <CircleAlert className="h-4 w-4" />
          后台 JSON 标签覆盖会同步到前台页面，刷新和新增后都会重新读取最新数据。
        </div>

        {loading && <GlobalLoading />}

        {rwas.length === 0 && !loading && (
          <div className="border border-sky-100 bg-white/90 px-6 py-16 text-center text-sky-900/60">
            暂无链上资产，添加第一件资产后会显示在这里。
          </div>
        )}

        {rwas.length > 0 && (
          <div className="grid gap-4">
            {rwas.map((rwa) => (
              <RwaAdminRow
                key={rwa.tokenId.toString()}
                rwa={rwa}
                canManage={canManage}
                onToggleStatus={handleStatusChange}
              />
            ))}
          </div>
        )}
      </section>

      <datalist id={CATEGORY_DATALIST_ID}>
        {RWA_CATEGORY_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
      <datalist id={SELLER_DATALIST_ID}>
        {RWA_SELLER_CATEGORY_LABELS.map((label) => (
          <option key={label} value={label} />
        ))}
      </datalist>
    </div>
  );
}
