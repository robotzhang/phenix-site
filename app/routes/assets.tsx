import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useReadContract, useDisconnect } from "wagmi";
import { formatUnits } from "viem";
import fnftAbi from "@/abi/fnft.json";
import erc20Abi from "@/abi/erc20.json";
import { FNFT_ADDRESS, USDT_ADDRESS } from "@/lib/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { WalletCards } from "lucide-react";

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
    <div className="py-8 sm:py-12">
      <div className="mb-8 border-b border-sky-100 pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Wallet Assets</p>
        <h1 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">我的资产</h1>
        <p className="mt-4 max-w-2xl leading-7 text-sky-900/70">
          查看当前账户中的积分、Phenix会员凭证及服务卡数量。
        </p>
        {isConnected && (
          <div className="mt-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="break-all text-sm text-muted-foreground">{address}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnect()}
            >
              断开连接
            </Button>
          </div>
        )}
      </div>

      {!isConnected && (
        <div className="border border-sky-100 bg-white/80 p-8 shadow-sm">
          <WalletCards className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-xl font-semibold text-sky-950">连接钱包查看资产</h2>
          <p className="mt-3 leading-7 text-sky-900/70">连接后可读取你的账户积分、会员凭证与服务卡数量。</p>
          <div className="mt-6">
            <ConnectButton />
          </div>
        </div>
      )}

      {isConnected && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <div className="text-sm text-sky-900/60">ETH</div>
            <div className="mt-2 text-2xl font-semibold text-sky-950">{parseFloat(ethBalance).toFixed(6)}</div>
          </div>

          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <div className="text-sm text-sky-900/60">USDT</div>
            <div className="mt-2 text-2xl font-semibold text-sky-950">{usdtBalance}</div>
          </div>

          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <div className="text-sm text-sky-900/60">会员凭证</div>
            <div className="mt-2 text-2xl font-semibold text-sky-950">{fnftNumbers?.toString() || "0"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
