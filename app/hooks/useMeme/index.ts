import { useState } from "react";
import { useReadContract } from "wagmi";

import memeAbi from "@/abi/meme.json";
import { TEST_MEME_ADDRESS as MEME_ADDRESS } from "@/lib/constants";

import { useSafeContractWrite } from "../useSafeContractWrite";
import { useGuard } from "../useGuard";

import { useRead } from "./useRead";
import { useDerived } from "./useDerived";
import { useGuards } from "./useGuards";
import { useActions } from "./useActions";

export function useMeme() {
  const [amount, setAmount] = useState("1");

  const { write } = useSafeContractWrite();
  const guardHooks = useGuard();

  // =======================
  // Read: On-chain state
  // =======================

  const {
    address,
    publicClient,
    currentStage,
    minedValue,
    capValue,
    perMemeValue,
    redeemEnabled,
    allowance,
    isLoading,
  } = useRead();

  const previewRead = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "previewMine",
    args: [BigInt(amount || "0")],
    query: { enabled: Boolean(amount) && Number(amount) > 0 },
  });

  const nextPreviewRead = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "previewMine",
    args: [1n],
  });

  // =======================
  // Derived state
  // =======================

  const derived = useDerived({
    amount,
    currentStage,
    minedValue,
    capValue,
    perMemeValue,
    preview: previewRead.data as readonly [bigint, bigint] | undefined,
    nextPreview: nextPreviewRead.data as readonly [bigint, bigint] | undefined,
    redeemEnabled: redeemEnabled as boolean | false,
  });

  // =======================
  // Guard layer
  // =======================

  const guard = useGuards({
    guardHooks,
    amount,
    maxBuyable: derived.remaining,
    minedValue,
    capValue,
  });

  // =======================
  // Write: Actions
  // =======================

  const { buy, redeem } = useActions({
    address,
    publicClient,
    write,
    guard,
    amount,
    rawUsdtCost: derived.rawUsdtCost,
    allowance,
    canRedeem: derived.canRedeem,
  });

  return {
    // User input
    amount,
    setAmount,

    // Loading
    isLoading,

    // Chain state
    price: derived.price,
    mined: minedValue,
    cap: derived.phenixCapFormatted,
    phenixCap: derived.phenixCapFormatted,
    cost: derived.cost,
    remaining: derived.remaining,

    // Actions
    buy,
    redeem,

    // Guards
    guard,

    // Redeem
    canRedeem: derived.canRedeem,

    // Advanced metrics
    nextPrice: derived.nextPrice,
    maxBuyable: derived.remaining,
    progressPercent: derived.progressPercent,

    // Human readable
    minedFormatted: derived.minedFormatted,
    remainingFormatted: derived.remainingFormatted,
  };
}
