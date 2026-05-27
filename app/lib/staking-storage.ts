import { useEffect, useState } from "react";

import {
  cloneStakingStorageDocument,
  emptyStakingStorageDocument,
  normalizeStakingStorageDocument,
  STAKING_STORAGE_ROUTE,
  type CreateBuybackPayload,
  type CreateStakePayload,
  type StakingStorageDocument,
} from "./staking-storage.shared";

let storageCache: StakingStorageDocument = emptyStakingStorageDocument();
let storageLoaded = false;
let pendingRefresh: Promise<StakingStorageDocument> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

async function readRemoteStorage() {
  const response = await fetch(STAKING_STORAGE_ROUTE, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`读取权益周期与转让/退出服务申请队列失败 (${response.status})`);
  }

  return normalizeStakingStorageDocument(await response.json());
}

async function refreshStorage(force = false) {
  if (!force && storageLoaded) {
    return storageCache;
  }

  if (pendingRefresh) {
    return pendingRefresh;
  }

  pendingRefresh = (async () => {
    try {
      storageCache = await readRemoteStorage();
      storageLoaded = true;
    } catch (error) {
      if (!storageLoaded) {
        storageCache = emptyStakingStorageDocument();
        storageLoaded = true;
      }

      if (import.meta.env.DEV) {
        console.warn("Failed to refresh staking storage", error);
      }
    } finally {
      pendingRefresh = null;
      notifyListeners();
    }

    return storageCache;
  })();

  return pendingRefresh;
}

async function mutateStorage(payload: CreateStakePayload | CreateBuybackPayload) {
  const response = await fetch(STAKING_STORAGE_ROUTE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallback = `写入权益周期与转让/退出服务申请队列失败 (${response.status})`;

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

  storageCache = normalizeStakingStorageDocument(await response.json());
  storageLoaded = true;
  notifyListeners();

  return cloneStakingStorageDocument(storageCache);
}

export function getStakingStorageDocument() {
  return cloneStakingStorageDocument(storageCache);
}

export async function refreshStakingStorageDocument() {
  return refreshStorage(true);
}

export async function createStakeRecord(payload: CreateStakePayload) {
  return mutateStorage(payload);
}

export async function createBuybackRequest(payload: CreateBuybackPayload) {
  return mutateStorage(payload);
}

export function useStakingStorageDocument() {
  const [document, setDocument] = useState<StakingStorageDocument>(
    () => getStakingStorageDocument(),
  );

  useEffect(() => {
    let active = true;

    const sync = () => {
      if (!active) return;
      setDocument(getStakingStorageDocument());
    };

    listeners.add(sync);
    sync();
    void refreshStorage(true);

    return () => {
      active = false;
      listeners.delete(sync);
    };
  }, []);

  return document;
}
