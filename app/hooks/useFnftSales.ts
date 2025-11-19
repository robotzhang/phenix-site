import React from "react";
import { useWatchContractEvent } from "wagmi";
import fnftAbi from "@/abi/fnft.json";
import { FNFT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";
import { formatUnits } from "viem";
import { baseSepolia } from "viem/chains";

export function useFnftSales() {
  const [sales, setSales] = React.useState<
    {
      buyer: string;
      amount: number;
      cost: string;
      txHash: string;
      blockNumber: number;
    }[]
  >([]);

  useWatchContractEvent({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    eventName: "Purchased",
    chainId: baseSepolia.id,
    enabled: true,
    onLogs(logs) {
      // logs: readonly any[]
      logs.forEach((log: any) => {
        if (!log.args) return;

        // args 是数组类型
        const argsArray = log.args as unknown as Array<any>;
        const buyer = argsArray[0] as `0x${string}`;
        const amount = argsArray[1] as bigint;
        const cost = argsArray[2] as bigint;

        setSales((prev) => [
          ...prev,
          {
            buyer,
            amount: Number(amount),
            cost: formatUnits(cost, USDT_DECIMALS),
            txHash: log.transactionHash,
            blockNumber: Number(log.blockNumber),
          },
        ]);
      });
    },
    onError(err) {
      console.error("watch event error:", err);
    },
  });

  return { sales };
}
