import { useCallback, useRef } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { parseContractError } from "@/lib/parseContractError";

export function useSafeContractWrite() {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const pendingRef = useRef(false);

  const write = useCallback(
    async (request: any) => {
      if (!walletClient || !publicClient)
        throw new Error("Wallet not ready");

      if (pendingRef.current) return;
      pendingRef.current = true;

      const toastId = toast.loading("Confirming transaction...");

      try {
        const hash = await walletClient.writeContract(request);

        toast.loading("Transaction sent", { id: toastId });

        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        });

        toast.success("Transaction confirmed", {
          id: toastId,
          action: {
            label: "Explorer",
            onClick: () =>
              window.open(
                `https://basescan.org/tx/${hash}`,
                "_blank"
              ),
          },
        });

        return receipt;
      } catch (err: any) {
        toast.error(parseContractError(err), { id: toastId });
        throw err;
      } finally {
        pendingRef.current = false;
      }
    },
    [walletClient, publicClient]
  );

  return { write };
}
