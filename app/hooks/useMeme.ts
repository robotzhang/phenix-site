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

  const { data: mined, isLoading: isMinedLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "totalPhenixMined",
  });

  const { data: totalMemeMinted } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "totalMemeMinted",
  });

  const { data: phenixCap, isLoading: isCapLoading } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "TOTAL_PHENIX_CAP",
  });

  const { data: phenixPerMeme } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "PHENIX_PER_MEME",
  });

  const minedValue = useMemo(() => {
    try {
      return BigInt(mined?.toString() ?? "0");
    } catch {
      return 0n;
    }
  }, [mined]);

  const memeMintedValue = useMemo(() => {
    try {
      return BigInt(totalMemeMinted?.toString() ?? "0");
    } catch {
      return 0n;
    }
  }, [totalMemeMinted]);

  const capValue = useMemo(() => {
    try {
      return BigInt(phenixCap?.toString() ?? "0");
    } catch {
      return 0n;
    }
  }, [phenixCap]);

  const perMemeValue = useMemo(() => {
    try {
      return BigInt(phenixPerMeme?.toString() ?? "0");
    } catch {
      return 0n;
    }
  }, [phenixPerMeme]);

  // =======================
  // Derived state
  // =======================

  const price = useMemo(() => {
    if (!currentStage) return "0";
    return formatUnits(currentStage.priceUsdt, USDT_DECIMALS);
  }, [currentStage]);

  const cost = useMemo(() => {
    if (!currentStage || !amount) return "0";
    try {
      const memeHuman = BigInt(amount);
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
    if (!currentStage || !perMemeValue) return null;
    const remainingInStage = currentStage.phenixEnd - minedValue;
    if (remainingInStage <= perMemeValue) return "Next stage soon";
    return price;
  }, [currentStage, minedValue, perMemeValue, price]);

  const maxBuyable = useMemo(() => {
    if (!capValue || !minedValue || !perMemeValue) return "0";

    const remainingPhenix = capValue - minedValue;
    const memeLeftByPhenix = remainingPhenix / perMemeValue;

    const memeLeftByMinted = memeLeftByPhenix; // reserved for future MEME cap logic

    const memeLeft = memeLeftByPhenix < memeLeftByMinted
      ? memeLeftByPhenix
      : memeLeftByMinted;

    return memeLeft.toString();
  }, [capValue, minedValue, perMemeValue, memeMintedValue]);

  const progressPercent = useMemo(() => {
    if (!capValue || capValue === 0n) return 0;
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
      args: [memeAmount, parseUnits(cost, USDT_DECIMALS)],
      account: address,
    });

    await write(simulation.request);
  }, [guard, amount, cost, address, publicClient, write]);

  const phenixCapFormatted = useMemo(() => {
    try {
      return formatUnits(capValue, PHENIX_DECIMALS);
    } catch {
      return "0";
    }
  }, [capValue]);

  const memeCapFormatted = useMemo(() => {
    try {
      const memeCap = capValue / perMemeValue;
      return memeCap.toString();
    } catch {
      return "0";
    }
  }, [capValue, perMemeValue]);

  //
  const remaining = useMemo(() => {
    try {
      const memeCap = capValue / perMemeValue;
      return (memeCap - minedValue).toString();
    } catch {
      return "0";
    }
  }, [capValue, minedValue]);

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
    remaining,

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
