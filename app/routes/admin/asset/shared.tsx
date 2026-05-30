import { Fragment, useState } from "react";
import { Link } from "react-router";
import { LoaderCircle, ImagePlus, BadgeCheck, PackageCheck, Ruler } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
  formatProductAssetPrice,
  getProductAssetDisplayName,
  normalizeProductAssetCode,
  type ProductAsset,
} from "@/data/product-assets";

export const CATEGORY_DATALIST_ID = "rwa-category-options";
export const SELLER_DATALIST_ID = "rwa-seller-options";
export const MAX_CATALOG_IMAGES = 8;
export const MAX_CERTIFICATE_IMAGES = 6;
const MAX_UPLOAD_IMAGE_BYTES = 420_000;
const IMAGE_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface ProductAssetFormState {
  assetCode: string;
  name: string;
  categoryLabel: string;
  sellerCategoryLabel: string;
  spec: string;
  size: string;
  priceCny: string;
  recipient: string;
  pricePhenix: string;
  fileHash: string;
  packageURL: string;
  packageKey: string;
  packageSize: string;
  chainStatus: "draft" | "pending" | "confirmed" | "failed";
  chainTokenId: string;
  chainTxHash: string;
  chainConfirmedAt: string;
  tokenURI: string;
  imageURLs: string[];
  certificateURLs: string[];
}

export function createEmptyProductAssetForm(assetCode = ""): ProductAssetFormState {
  return {
    assetCode,
    name: "",
    categoryLabel: "沉香",
    sellerCategoryLabel: "平台",
    spec: "",
    size: "",
    priceCny: "",
    recipient: "",
    pricePhenix: "",
    fileHash: "",
    packageURL: "",
    packageKey: "",
    packageSize: "",
    chainStatus: "draft",
    chainTokenId: "",
    chainTxHash: "",
    chainConfirmedAt: "",
    tokenURI: "",
    imageURLs: [],
    certificateURLs: [],
  };
}

export function createProductAssetFormFromAsset(asset: ProductAsset): ProductAssetFormState {
  return {
    assetCode: asset.id,
    name: getProductAssetDisplayName(asset),
    categoryLabel: asset.categoryLabel,
    sellerCategoryLabel: asset.sellerCategoryLabel,
    spec: asset.spec,
    size: asset.size,
    priceCny: String(asset.priceCny || ""),
    recipient: asset.recipient ?? "",
    pricePhenix: asset.pricePhenix ?? "",
    fileHash: asset.fileHash,
    packageURL: asset.packageURL ?? "",
    packageKey: asset.packageKey ?? "",
    packageSize: asset.packageSize ?? "",
    chainStatus: asset.chainStatus ?? "draft",
    chainTokenId: asset.chainTokenId ?? "",
    chainTxHash: asset.chainTxHash ?? "",
    chainConfirmedAt: asset.chainConfirmedAt ?? "",
    tokenURI: asset.tokenURI ?? "",
    imageURLs: normalizeImageURLList(asset.imageURLs, MAX_CATALOG_IMAGES),
    certificateURLs: normalizeImageURLList(asset.certificateURLs, MAX_CERTIFICATE_IMAGES),
  };
}

export function normalizeImageURLList(value: string[], maxItems = MAX_CATALOG_IMAGES) {
  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean))).slice(
    0,
    maxItems,
  );
}

export function parsePositiveCurrency(value: string) {
  const parsed = Number(value.replace(/[,\s￥¥]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "操作失败，请稍后重试";
}

export async function compressProductImage(file: File) {
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

export function AssetHeader({
  title,
  description,
  leading,
  children,
}: {
  title: string;
  description?: string;
  leading?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex min-h-14 w-full items-center border-b bg-neutral-100 px-4">
      {leading ?? (
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-neutral-500">{description}</p>
          ) : null}
        </div>
      )}
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </header>
  );
}

export function AssetBreadcrumb({
  items,
}: {
  items: Array<{
    label: string;
    to?: string;
  }>;
}) {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${item.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {item.to && !isLast ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className={isLast ? "font-semibold" : undefined}>
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AssetDatalists() {
  return (
    <>
      <datalist id={CATEGORY_DATALIST_ID}>
        <option value="沉香" />
        <option value="古玉" />
        <option value="文化艺术品" />
      </datalist>
      <datalist id={SELLER_DATALIST_ID}>
        <option value="平台" />
        <option value="认证商家" />
        <option value="会员" />
      </datalist>
    </>
  );
}

export function ProductAssetImageUploader({
  title,
  description,
  imageURLs,
  maxImages,
  uploading,
  disabled = false,
  onUpload,
  onRemove,
  onCover,
}: {
  title: string;
  description: string;
  imageURLs: string[];
  maxImages: number;
  uploading: boolean;
  disabled?: boolean;
  onUpload: (files: FileList | null) => void;
  onRemove: (imageURL: string) => void;
  onCover?: (imageURL: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const uploadDisabled = disabled || uploading || imageURLs.length >= maxImages;
  const uploadTile = (
    <label
      className={`flex aspect-square cursor-pointer flex-col items-center justify-center border border-dashed p-3 text-center transition ${
        dragging
          ? "border-sky-500 bg-sky-100"
          : "border-sky-200 bg-sky-50/60 hover:border-sky-400 hover:bg-sky-50"
      } ${uploadDisabled ? "cursor-not-allowed opacity-60" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!uploadDisabled) setDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!uploadDisabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!uploadDisabled) onUpload(event.dataTransfer.files);
      }}
    >
      <span className="flex h-11 w-11 items-center justify-center border border-sky-200 bg-white text-sky-700 shadow-sm">
        {uploading ? (
          <LoaderCircle className="h-5 w-5 animate-spin" />
        ) : (
          <ImagePlus className="h-5 w-5" />
        )}
      </span>
      <span className="mt-3 text-sm font-semibold text-sky-950">
        {disabled
          ? "图片已锁定"
          : uploading
            ? "正在上传"
            : imageURLs.length >= maxImages
              ? "已达上限"
              : "添加图片"}
      </span>
      <span className="mt-1 text-xs leading-5 text-sky-900/60">
        点击或拖拽上传
      </span>
      <input
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={uploadDisabled}
        onChange={(event) => {
          onUpload(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );

  return (
    <div className="grid gap-3">
      <div>
        <div className="text-sm font-medium text-sky-950">
          {title} ({imageURLs.length}/{maxImages})
        </div>
        <p className="text-sm leading-6 text-sky-900/60">{description}</p>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        {imageURLs.map((imageURL, index) => (
          <div
            key={imageURL}
            className="group relative overflow-hidden border border-sky-100 bg-sky-50"
          >
            <img
              src={imageURL}
              alt={`${title} ${index + 1}`}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute left-1 top-1 bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-sky-950 shadow-sm">
              {index === 0 && onCover ? "封面" : index + 1}
            </div>
            {!disabled ? (
              <div className="absolute inset-x-1 top-1 flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                {onCover && index > 0 ? (
                  <button
                    type="button"
                    className="bg-white/95 px-1.5 py-0.5 text-xs font-semibold text-sky-950 shadow-sm"
                    onClick={() => onCover(imageURL)}
                  >
                    设封面
                  </button>
                ) : null}
                <button
                  type="button"
                  className="bg-white/95 px-1.5 py-0.5 text-xs font-semibold text-sky-950 shadow-sm"
                  onClick={() => onRemove(imageURL)}
                >
                  删除
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {uploadTile}
      </div>
    </div>
  );
}

export function ProductAssetPreviewCard({ form }: { form: ProductAssetFormState }) {
  return (
    <div className="overflow-hidden border border-sky-100 bg-white shadow-sm">
      <div className="relative aspect-[4/3] overflow-hidden bg-sky-50">
        {form.imageURLs[0] ? (
          <img
            src={form.imageURLs[0]}
            alt="资产封面预览"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-sky-900/50">
            上传产品图片后显示封面
          </div>
        )}
        <div className="absolute left-3 top-3 border border-white/80 bg-white/90 px-2 py-1 text-xs font-semibold text-sky-950 shadow-sm">
          {normalizeProductAssetCode(form.assetCode) || "资产编号"}
        </div>
        {form.certificateURLs.length > 0 ? (
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
              {form.categoryLabel || "资产类别"}
            </div>
            <h3 className="mt-2 text-xl font-semibold leading-snug text-sky-950">
              {form.name || "资产名称"}
            </h3>
          </div>
          <span className="shrink-0 border border-violet-100 bg-violet-50 px-2 py-1 text-xs font-semibold text-violet-700">
            {form.sellerCategoryLabel || "来源"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 border-t border-sky-100 pt-4 sm:grid-cols-2">
          <div className="flex gap-2 text-sm text-sky-900/70">
            <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
            <span>{form.spec || "规格"}</span>
          </div>
          {form.size ? (
            <div className="flex gap-2 text-sm text-sky-900/70">
              <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
              <span>{form.size}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-5">
          <div className="text-sm text-sky-900/60">会员价</div>
          <div className="mt-1 text-2xl font-semibold text-sky-950">
            {parsePositiveCurrency(form.priceCny)
              ? formatProductAssetPrice(parsePositiveCurrency(form.priceCny))
              : "¥0"}
          </div>
        </div>
        <div className="mt-5 text-sm text-sky-900/70">
          <span className="block truncate">Hash {form.fileHash || "待补"}</span>
        </div>
      </div>
    </div>
  );
}

export function ProductAssetFields({
  form,
  setForm,
  disabled = false,
  chainDisabled = disabled,
  offchainDisabled = disabled,
}: {
  form: ProductAssetFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductAssetFormState>>;
  disabled?: boolean;
  chainDisabled?: boolean;
  offchainDisabled?: boolean;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">资产编号</span>
          <Input
            value={form.assetCode}
            disabled={chainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                assetCode: event.target.value.toUpperCase(),
              }))
            }
            placeholder="例如：PAJ000001"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">资产名称</span>
          <Input
            value={form.name}
            disabled={chainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
            placeholder="例如：和田玉 螭龙玉璧 青灰 宋"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">资产类别</span>
          <Input
            list={CATEGORY_DATALIST_ID}
            value={form.categoryLabel}
            disabled={offchainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                categoryLabel: event.target.value,
              }))
            }
            placeholder="古玉 / 沉香"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">来源标签</span>
          <Input
            list={SELLER_DATALIST_ID}
            value={form.sellerCategoryLabel}
            disabled={offchainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sellerCategoryLabel: event.target.value,
              }))
            }
            placeholder="平台 / 认证商家"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">规格</span>
          <Input
            value={form.spec}
            disabled={offchainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                spec: event.target.value,
              }))
            }
            placeholder="例如：50克"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">尺寸</span>
          <Input
            value={form.size}
            disabled={offchainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                size: event.target.value,
              }))
            }
            placeholder="可缺省"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[0.45fr_0.55fr]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">人民币会员价</span>
          <Input
            inputMode="decimal"
            value={form.priceCny}
            disabled={offchainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priceCny: event.target.value,
              }))
            }
            placeholder="例如：420000"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">PHENIX 价格</span>
          <Input
            inputMode="decimal"
            value={form.pricePhenix}
            disabled={chainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                pricePhenix: event.target.value,
              }))
            }
            placeholder="例如：1200"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[0.45fr_0.55fr]">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">接收钱包地址</span>
          <Input
            value={form.recipient}
            disabled={chainDisabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                recipient: event.target.value,
              }))
            }
            placeholder="0x..."
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">文件包 hash</span>
          <Input
            value={form.fileHash}
            readOnly
            disabled={chainDisabled}
            placeholder="生成并上传文件包后自动写入"
          />
        </label>
      </div>
    </div>
  );
}

export function ProductAssetOffchainFields({
  form,
  setForm,
  disabled = false,
  lockAssetCode = false,
}: {
  form: ProductAssetFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductAssetFormState>>;
  disabled?: boolean;
  lockAssetCode?: boolean;
}) {
  return (
    <div className="grid gap-5">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-sky-950">资产编号</span>
        <Input
          value={form.assetCode}
          disabled={disabled || lockAssetCode}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              assetCode: event.target.value.toUpperCase(),
            }))
          }
          placeholder="例如：PAJ000001"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">资产类别</span>
          <Input
            list={CATEGORY_DATALIST_ID}
            value={form.categoryLabel}
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                categoryLabel: event.target.value,
              }))
            }
            placeholder="古玉 / 沉香"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">来源标签</span>
          <Input
            list={SELLER_DATALIST_ID}
            value={form.sellerCategoryLabel}
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sellerCategoryLabel: event.target.value,
              }))
            }
            placeholder="平台 / 认证商家"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">规格</span>
          <Input
            value={form.spec}
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                spec: event.target.value,
              }))
            }
            placeholder="例如：50克"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-sky-950">尺寸</span>
          <Input
            value={form.size}
            disabled={disabled}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                size: event.target.value,
              }))
            }
            placeholder="可缺省"
          />
        </label>
      </div>

      <label className="grid gap-2 sm:max-w-md">
        <span className="text-sm font-medium text-sky-950">人民币会员价</span>
        <Input
          inputMode="decimal"
          value={form.priceCny}
          disabled={disabled}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              priceCny: event.target.value,
            }))
          }
          placeholder="例如：420000"
        />
      </label>
    </div>
  );
}
