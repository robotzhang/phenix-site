import { parseUnits } from "viem";
import { toast } from "sonner";

import memeAbi from "@/abi/meme.json";
import erc20Abi from "@/abi/erc20.json";

import {
  MEME_ADDRESS,
  USDT_ADDRESS,
} from "@/lib/constants";

type Input = {
  address?: `0x${string}`;
  publicClient: any;
  write: (req: any) => Promise<any>;
  guard: { canBuy: boolean; reason?: string };
  amount: string;
  rawUsdtCost: bigint;
  allowance: unknown;
  canRedeem: boolean;
};

export function useActions({
  address,
  publicClient,
  write,
  guard,
  amount,
  rawUsdtCost,
  allowance,
  canRedeem,
}: Input) {
  const buy = async () => {
    if (!guard.canBuy || !address || !publicClient) {
      toast.error(guard.reason || "please wait a moment");
      return;
    }

    const memeAmount = parseUnits(amount, 0);
    const usdtCost = rawUsdtCost;
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
    window.location.reload();
  };

  const redeem = async () => {
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
    window.location.reload();
  };

  return { buy, redeem };
}
