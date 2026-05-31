import type { AppLoadContext } from "react-router";
import { createPublicClient, formatUnits, http } from "viem";

import rwaAbi from "@/abi/rwa.json";
import { normalizeProductAssetCode } from "@/data/product-assets";
import { PHENIX_DECIMALS } from "@/lib/constants";
import {
  resolveRwaCategoryLabel,
  resolveRwaSellerCategoryLabel,
} from "@/lib/rwa";
import {
  RWA_CHAIN,
  RWA_CONTRACT_ADDRESS,
} from "@/lib/rwa-chain-config";
import {
  upsertOnchainAssetSnapshot,
  type OnchainAssetUpsertResult,
} from "@/lib/server/assets.repository";

export type RwaChainSyncResult = {
  ok: true;
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  items: OnchainAssetUpsertResult[];
};

const ASSET_CODE_PATTERN = /\b[A-Z]{2,6}\d{3,}\b/i;

const rwaClient = createPublicClient({
  chain: RWA_CHAIN,
  transport: http(),
});

export async function syncOnchainRwaAssetsToDatabase(
  context: AppLoadContext,
): Promise<RwaChainSyncResult> {
  const data = await rwaClient.readContract({
    address: RWA_CONTRACT_ADDRESS,
    abi: rwaAbi,
    functionName: "getAllRWAs",
  });
  const rwaItems = Array.isArray(data) ? data : [];
  const items: OnchainAssetUpsertResult[] = [];

  for (const rwaItem of rwaItems) {
    const snapshot = await buildOnchainSnapshot(rwaItem);
    items.push(await upsertOnchainAssetSnapshot(context, snapshot));
  }

  return {
    ok: true,
    scanned: rwaItems.length,
    created: items.filter((item) => item.action === "created").length,
    updated: items.filter((item) => item.action === "updated").length,
    skipped: items.filter((item) => item.action === "skipped").length,
    items,
  };
}

async function buildOnchainSnapshot(rwaItem: unknown) {
  const value = rwaItem as {
    tokenId?: bigint | number | string;
    owner?: string;
    tokenURI?: string;
    asset?: {
      name?: string;
      pricePhenix?: bigint | number | string;
      fileHash?: string;
      status?: bigint | number | string;
    };
  };
  const tokenId = stringifyBigNumberish(value.tokenId);
  const tokenIdBigInt = parseTokenId(tokenId);
  const name = String(value.asset?.name ?? "").trim() || `Phenix Asset #${tokenId}`;
  const fileHash = String(value.asset?.fileHash ?? "").trim();
  const tokenURI =
    String(value.tokenURI ?? "").trim() ||
    `https://phenixmcga.com/rwa/metadata?id=${tokenId}&hash=${fileHash}`;
  const pricePhenixRaw = parseBigNumberish(value.asset?.pricePhenix);

  return {
    assetCode: resolveAssetCode(name, tokenId),
    tokenId,
    name,
    owner: String(value.owner ?? "").trim(),
    pricePhenix: formatUnits(pricePhenixRaw, PHENIX_DECIMALS),
    pricePhenixWei: pricePhenixRaw.toString(),
    fileHash,
    tokenURI,
    status: mapRwaStatus(value.asset?.status),
    imageURL: await resolveImageURL(tokenURI, fileHash),
    categoryLabel: resolveRwaCategoryLabel(name, tokenIdBigInt),
    sellerCategoryLabel: resolveRwaSellerCategoryLabel(tokenIdBigInt),
    spec: "待维护",
    size: "待维护",
  };
}

function resolveAssetCode(name: string, tokenId: string) {
  const matched = name.match(ASSET_CODE_PATTERN)?.[0];

  if (matched) {
    return normalizeProductAssetCode(matched);
  }

  return `RWA${tokenId.padStart(6, "0")}`;
}

async function resolveImageURL(tokenURI: string, fileHash: string) {
  const fallback = buildFallbackImageURL(fileHash);

  if (!/^https?:\/\//i.test(tokenURI)) {
    return fallback;
  }

  try {
    const response = await fetch(tokenURI, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) return fallback;

    const metadata = await response.json() as { image?: unknown };
    const imageURL = typeof metadata.image === "string" ? metadata.image.trim() : "";
    return imageURL || fallback;
  } catch {
    return fallback;
  }
}

function buildFallbackImageURL(fileHash: string) {
  return fileHash
    ? `https://rwa-cdn.phenixmcga.com/${fileHash}/cover.png`
    : "";
}

function stringifyBigNumberish(value: unknown) {
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return "0";
}

function parseBigNumberish(value: unknown) {
  try {
    return BigInt(stringifyBigNumberish(value));
  } catch {
    return 0n;
  }
}

function parseTokenId(value: string) {
  try {
    return BigInt(value);
  } catch {
    return 0n;
  }
}

function mapRwaStatus(value: unknown): "published" | "unpublished" | "burned" {
  const status = Number(stringifyBigNumberish(value));

  if (status === 1) return "unpublished";
  if (status === 2) return "burned";
  return "published";
}
