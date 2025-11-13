import { useReadContract, useWriteContract } from "wagmi";
import type { Address } from "viem";
import fnftAbi from "@/abi/fnft.json";
import { FNFT_ADDRESS } from "@/lib/constants";

export function useFNFT() {
  const { data: price, refetch: refetchPrice } = useReadContract({
    address: FNFT_ADDRESS as Address,
    abi: fnftAbi,
    functionName: "price",
  });

  const { data: totalMinted, refetch: refetchTotal } = useReadContract({
    address: FNFT_ADDRESS as Address,
    abi: fnftAbi,
    functionName: "totalMinted",
  });

  const { writeContractAsync: buy } = useWriteContract();
  const { writeContractAsync: redeem } = useWriteContract();

  async function buyFNFT(args: any[] = []) {
    return await buy({
      address: FNFT_ADDRESS as Address,
      abi: fnftAbi,
      functionName: "buy",
      args,
    });
  }

  async function redeemFNFT(args: any[] = []) {
    return await redeem({
      address: FNFT_ADDRESS as Address,
      abi: fnftAbi,
      functionName: "redeem",
      args,
    });
  }

  return {
    price,
    totalMinted,
    refetchPrice,
    refetchTotal,
    buy: buyFNFT,
    redeem: redeemFNFT,
  };
}
