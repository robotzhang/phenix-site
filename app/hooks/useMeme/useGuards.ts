import { useMemo } from "react";

type GuardInput = {
  guardHooks: ReturnType<typeof import("../useGuard").useGuard>;
  amount: string;
  maxBuyable: bigint;
  minedValue: bigint;
  capValue: bigint;
};

export function useGuards({
  guardHooks,
  amount,
  maxBuyable,
  minedValue,
  capValue,
}: GuardInput) {
  return useMemo(() => {
    if (!guardHooks.ready)
      return { canBuy: false, reason: guardHooks.reason };

    if (!amount || Number(amount) <= 0)
      return { canBuy: false, reason: "Invalid amount" };

    if (Number(amount) > Number(maxBuyable))
      return { canBuy: false, reason: "Exceeds remaining supply" };

    if (minedValue >= capValue)
      return { canBuy: false, reason: "Mining finished" };

    return { canBuy: true as const };
  }, [guardHooks, amount, maxBuyable, minedValue, capValue]);
}
