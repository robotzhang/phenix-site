import { useReadContract } from "wagmi";
import { base } from "viem/chains";
import abi from "@/abi/rwa.json";
import { PHENIX_DECIMALS, RWA_ADDRESS } from "@/lib/constants";
import {
  resolveRwaCategoryLabel,
  resolveRwaSellerCategoryLabel,
} from "@/lib/rwa";
import { useRwaAdminMetadataMap } from "@/lib/rwa-admin-storage";
import { formatUnits } from "viem";

export interface RWA {
  tokenId: bigint;
  owner: `0x${string}`;
  categoryLabel: string;
  sellerCategoryLabel: string;
  tokenURI: string;
  imageURL: string;
  asset: {
    name: string;
    pricePhenix: bigint;
    pricePhenixFormatted: string;
    fileHash: string;
    status: number;
  };
}

function formatRwaInfo(rwaData: any, adminMetadataMap: Record<string, { categoryLabel: string; sellerCategoryLabel: string }> = {}): RWA {
  const tokenIdKey = rwaData.tokenId?.toString?.() ?? String(rwaData.tokenId);
  const adminMetadata = adminMetadataMap[tokenIdKey];

  return {
    ...rwaData,
    categoryLabel: adminMetadata?.categoryLabel ?? resolveRwaCategoryLabel(rwaData.asset.name, rwaData.tokenId),
    sellerCategoryLabel: adminMetadata?.sellerCategoryLabel ?? resolveRwaSellerCategoryLabel(rwaData.tokenId),
    imageURL: `https://rwa-cdn.phenixmcga.com/${rwaData.asset.fileHash}/cover.png`,
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
    address: RWA_ADDRESS,
    abi,
    chainId: base.id,
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
    address: RWA_ADDRESS,
    abi,
    chainId: base.id,
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
