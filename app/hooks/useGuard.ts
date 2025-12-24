import { useAccount, useChainId } from "wagmi";
import { useMemo } from "react";

const BASE_CHAIN_ID = 8453;

export function useProductionGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  return useMemo(() => {
    if (!isConnected)
      return { ready: false, reason: "Connect wallet" };

    if (chainId !== BASE_CHAIN_ID)
      return { ready: false, reason: "Switch to Base network" };

    return { ready: true as const };
  }, [isConnected, chainId]);
}
