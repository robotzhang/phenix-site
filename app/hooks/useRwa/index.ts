import { useReadContract } from "wagmi";
import abi from "@/abi/rwa.json";
import { PHENIX_DECIMALS, TEST_RWA_ADDRESS as RWA_ADDRESS } from "@/lib/constants";
import { formatUnits } from "viem";

export interface RWA {
  tokenId: bigint;
  owner: `0x${string}`;
  tokenURI: string;
  imageURL: string;
  asset: {
    name: string;
    pricePhenix: bigint;
    pricePhenixFormatted: string;
    fileHash: `0x${string}`;
    status: number;
  };
}

function formatRwaInfo(rwaData: any): RWA {
  return {
    ...rwaData,
    imageURL: `https://rwa-cdn.phenixmcga.com/${rwaData.asset.fileHash}/cover.png`,
    asset: {
      ...rwaData.asset,
      pricePhenixFormatted: formatUnits(rwaData.asset.pricePhenix, PHENIX_DECIMALS),
    },
  };
}

/* ===========================
  RWA 列表
=========================== */

export function useRwaList() {
  const { data, isLoading, error } = useReadContract({
    address: RWA_ADDRESS,
    abi,
    functionName: "getAllRWAs",
  });
  //
  return {
    data: data ? (data as any[]).map((i) => formatRwaInfo(i)) : [],
    loading: isLoading,
    error,
  };
}

/* ===========================
  RWA 详情
=========================== */

export function useRwaDetail(tokenId?: string) {
  const { data, isLoading, error } = useReadContract({
    address: RWA_ADDRESS,
    abi,
    functionName: "getRWA",
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!tokenId },
  });

  return {
    data: data ? formatRwaInfo(data) as RWA : null,
    loading: isLoading,
    error,
  };
}
