import { useReadContract } from "wagmi";
import abi from "@/abi/rwa.json";
import { PHENIX_DECIMALS } from "@/lib/constants";
import {
  resolveRwaCategoryLabel,
  resolveRwaSellerCategoryLabel,
} from "@/lib/rwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import {
  RWA_CHAIN_ID,
  RWA_CONTRACT_ADDRESS,
  RWA_EXPLORER_TOKEN_BASE,
} from "@/lib/rwa-chain-config";
import { formatUnits } from "viem";

export interface RWA {
  tokenId: bigint;
  owner: `0x${string}`;
  categoryLabel: string;
  sellerCategoryLabel: string;
  tokenURI: string;
  explorerURL: string;
  imageURL: string;
  imageURLs: string[];
  asset: {
    name: string;
    pricePhenix: bigint;
    pricePhenixFormatted: string;
    fileHash: string;
    status: number;
  };
}

function formatRwaInfo(
  rwaData: any,
  adminMetadataMap: Record<string, {
    categoryLabel: string;
    sellerCategoryLabel: string;
    imageURLs?: string[];
    imageURL?: string;
  }> = {},
): RWA {
  const tokenIdKey = rwaData.tokenId?.toString?.() ?? String(rwaData.tokenId);
  const adminMetadata = adminMetadataMap[tokenIdKey];
  const fallbackImageURL = `https://rwa-cdn.phenixmcga.com/${rwaData.asset.fileHash}/cover.png`;
  const imageURLs =
    adminMetadata?.imageURLs && adminMetadata.imageURLs.length > 0
      ? adminMetadata.imageURLs
      : [adminMetadata?.imageURL || fallbackImageURL];
  const tokenURI = typeof rwaData.tokenURI === "string" ? rwaData.tokenURI : "";

  return {
    ...rwaData,
    tokenURI,
    explorerURL: `${RWA_EXPLORER_TOKEN_BASE}${encodeURIComponent(tokenIdKey)}`,
    categoryLabel: adminMetadata?.categoryLabel ?? resolveRwaCategoryLabel(rwaData.asset.name, rwaData.tokenId),
    sellerCategoryLabel: adminMetadata?.sellerCategoryLabel ?? resolveRwaSellerCategoryLabel(rwaData.tokenId),
    imageURL: imageURLs[0],
    imageURLs,
    asset: {
      ...rwaData.asset,
      pricePhenixFormatted: formatUnits(
        rwaData.asset.pricePhenix,
        PHENIX_DECIMALS,
      ),
    },
  };
}

/* ===========================
  RWA 列表
=========================== */

export function useRwaList() {
  const adminMetadataMap = useRwaAdminMetadataMap();
  const { data, isLoading, error, refetch } = useReadContract({
    address: RWA_CONTRACT_ADDRESS,
    abi,
    chainId: RWA_CHAIN_ID,
    functionName: "getAllRWAs",
  });
  //
  return {
    data: data ? (data as any[]).map((i) => formatRwaInfo(i, adminMetadataMap)) : [],
    loading: isLoading,
    error,
    refetch,
  };
}

/* ===========================
  RWA 详情
=========================== */

export function useRwaDetail(tokenId?: string) {
  const adminMetadataMap = useRwaAdminMetadataMap();
  const { data, isLoading, error } = useReadContract({
    address: RWA_CONTRACT_ADDRESS,
    abi,
    chainId: RWA_CHAIN_ID,
    functionName: "getRWA",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    data: data ? (formatRwaInfo(data, adminMetadataMap) as RWA) : null,
    loading: isLoading,
    error,
  };
}
