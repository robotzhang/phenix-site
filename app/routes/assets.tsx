import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useDisconnect } from "wagmi";
import { formatUnits, type Abi } from "viem";
import fnftAbi from "@/abi/fnft.json";
import erc20Abi from "@/abi/erc20.json";
import { FNFT_ADDRESS, USDT_ADDRESS } from "@/lib/constants";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { BadgeCheck, IdCard, WalletCards } from "lucide-react";

const MAX_DISPLAYED_SERVICE_CARDS = 50;
const serviceCardAbi = fnftAbi as Abi;

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

  const { data: serviceCardBalanceRaw } = useReadContract({
    address: FNFT_ADDRESS,
    abi: serviceCardAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!address,
    },
  });
  const serviceCardBalance = serviceCardBalanceRaw ? Number(serviceCardBalanceRaw as bigint) : 0;
  const serviceCardDisplayCount = Math.min(serviceCardBalance, MAX_DISPLAYED_SERVICE_CARDS);
  const serviceCardContracts = address
    ? Array.from({ length: serviceCardDisplayCount }, (_, index) => ({
      address: FNFT_ADDRESS as `0x${string}`,
      abi: serviceCardAbi,
      functionName: "tokenOfOwnerByIndex",
      args: [address, BigInt(index)],
    }))
    : [];
  const { data: serviceCardReadResults, isLoading: isLoadingServiceCards } = useReadContracts({
    contracts: serviceCardContracts,
    query: {
      enabled: isConnected && serviceCardDisplayCount > 0,
    },
  });
  const serviceCardIds = ((serviceCardReadResults ?? []) as Array<{ status: string; result?: unknown }>)
    .map((item) => (item.status === "success" && typeof item.result === "bigint" ? item.result.toString() : null))
    .filter((id): id is string => Boolean(id));

  return (
    <div className="py-8 sm:py-12">
      <div className="mb-8 border-b border-sky-100 pb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Wallet Assets</p>
        <h1 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">我的资产</h1>
        <p className="mt-4 max-w-2xl leading-7 text-sky-900/70">
          查看当前账户中的积分、PHENIX 会员凭证及鉴定服务卡数量。
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
          <p className="mt-3 leading-7 text-sky-900/70">连接后可读取你的账户积分、会员凭证与鉴定服务卡数量。</p>
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
            <div className="mt-2 text-2xl font-semibold text-sky-950">{serviceCardBalance}</div>
          </div>
        </div>
      )}

      {isConnected && (
        <section className="mt-8 border border-sky-100 bg-white/80 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 border border-sky-100 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
                <IdCard className="h-4 w-4" />
                会员凭证
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-sky-950">鉴定服务卡</h2>
              <p className="mt-3 max-w-2xl leading-7 text-sky-900/70">
                系统会读取当前钱包内的鉴定服务卡；若账户中已持有，将在下方展示对应凭证编号。
              </p>
            </div>
            <div className="border border-sky-100 bg-sky-50 px-4 py-3 text-sky-950">
              <div className="text-sm text-sky-900/60">当前持有</div>
              <div className="mt-1 text-2xl font-semibold">{serviceCardBalance} 张</div>
            </div>
          </div>

          {serviceCardBalance === 0 && (
            <div className="mt-6 border border-dashed border-sky-200 bg-sky-50/60 p-6 text-sky-900/70">
              当前钱包暂未读取到鉴定服务卡。你可以继续浏览项目内容，或切换钱包后重新查看。
            </div>
          )}

          {serviceCardBalance > 0 && (
            <div className="mt-6">
              {isLoadingServiceCards && (
                <div className="border border-sky-100 bg-sky-50/60 p-6 text-sky-900/70">
                  正在读取鉴定服务卡信息...
                </div>
              )}

              {!isLoadingServiceCards && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceCardIds.map((cardId) => (
                    <div key={cardId} className="border border-sky-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <img src="/member-credential.svg" className="h-10 w-10" alt="鉴定服务卡" />
                        <span className="inline-flex items-center gap-1 border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" />
                          已持有
                        </span>
                      </div>
                      <div className="mt-5 text-sm text-sky-900/60">鉴定服务卡编号</div>
                      <div className="mt-2 text-2xl font-semibold text-sky-950">#{cardId}</div>
                      <div className="mt-4 border-t border-sky-100 pt-4 text-sm leading-6 text-sky-900/70">
                        可用于会员身份识别、服务卡锁仓与平台支持的会员功能。
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {serviceCardBalance > MAX_DISPLAYED_SERVICE_CARDS && (
                <p className="mt-4 text-sm text-sky-900/60">
                  当前仅展示前 {MAX_DISPLAYED_SERVICE_CARDS} 张鉴定服务卡。
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
