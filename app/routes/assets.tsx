import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useReadContract, useDisconnect } from "wagmi";
import { formatUnits } from "viem";
import fnftAbi from "@/abi/fnft.json";
import erc20Abi from "@/abi/erc20.json";
import { FNFT_ADDRESS, USDT_ADDRESS } from "@/lib/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

type FNFT = {
  tokenId: string;
  name: string;
  amount: string;
};

export default function Assets() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const publicClient = usePublicClient();

  // --- ETH 余额 ---
  const [ethBalance, setEthBalance] = useState("0");
  useEffect(() => {
    if (!address) return;
    publicClient?.getBalance({ address }).then((bal) => setEthBalance(formatUnits(bal, 18)));
  }, [address, publicClient]);

  // --- USDT 余额 ---
  const { data: usdtBalanceRaw } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address,
    },
  });
  const usdtBalance = usdtBalanceRaw ? formatUnits(usdtBalanceRaw as bigint, 6) : "0";

  // --- FNFT tokenIds ---
  const { data: fnftNumbers } = useReadContract({
    address: FNFT_ADDRESS,
    abi: fnftAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address,
    },
  });

  return (
    <div>
      <div className="my-6">
        <h1 className="text-xl font-bold">My Assets</h1>
        {isConnected && (
          <div className="flex justify-between gap-4 mt-2">
            <div className=" break-all text-sm">{address}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
            >
              Disconnect
            </Button>
          </div>
          
        )}
      </div>

      <div className="flex justify-between border-b border-t py-3">
        <div className="">ETH</div>
        <div>{parseFloat(ethBalance).toFixed(6)}</div>
      </div>

      <div className="flex justify-between border-b py-3">
        <div className="">USDT</div>
        <div>{usdtBalance}</div>
      </div>

      <div className="flex justify-between py-3">
        <div className="">FNFT</div>
        <div>{fnftNumbers?.toString()}</div>
      </div>
    </div>
  );
}
