import { useQuery } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import fnftAbi from "@/abi/fnft.json";
import { FNFT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";
import { formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

// usage: const { infoQuery } = useFnftInfo();
export function useFnftInfo() {
  const priceQuery = useReadContract({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    functionName: "price",
    chainId: baseSepolia.id,
  });

  const totalMintedQuery = useReadContract({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    functionName: "totalMinted",
    chainId: baseSepolia.id,
  });

  const infoQuery = useQuery({
    queryKey: ["fnft-info"],
    queryFn: async () => {
      const rawPrice = priceQuery.data as bigint;
      const rawTotal = totalMintedQuery.data as bigint;

      return {
        price: rawPrice ? formatUnits(rawPrice, USDT_DECIMALS) : "0",
        totalMinted: rawTotal ? Number(rawTotal) : 0,
      };
    },
    enabled: !!priceQuery.data && !!totalMintedQuery.data,
    refetchInterval: 15000,
  });

  return {
    infoQuery,
  };
}
