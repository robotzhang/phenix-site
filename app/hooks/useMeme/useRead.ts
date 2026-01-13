import { useMemo } from "react";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import memeAbi from "@/abi/meme.json";
import erc20Abi from "@/abi/erc20.json";
import { MEME_ADDRESS, USDT_ADDRESS } from "@/lib/constants";
import type { Stage } from "./types";

export function useRead() {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const stageRead = useReadContract({ abi: memeAbi, address: MEME_ADDRESS, functionName: "currentStage" });
  const currentStage = stageRead.data as Stage | undefined;

  const minedRead = useReadContract({ abi: memeAbi, address: MEME_ADDRESS, functionName: "totalMemeMinted" });
  const capRead = useReadContract({ abi: memeAbi, address: MEME_ADDRESS, functionName: "TOTAL_PHENIX_CAP" });
  const perMemeRead = useReadContract({ abi: memeAbi, address: MEME_ADDRESS, functionName: "PHENIX_PER_MEME" });
  const redeemEnabledRead = useReadContract({ abi: memeAbi, address: MEME_ADDRESS, functionName: "redeemEnabled" });

  const allowanceRead = useReadContract({
    abi: erc20Abi,
    address: USDT_ADDRESS,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", MEME_ADDRESS],
  });

  const minedValue = useMemo(() => BigInt(minedRead.data?.toString() ?? "0"), [minedRead.data]);
  const capValue = useMemo(() => BigInt(capRead.data?.toString() ?? "0"), [capRead.data]);
  const perMemeValue = useMemo(() => BigInt(perMemeRead.data?.toString() ?? "0"), [perMemeRead.data]);

  return {
    address,
    publicClient,

    currentStage,
    minedValue,
    capValue,
    perMemeValue,
    redeemEnabled: redeemEnabledRead.data,

    allowance: allowanceRead.data,

    isLoading: {
      price: stageRead.isLoading,
      minted: minedRead.isLoading,
      cap: capRead.isLoading,
    },
  };
}
