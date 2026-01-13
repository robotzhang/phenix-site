import { useAccount, useReadContract } from "wagmi";
import { USDT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";
import erc20Abi from "@/abi/erc20.json";
import { formatUnits } from "viem";

export function useUsdt() {
  const { address } = useAccount();
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

  return {
    balance: usdtBalance,
  };
}