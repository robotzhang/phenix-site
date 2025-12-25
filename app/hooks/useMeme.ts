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
  PHENIX_DECIMALS,
  USDT_ADDRESS,
  USDT_DECIMALS,
} from "@/lib/constants";

import { useSafeContractWrite } from "./useSafeContractWrite";
import { useGuard } from "./useGuard";

/**
 * MEME Domain Hook
 * Production-grade contract interface
 */

type Stage = {
  phenixStart: bigint;
  phenixEnd: bigint;
  priceUsdt: bigint;
};

export function useMeme() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { write } = useSafeContractWrite();
  const guardHooks = useGuard();

  const [amount, setAmount] = useState("1");

  // =======================
  // Read: On-chain state
  // =======================
  const stageRead = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "currentStage",
  });

  const currentStage = stageRead.data as Stage | undefined;

  const price = useMemo(() => {
    if (!currentStage) return "0";
    return formatUnits(currentStage.priceUsdt, USDT_DECIMALS);
  }, [currentStage]);

  const { data: mined, isLoading: isMinedLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "totalMined",
  });

  const { data: phenixCap, isLoading: isCapLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "TOTAL_PHENIX_CAP",
  });

  const minedValue = useMemo(() => {
    try {
      return BigInt(mined?.toString() ?? "0");
    } catch {
      return 0n;
    }
  }, [mined]);

  const capValue = useMemo(() => {
    try {
      return BigInt(phenixCap?.toString() ?? "0");
    } catch {
      return 0n;
    }
  }, [phenixCap]);

  // =======================
  // Derived state
  // =======================
  const cost = useMemo(() => {
    if (!currentStage || !amount) return "0";

    try {
      const memeAmount = parseUnits(amount, 18);
      const memeHuman = memeAmount / 10n ** 18n;
      const totalUsdt = memeHuman * currentStage.priceUsdt;

      return formatUnits(totalUsdt, USDT_DECIMALS);
    } catch {
      return "0";
    }
  }, [currentStage, amount]);

  // =======================
  // Advanced derived state
  // =======================
  const nextPrice = useMemo(() => {
    if (!currentStage) return null;
    return formatUnits(currentStage.priceUsdt, USDT_DECIMALS);
  }, [currentStage]);

  const maxBuyable = useMemo(() => {
    if (!capValue || !minedValue) return "0";

    const remaining = capValue - minedValue;
    const perMeme = 500n * 10n ** 18n;
    const memeLeft = remaining / perMeme;

    return memeLeft.toString();
  }, [capValue, minedValue]);

  const progressPercent = useMemo(() => {
    if (!capValue || !minedValue || capValue === 0n) return 0;
    return Number((minedValue * 10000n) / capValue) / 100;
  }, [capValue, minedValue]);

  // =======================
  // Guard layer
  // =======================
  const guard = useMemo(() => {
    if (!guardHooks.ready)
      return { canBuy: false, reason: guardHooks.reason };

    if (!amount || Number(amount) <= 0)
      return { canBuy: false, reason: "Invalid amount" };

    if (maxBuyable && Number(amount) > Number(maxBuyable))
      return { canBuy: false, reason: "Exceeds remaining supply" };

    if (minedValue >= capValue)
      return { canBuy: false, reason: "Mining finished" };

    return { canBuy: true as const };
  }, [guardHooks, amount, maxBuyable, minedValue, capValue]);

  // =======================
  // Write: Buy MEME
  // =======================
  const buy = useCallback(async () => {
    if (!guard.canBuy || !address || !publicClient) return;

    const memeAmount = parseUnits(amount, 0);

    const simulation = await publicClient.simulateContract({
      address: MEME_ADDRESS,
      abi: memeAbi,
      functionName: "mine",
      args: [memeAmount],
      account: address,
    });

    await write(simulation.request);
  }, [guard, amount, address, publicClient, write]);

  //
  const phenixCapFormatted = useMemo(() => {
    try {
      const cap = BigInt(phenixCap?.toString() ?? "0");
      return formatUnits(cap, PHENIX_DECIMALS);
    } catch {
      return "0";
    }
  }, [phenixCap]);

  const memeCapFormatted = useMemo(() => {
    try {
      const cap = BigInt(phenixCap?.toString() ?? "0");
      const memeCap = cap / (500n * 10n ** 18n);
      return memeCap.toString();
    } catch {
      return "0";
    }
  }, [phenixCap]);
  //
  return {
    // User input
    amount,
    setAmount,

    // Loading
    isLoading: {
      price: stageRead.isLoading,
      minted: isMinedLoading,
      cap: isCapLoading,
    },

    // Chain state
    price,
    mined: minedValue,
    cap: memeCapFormatted,
    phenixCap: phenixCapFormatted,
    cost,

    // Actions
    buy,

    // Guards
    guard,

    // Advanced metrics
    nextPrice,
    maxBuyable,
    progressPercent,
  };
}
