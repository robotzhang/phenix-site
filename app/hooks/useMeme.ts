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
  MEME_DECIMALS,
  PHENIX_DECIMALS,
  USDT_ADDRESS,
  USDT_DECIMALS,
} from "@/lib/constants";

import { useSafeContractWrite } from "./useSafeContractWrite";
import { useGuard } from "./useGuard";
import { toast } from "sonner";

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

  const { data: redeemEnabled } = useReadContract({
    abi: memeAbi,
    address: MEME_ADDRESS,
    functionName: "redeemEnabled",
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

  const remaining = useMemo(() => {
    try {
      if (!perMemeValue || perMemeValue === 0n) return "0";

      const memeCap = capValue / perMemeValue; 
      const memeCapScaled = memeCap * 10n ** BigInt(MEME_DECIMALS);

      const remainingMeme = memeCapScaled - minedValue;

      if (remainingMeme <= 0n) return "0";

      return remainingMeme.toString();
    } catch {
      return "0";
    }
  }, [capValue, minedValue, perMemeValue]);

  const maxBuyable = useMemo(() => {
    if (!remaining) return "0";
    return remaining.toString();
  }, [remaining]);

  const progressPercent = useMemo(() => {
  try {
    if (perMemeValue === 0n || capValue === 0n) return "0";

    // 计算 MEME 总量
    const memeCap = capValue / perMemeValue;
    if (memeCap === 0n) return "0";

    // 放大 10^4 倍，得到整数形式
    const percentBigInt = (minedValue * 10000n) / memeCap;

    // formatUnits 将整数除以 10^2，得到百分比两位小数
    return formatUnits(percentBigInt / 100n, MEME_DECIMALS); // 这里 2 表示保留两位小数
  } catch {
    return "0";
  }
}, [capValue, minedValue, perMemeValue]);

  const canRedeem = useMemo(() => {
    return Boolean(redeemEnabled);
  }, [redeemEnabled]);

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

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: USDT_ADDRESS,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", MEME_ADDRESS],
  });

  // =======================
  // Write: Buy MEME
  // =======================

  const buy = useCallback(async () => {
    if (!guard.canBuy || !address || !publicClient) {
      toast.error(guard.reason || "please wait a moment");
      return;
    }

    const memeAmount = parseUnits(amount, 0);
    const usdtCost = parseUnits(cost, USDT_DECIMALS);

    const currentAllowance = BigInt(allowance?.toString() ?? "0");

    if (currentAllowance < usdtCost) {
      const approveSim = await publicClient.simulateContract({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [MEME_ADDRESS, usdtCost],
        account: address,
      });

      await write(approveSim.request);
    }

    const simulation = await publicClient.simulateContract({
      address: MEME_ADDRESS,
      abi: memeAbi,
      functionName: "mine",
      args: [memeAmount, usdtCost],
      account: address,
    });

    await write(simulation.request);
  }, [guard, amount, cost, allowance, address, publicClient, write]);

  // =======================
  // Write: Redeem MEME
  // =======================

  const redeem = useCallback(async () => {
    if (!address || !publicClient) {
      toast.error("please connect wallet");
      return;
    }

    if (!canRedeem) {
      toast.error("Redeem not enabled");
      return;
    }

    const memeAmount = parseUnits(amount, 0);

    const simulation = await publicClient.simulateContract({
      address: MEME_ADDRESS,
      abi: memeAbi,
      functionName: "redeem",
      args: [memeAmount],
      account: address,
    });

    await write(simulation.request);
  }, [address, amount, canRedeem, publicClient, write]);

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

  // =======================
  // Human readable display
  // =======================

  const minedFormatted = useMemo(() => {
    try {
      return formatUnits(minedValue, MEME_DECIMALS);
    } catch {
      return "0";
    }
  }, [minedValue]);

  const remainingFormatted = useMemo(() => {
    try {
      return formatUnits(BigInt(remaining), MEME_DECIMALS);
    } catch {
      return "0";
    }
  }, [remaining]);

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
    redeem,

    // Guards
    guard,

    // Redeem
    canRedeem,

    // Advanced metrics
    nextPrice,
    maxBuyable,
    progressPercent,

    // Human readable
    minedFormatted,
    remainingFormatted,
  };
}
