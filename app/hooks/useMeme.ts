import { useCallback, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  usePublicClient,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";

import memeAbi from "@/abi/meme.json";
import erc20Abi from "@/abi/erc20.json";

import {
  MEME_ADDRESS,
  USDT_ADDRESS,
  USDT_DECIMALS,
} from "@/lib/constants";

import { useSafeContractWrite } from "./useSafeContractWrite";
import { useGuard } from "./useGuard";

/**
 * MEME Domain Hook
 * Production-grade contract interface
 */
export function useMeme() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { write } = useSafeContractWrite();
  const guardHooks = useGuard();

  const [amount, setAmount] = useState("1");

  // =======================
  // Read: On-chain state
  // =======================
  const { data: price, isLoading: isPriceLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "price",
  });

  const { data: mined, isLoading: isMinedLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "totalMined",
  });

  const { data: cap, isLoading: isCapLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "MAX_SUPPLY",
  });

  // =======================
  // Derived state
  // =======================
  const cost = useMemo(() => {
    if (!price) return "0";
    const total = BigInt(price?.toString()) * BigInt(amount || 0);
    return formatUnits(total, USDT_DECIMALS);
  }, [price, amount]);

  // =======================
  // Guard layer
  // =======================
  const guard = useMemo(() => {
    if (!guardHooks.ready)
      return { canBuy: false, reason: guardHooks.reason };

    if (!amount || Number(amount) <= 0)
      return { canBuy: false, reason: "Invalid amount" };

    if (mined && cap && BigInt(mined?.toString()) >= BigInt(cap.toString()))
      return { canBuy: false, reason: "Mining finished" };

    return { canBuy: true as const };
  }, [guardHooks, amount, mined, cap]);

  // =======================
  // Write: Buy MEME
  // =======================
  const buy = useCallback(async () => {
    if (!guard.canBuy || !address || !publicClient) return;

    const memeAmount = parseUnits(amount, 0);

    // 1. Simulate before sending tx
    const simulation = await publicClient.simulateContract({
      address: MEME_ADDRESS,
      abi: memeAbi,
      functionName: "buyMeme",
      args: [memeAmount],
      account: address,
    });

    // 2. Safe transaction pipeline
    await write(simulation.request);
  }, [guard, amount, address, publicClient, write]);

  return {
    // User input
    amount,
    setAmount,

    // Loading
    isLoading: {
      price: isPriceLoading,
      minted: isMinedLoading,
      cap: isCapLoading,
    },

    // Chain state
    price,
    mined,
    cap,
    cost,

    // Actions
    buy,

    // Guards
    guard,
  };
}
