import { useEffect, useState } from "react";
import {
  cloneRwaAdminMetadataMap,
  emptyRwaAdminStorageDocument,
  RWA_ADMIN_IMAGE_ROUTE,
  normalizeRwaAdminStorageDocument,
  RWA_ADMIN_STORAGE_ROUTE,
  type RwaAdminMetadataInput,
  type RwaAdminMetadataMap,
} from "./rwa-admin-storage.shared";

let metadataCache: RwaAdminMetadataMap = {};
let metadataLoaded = false;
let pendingRefresh: Promise<RwaAdminMetadataMap> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

async function readRemoteMetadata() {
  const response = await fetch(RWA_ADMIN_STORAGE_ROUTE, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`读取资产标签存储失败 (${response.status})`);
  }

  return normalizeRwaAdminStorageDocument(await response.json());
}

async function refreshMetadataCache(force = false) {
  if (!force && metadataLoaded) {
    return metadataCache;
  }

  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    try {
      const document = await readRemoteMetadata();
      metadataCache = cloneRwaAdminMetadataMap(document.items);
      metadataLoaded = true;
    } catch (error) {
      if (!metadataLoaded) {
        metadataCache = {};
        metadataLoaded = true;
      }

      if (import.meta.env.DEV) {
        console.warn("Failed to refresh RWA admin metadata", error);
      }
    } finally {
      pendingRefresh = null;
      notifyListeners();
    }

    return metadataCache;
  })();

  return pendingRefresh;
}

async function mutateMetadata(
  method: "POST" | "DELETE",
  tokenId: bigint | string,
  payload?: Partial<RwaAdminMetadataInput>,
) {
  const response = await fetch(RWA_ADMIN_STORAGE_ROUTE, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      tokenId: tokenId.toString(),
      ...(payload ?? {}),
    }),
  });

  if (!response.ok) {
    const fallback = `写入资产标签存储失败 (${response.status})`;

    try {
      const result = await response.json();
      const message =
        result && typeof result === "object" && "error" in result
          ? String((result as { error?: unknown }).error || fallback)
          : fallback;

      throw new Error(message);
    } catch {
      throw new Error(fallback);
    }
  }

  const document = normalizeRwaAdminStorageDocument(await response.json());
  metadataCache = cloneRwaAdminMetadataMap(document.items);
  metadataLoaded = true;
  notifyListeners();

  return true;
}

export function getRwaAdminMetadataMap() {
  return cloneRwaAdminMetadataMap(metadataCache);
}

export async function refreshRwaAdminMetadataMap() {
  return refreshMetadataCache(true);
}

export async function saveRwaAdminMetadata(
  tokenId: bigint | string,
  metadata: RwaAdminMetadataInput,
) {
  const document = await mutateMetadata("POST", tokenId, metadata);
  return document;
}

export async function removeRwaAdminMetadata(tokenId: bigint | string) {
  return mutateMetadata("DELETE", tokenId);
}

export async function uploadRwaAdminImage(
  file: Blob,
  kind: "product" | "certificate" = "product",
) {
  const searchParams = new URLSearchParams();

  searchParams.set("kind", kind);

  const response = await fetch(`${RWA_ADMIN_IMAGE_ROUTE}?${searchParams}`, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      Accept: "application/json",
    },
    body: file,
  });

  if (!response.ok) {
    const fallback = `上传产品图片失败 (${response.status})`;

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

  const result = await response.json();
  const imageURL =
    result && typeof result === "object" && "imageURL" in result
      ? String((result as { imageURL?: unknown }).imageURL || "")
      : "";

  if (!imageURL) {
    throw new Error("上传产品图片失败，未返回图片地址");
  }

  return imageURL;
}

export function useRwaAdminMetadataMap() {
  const [metadataMap, setMetadataMap] = useState<RwaAdminMetadataMap>(
    () => getRwaAdminMetadataMap(),
  );

  useEffect(() => {
    let active = true;

    const sync = () => {
      if (!active) return;
      setMetadataMap(getRwaAdminMetadataMap());
    };

    listeners.add(sync);
    sync();
    void refreshMetadataCache(true);

    return () => {
      active = false;
      listeners.delete(sync);
    };
  }, []);

  return metadataMap;
}

export function createEmptyRwaAdminStorageDocument() {
  return emptyRwaAdminStorageDocument();
}
