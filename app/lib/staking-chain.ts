import { base, baseSepolia } from "viem/chains";

export const STAKING_CHAIN = import.meta.env.DEV ? baseSepolia : base;
