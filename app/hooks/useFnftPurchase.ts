import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";

import fnftAbi from "@/abi/fnft.json";
import erc20Abi from "@/abi/erc20.json";
import { FNFT_ADDRESS, FNFT_DECIMALS, USDT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";

export function useFnftPurchase() {
  const { address } = useAccount();
  const [amount, setAmount] = useState<number>(1);

  const {
    data: priceRaw,
    isLoading: isPriceLoading,
    isFetching: isPriceFetching,
    refetch: refetchPrice,
  } = useReadContract({
    address: FNFT_ADDRESS,
    abi: fnftAbi,
    functionName: "price",
    query: {
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const {
    data: maxSupplyRaw,
    refetch: refetchMaxSupply,
  } = useReadContract({
    address: FNFT_ADDRESS,
    abi: fnftAbi,
    functionName: "MAX_SUPPLY",
    query: {
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const {
    data: totalMintedRaw,
    isLoading: isTotalMintedLoading,
    isFetching: isTotalMintedFetching,
    refetch: refetchTotalMinted,
  } = useReadContract({
    address: FNFT_ADDRESS,
    abi: fnftAbi,
    functionName: "totalMinted",
    query: {
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const {
    data: usdtBalanceRaw,
    refetch: refetchUsdtBalance,
  } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: {
      enabled: !!address,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const {
    data: allowanceRaw,
    refetch: refetchAllowance,
  } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address!, FNFT_ADDRESS],
    query: {
      enabled: !!address,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const price = priceRaw ? formatUnits(priceRaw as bigint, USDT_DECIMALS) : "0";
  const maxSupply = maxSupplyRaw ? formatUnits(maxSupplyRaw as bigint, FNFT_DECIMALS) : "0";
  const totalMinted = totalMintedRaw ? formatUnits(totalMintedRaw as bigint, 0) : "0";
  const usdtBalance = usdtBalanceRaw ? formatUnits(usdtBalanceRaw as bigint, USDT_DECIMALS) : "0";
  const allowance = allowanceRaw ? formatUnits(allowanceRaw as bigint, USDT_DECIMALS) : "0";

  const totalCostWei = useMemo(() => {
    return parseUnits((parseFloat(price || "0") * amount).toString(), USDT_DECIMALS);
  }, [price, amount]);

  const refresh = useCallback(async () => {
    await Promise.all([
      refetchPrice(),
      refetchMaxSupply(),
      refetchTotalMinted(),
      refetchUsdtBalance(),
      refetchAllowance(),
    ]);
  }, [
    refetchPrice,
    refetchMaxSupply,
    refetchTotalMinted,
    refetchUsdtBalance,
    refetchAllowance,
  ]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    void refresh();

    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeBuy } = useWriteContract();

  async function purchase() {
    if (!address) throw new Error("please connect wallet");

    const needed = parseFloat(formatUnits(totalCostWei, USDT_DECIMALS));
    const balance = parseFloat(usdtBalance);

    if (balance < needed) throw new Error("USDT balance not enough");

    if (parseFloat(allowance) < needed) {
      await writeApprove({
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [FNFT_ADDRESS, totalCostWei],
      });
    }

    const receipt = await writeBuy({
      address: FNFT_ADDRESS,
      abi: fnftAbi,
      functionName: "buy",
      args: [BigInt(amount)],
    });

    window.dispatchEvent(new Event("fnft:refresh"));
    await refresh();
    return receipt;
  }

  return {
    isPriceLoading: isPriceLoading || isPriceFetching,
    isTotalMintedLoading: isTotalMintedLoading || isTotalMintedFetching,
    maxSupply,
    totalMinted,
    amount,
    setAmount,
    price,
    usdtBalance,
    allowance,
    totalCostWei,
    totalCos: formatUnits(totalCostWei, USDT_DECIMALS),
    purchase,
    refresh,
  };
}
