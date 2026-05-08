import React from "react";
import { usePublicClient, useWatchContractEvent } from "wagmi";
import { formatUnits } from "viem";
import { base } from "viem/chains";

import fnftAbi from "@/abi/fnft.json";
import { FNFT_ADDRESS, USDT_DECIMALS } from "@/lib/constants";

type Sale = {
  buyer: string;
  amount: number;
  cost: string;
  txHash: string;
  blockNumber: number;
};

export function useFnftSales() {
  const publicClient = usePublicClient();
  const [sales, setSales] = React.useState<Sale[]>([]);

  const refresh = React.useCallback(async () => {
    if (!publicClient) return;

    const currentBlock = await publicClient.getBlockNumber();
    const fromBlock = currentBlock > 2_000n ? currentBlock - 2_000n : 0n;
    const logs = await publicClient.getContractEvents({
      address: FNFT_ADDRESS as `0x${string}`,
      abi: fnftAbi,
      eventName: "Purchased",
      fromBlock,
      toBlock: currentBlock,
    });

    const nextSales = logs.map((log: any) => ({
      buyer: String(log.args?.buyer ?? ""),
      amount: Number(log.args?.amount ?? 0n),
      cost: formatUnits((log.args?.cost ?? 0n) as bigint, USDT_DECIMALS),
      txHash: log.transactionHash,
      blockNumber: Number(log.blockNumber),
    }));

    setSales(nextSales);
  }, [publicClient]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  useWatchContractEvent({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    eventName: "Purchased",
    chainId: base.id,
    enabled: true,
    onLogs(logs) {
      setSales((prev) => [
        ...prev,
        ...logs.map((log: any) => ({
          buyer: String(log.args?.buyer ?? ""),
          amount: Number(log.args?.amount ?? 0n),
          cost: formatUnits((log.args?.cost ?? 0n) as bigint, USDT_DECIMALS),
          txHash: log.transactionHash,
          blockNumber: Number(log.blockNumber),
        })),
      ]);
    },
  });

  return { sales, refresh };
}
