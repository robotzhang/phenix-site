// src/hooks/useFnftPurchase.ts
import { useState, useMemo } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { FNFT_ADDRESS, USDT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";
import fnftAbi from "@/abi/fnft.json";
import erc20Abi from "@/abi/erc20.json";
import { parseUnits, formatUnits } from "viem";

export function useFnftPurchase() {
  const { address } = useAccount();
  const [amount, setAmount] = useState<number>(1);

  /** 单价 price */
  const { data: priceRaw, isLoading: isPriceLoading } = useReadContract({
    address: FNFT_ADDRESS,
    abi: fnftAbi,
    functionName: "price",
  });

  const price = priceRaw ? formatUnits(priceRaw as bigint, USDT_DECIMALS) : "0";

  /** 用户余额 */
  const { data: usdtBalanceRaw } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
    },
  });

  const usdtBalance = usdtBalanceRaw ? formatUnits(usdtBalanceRaw as bigint, USDT_DECIMALS) : "0";

  /** allowance */
  const { data: allowanceRaw } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, FNFT_ADDRESS],
    query: {
      enabled: !!address,
    },
  });

  const allowance = allowanceRaw ? formatUnits(allowanceRaw as bigint, USDT_DECIMALS) : "0";

  /** 总价 BigInt */
  const totalCostWei = useMemo(() => {
    return parseUnits(
      (parseFloat(price || "0") * amount).toString(),
      USDT_DECIMALS
    );
  }, [price, amount]);

  /** approve + buy */
  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeBuy } = useWriteContract();

  async function purchase() {
    if (!address) throw new Error("please connect wallet");

    const needed = parseFloat(formatUnits(totalCostWei, USDT_DECIMALS));
    const balance = parseFloat(usdtBalance);

    if (balance < needed) throw new Error("USDT balance not enough");

    // allowance 不够先 approve
    if (parseFloat(allowance) < needed) {
      await writeApprove({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [FNFT_ADDRESS, totalCostWei],
      });
    }

    // buy
    return writeBuy({
      address: FNFT_ADDRESS,
      abi: fnftAbi,
      functionName: "buy",
      args: [BigInt(amount)],
    });
  }

  return {
    isPriceLoading,
    amount,
    setAmount,
    price,
    usdtBalance,
    allowance,
    totalCostWei,
    totalCos: formatUnits(totalCostWei, USDT_DECIMALS),
    purchase,
  };
}
