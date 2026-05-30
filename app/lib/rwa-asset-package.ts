import { strToU8, zipSync, type Zippable } from "fflate";

import { normalizeProductAssetCode } from "@/data/product-assets";
import { RWA_ASSET_PACKAGE_ROUTE } from "@/lib/rwa-admin-storage.shared";

const ZERO_DATE = new Date(0);
const SUPPORTED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const IMAGE_TYPE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface RwaAssetPackageUploadResult {
  fileHash: string;
  packageHash: string;
  packageKey: string;
  packageSize: string;
  packageURL: string;
}

type AssetPackageSource = {
  role: "product" | "certificate";
  url: string;
  index: number;
};

type AssetPackageEntry = AssetPackageSource & {
  path: string;
  bytes: Uint8Array<ArrayBuffer>;
  contentType: string;
  size: number;
  sha256: string;
};

export async function createAndUploadRwaAssetPackage({
  assetCode,
  imageURLs,
  certificateURLs,
}: {
  assetCode: string;
  imageURLs: string[];
  certificateURLs: string[];
}) {
  const normalizedAssetCode = normalizeProductAssetCode(assetCode);
  const sources = [
    ...imageURLs.map((url, index) => ({ role: "product" as const, url: url.trim(), index })),
    ...certificateURLs.map((url, index) => ({
      role: "certificate" as const,
      url: url.trim(),
      index,
    })),
  ].filter((item) => item.url.trim());

  if (!normalizedAssetCode) {
    throw new Error("请先填写资产编号");
  }

  if (!sources.some((source) => source.role === "product")) {
    throw new Error("请至少上传 1 张产品图片");
  }

  const entries = await Promise.all(sources.map(fetchPackageEntry));
  const packageBytes = buildAssetPackageZip(normalizedAssetCode, entries);
  const response = await fetch(
    `${RWA_ASSET_PACKAGE_ROUTE}?assetCode=${encodeURIComponent(normalizedAssetCode)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/zip",
        Accept: "application/json",
      },
      body: new Blob([toExactArrayBuffer(packageBytes)], {
        type: "application/zip",
      }),
    },
  );

  if (!response.ok) {
    const fallback = `上传文件包失败 (${response.status})`;

    try {
      const result = await response.json();
      throw new Error(
        result && typeof result === "object" && "error" in result
          ? String((result as { error?: unknown }).error || fallback)
          : fallback,
      );
    } catch (error) {
      if (error instanceof Error && error.message !== fallback) {
        throw error;
      }

      throw new Error(fallback);
    }
  }

  return normalizePackageUploadResult(await response.json());
}

async function fetchPackageEntry(source: AssetPackageSource): Promise<AssetPackageEntry> {
  const response = await fetch(source.url, {
    cache: "no-store",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`读取图片失败：${source.url}`);
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = resolveImageExtension(source.url, contentType);

  if (!extension) {
    throw new Error(`文件不是支持的图片格式：${source.url}`);
  }

  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const folder = source.role === "product" ? "product" : "certificates";
  const path = `${folder}/${String(source.index + 1).padStart(2, "0")}.${extension}`;

  return {
    ...source,
    path,
    bytes,
    contentType: contentType || `image/${extension === "jpg" ? "jpeg" : extension}`,
    size: bytes.byteLength,
    sha256: await sha256Hex(buffer),
  };
}

function buildAssetPackageZip(assetCode: string, entries: AssetPackageEntry[]) {
  const manifest = {
    schema: "phenix.rwa.asset-package.v1",
    assetCode,
    files: entries.map((entry) => ({
      role: entry.role,
      index: entry.index + 1,
      path: entry.path,
      sourceURL: entry.url,
      contentType: entry.contentType,
      size: entry.size,
      sha256: entry.sha256,
    })),
  };
  const zipEntries: Zippable = {
    "manifest.json": [
      strToU8(`${JSON.stringify(manifest, null, 2)}\n`),
      { mtime: ZERO_DATE, level: 0 },
    ],
  };

  for (const entry of entries) {
    zipEntries[entry.path] = [entry.bytes, { mtime: ZERO_DATE, level: 0 }];
  }

  return zipSync(zipEntries, { mtime: ZERO_DATE, level: 0 });
}

function resolveImageExtension(url: string, contentType: string) {
  const extensionFromType = IMAGE_TYPE_EXTENSIONS[contentType];

  if (extensionFromType) {
    return extensionFromType;
  }

  const path = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  const extension = path.match(/\.([a-z0-9]+)$/)?.[1] ?? "";

  if (!SUPPORTED_IMAGE_EXTENSIONS.has(extension)) {
    return "";
  }

  return extension === "jpeg" ? "jpg" : extension;
}

async function sha256Hex(buffer: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function toExactArrayBuffer(bytes: Uint8Array<ArrayBuffer>): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function normalizePackageUploadResult(input: unknown): RwaAssetPackageUploadResult {
  const value = input && typeof input === "object" ? input as Partial<RwaAssetPackageUploadResult> : {};
  const fileHash = typeof value.fileHash === "string" ? value.fileHash : "";
  const packageHash = typeof value.packageHash === "string" ? value.packageHash : fileHash;
  const packageKey = typeof value.packageKey === "string" ? value.packageKey : "";
  const packageSize = typeof value.packageSize === "string" ? value.packageSize : "";
  const packageURL = typeof value.packageURL === "string" ? value.packageURL : "";

  if (!fileHash || !packageHash || !packageKey || !packageSize || !packageURL) {
    throw new Error("上传文件包失败，服务端返回不完整");
  }

  return {
    fileHash,
    packageHash,
    packageKey,
    packageSize,
    packageURL,
  };
}
