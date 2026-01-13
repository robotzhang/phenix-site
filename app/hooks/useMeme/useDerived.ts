import { useMemo } from "react";
import { parseUnits, formatUnits } from "viem";

import {
  MEME_DECIMALS,
  PHENIX_DECIMALS,
  USDT_DECIMALS,
} from "@/lib/constants";

import type { Stage } from "./types";

type Input = {
  amount: string;
  currentStage?: Stage;
  minedValue: bigint;
  capValue: bigint;
  perMemeValue: bigint;
  preview?: readonly [bigint, bigint];
  nextPreview?: readonly [bigint, bigint];
  redeemEnabled: boolean;
};

export function useDerived({
  amount,
  currentStage,
  minedValue,
  capValue,
  perMemeValue,
  preview,
  nextPreview,
  redeemEnabled,
}: Input) {
  const memeAmountParsed = useMemo(() => {
    try {
      return parseUnits(amount || "0", 0);
    } catch {
      return 0n;
    }
  }, [amount]);

  const price = useMemo(() => {
    if (!currentStage) return "0";
    return formatUnits(currentStage.priceUsdt, USDT_DECIMALS);
  }, [currentStage]);

  const cost = useMemo(() => {
    try {
      const usdtCost = preview?.[0];
      if (!usdtCost) return "0";
      return formatUnits(usdtCost, USDT_DECIMALS);
    } catch {
      return "0";
    }
  }, [preview]);

  const nextPrice = useMemo(() => {
    try {
      const usdtCost = nextPreview?.[0];
      if (!usdtCost || usdtCost === 0n) return null;
      return formatUnits(usdtCost, USDT_DECIMALS);
    } catch {
      return null;
    }
  }, [nextPreview]);

  const remaining = useMemo<bigint>(() => {
    try {
      if (perMemeValue === 0n) return 0n;

      const memeCap = capValue / perMemeValue;
      const memeCapScaled = memeCap * 10n ** BigInt(MEME_DECIMALS);

      const left = memeCapScaled - minedValue;
      if (left <= 0n) return 0n;
      return left;
    } catch {
      return 0n;
    }
  }, [capValue, minedValue, perMemeValue]);

  const progressPercent = useMemo(() => {
    try {
      if (perMemeValue === 0n || capValue === 0n) return "0";

      const memeCap = capValue / perMemeValue;
      if (memeCap === 0n) return "0";

      const percentBigInt = (minedValue * 10000n) / memeCap;
      return formatUnits(percentBigInt / 100n, MEME_DECIMALS);
    } catch {
      return "0";
    }
  }, [capValue, minedValue, perMemeValue]);

  const phenixCapFormatted = useMemo(() => {
    try {
      return formatUnits(capValue, PHENIX_DECIMALS);
    } catch {
      return "0";
    }
  }, [capValue]);

  const minedFormatted = useMemo(() => {
    try {
      return formatUnits(minedValue, MEME_DECIMALS);
    } catch {
      return "0";
    }
  }, [minedValue]);

  const remainingFormatted = useMemo(() => {
    try {
      return formatUnits(remaining, MEME_DECIMALS);
    } catch {
      return "0";
    }
  }, [remaining]);

  return {
    memeAmountParsed,

    price,
    cost,
    nextPrice,

    remaining,
    progressPercent,

    canRedeem: redeemEnabled,

    phenixCapFormatted,
    minedFormatted,
    remainingFormatted,
  };
}
