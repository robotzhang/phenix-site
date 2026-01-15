import { useAccount, useChainId } from "wagmi";
import { useMemo } from "react";
import { base } from "viem/chains";

const BASE_CHAIN_ID = base.id;

export function useGuard() {
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
