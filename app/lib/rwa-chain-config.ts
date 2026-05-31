import { base, baseSepolia } from "viem/chains";

import { RWA_ADDRESS, TEST_RWA_ADDRESS } from "@/lib/constants";

export const RWA_CHAIN = import.meta.env.DEV ? baseSepolia : base;
export const RWA_CHAIN_ID = RWA_CHAIN.id;
export const RWA_CONTRACT_ADDRESS = (
  import.meta.env.DEV ? TEST_RWA_ADDRESS : RWA_ADDRESS
) as `0x${string}`;
export const RWA_EXPLORER_TX_BASE = `${RWA_CHAIN.blockExplorers.default.url}/tx/`;
export const RWA_EXPLORER_TOKEN_BASE = `${RWA_CHAIN.blockExplorers.default.url}/token/${RWA_CONTRACT_ADDRESS}?a=`;
