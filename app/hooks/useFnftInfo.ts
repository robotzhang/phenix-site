import { useReadContract } from "wagmi";
import fnftAbi from "@/abi/fnft.json";
import { FNFT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";
import { formatUnits } from "viem";
import { base } from "viem/chains";

export function useFnftInfo() {
  const priceQuery = useReadContract({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    functionName: "price",
    chainId: base.id,
    query: {
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const totalMintedQuery = useReadContract({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    functionName: "totalMinted",
    chainId: base.id,
    query: {
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const refresh = async () => {
    await Promise.all([priceQuery.refetch(), totalMintedQuery.refetch()]);
  };

  return {
    price: priceQuery.data ? formatUnits(priceQuery.data as bigint, USDT_DECIMALS) : "0",
    totalMinted: totalMintedQuery.data ? Number(totalMintedQuery.data) : 0,
    isPriceLoading: priceQuery.isLoading || priceQuery.isFetching,
    isTotalMintedLoading: totalMintedQuery.isLoading || totalMintedQuery.isFetching,
    refresh,
  };
}
