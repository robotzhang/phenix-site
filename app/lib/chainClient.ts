import { baseSepolia } from "viem/chains";
import { createPublicClient, http } from "viem";

export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia.publicnode.com'),
});
