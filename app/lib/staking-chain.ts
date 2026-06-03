import { base, baseSepolia } from "viem/chains";

import { STAKING_NETWORK } from "@/lib/constants";

export const STAKING_CHAIN = STAKING_NETWORK === "baseSepolia" ? baseSepolia : base;
