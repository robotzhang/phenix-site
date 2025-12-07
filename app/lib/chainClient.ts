import { base } from "viem/chains";
import { createPublicClient, http } from "viem";

export const publicClient = createPublicClient({
  chain: base,
  transport: http('https://base.publicnode.com'),
});
