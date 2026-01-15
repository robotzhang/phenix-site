import { useReadContract } from "wagmi";
import abi from "@/abi/rwa.json";
import { TEST_RWA_ADDRESS as RWA_ADDRESS } from "@/lib/constants";

export interface RWA {
  tokenId: bigint;
  owner: `0x${string}`;
  tokenURI: string;
  asset: {
    name: string;
    pricePhenix: bigint;
    fileHash: `0x${string}`;
    status: number;
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

  return {
    data: (data ?? []) as RWA[],
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
    data: (data ?? null) as RWA | null,
    loading: isLoading,
    error,
  };
}
