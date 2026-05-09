import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAccount, useReadContract } from "wagmi";
import { base } from "viem/chains";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Coins,
  Gift,
  HandCoins,
  ListOrdered,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import fnftAbi from "@/abi/fnft.json";
import { FNFT_ADDRESS } from "@/lib/constants";
import {
  createBuybackRequest,
  createStakeRecord,
  useStakingStorageDocument,
} from "@/lib/staking-storage";

const CARD_POINTS = 1000;

const plans = [
  { months: 3, annualRate: 0.04 },
  { months: 6, annualRate: 0.05 },
  { months: 12, annualRate: 0.08 },
  { months: 24, annualRate: 0.1 },
];

function formatPoints(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function meta() {
  return [
    { title: "质押领积分 | PHENIX" },
    { name: "description", content: "质押鉴定服务卡，或申请平台以 RMB 回购未质押的鉴定服务卡。" },
  ];
}

export default function Staking() {
  const { address, isConnected } = useAccount();
  const storageDocument = useStakingStorageDocument();
  const [stakeCardCount, setStakeCardCount] = useState("1");
  const [buybackCardCount, setBuybackCardCount] = useState("1");
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [busyAction, setBusyAction] = useState<"stake" | "buyback" | null>(null);

  const selectedPlan = plans.find((plan) => plan.months === selectedMonths) ?? plans[2];
  const normalizedAddress = address?.toLowerCase() ?? "";

  const { data: fnftBalanceRaw } = useReadContract({
    address: FNFT_ADDRESS as `0x${string}`,
    abi: fnftAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: base.id,
    query: {
      enabled: !!address,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  });

  const cardBalance = fnftBalanceRaw ? Number(fnftBalanceRaw as bigint) : 0;

  const userStakes = useMemo(
    () =>
      Object.values(storageDocument.stakes)
        .filter((item) => item.address === normalizedAddress)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [normalizedAddress, storageDocument.stakes],
  );

  const pendingBuybackQueue = useMemo(
    () =>
      Object.values(storageDocument.buybackRequests)
        .filter((item) => item.status === "pending")
        .sort((a, b) => {
          const createdDiff = Date.parse(a.createdAt) - Date.parse(b.createdAt);
          return createdDiff === 0 ? a.id.localeCompare(b.id) : createdDiff;
        }),
    [storageDocument.buybackRequests],
  );

  const userBuybackRequests = useMemo(
    () =>
      Object.values(storageDocument.buybackRequests)
        .filter((item) => item.address === normalizedAddress)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [normalizedAddress, storageDocument.buybackRequests],
  );

  const activeStakedCards = userStakes
    .filter((item) => item.status === "active")
    .reduce((sum, item) => sum + item.cardCount, 0);
  const pendingBuybackCards = userBuybackRequests
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + item.cardCount, 0);
  const availableCards = Math.max(cardBalance - activeStakedCards, 0);
  const operableCards = Math.max(availableCards - pendingBuybackCards, 0);

  const userPendingBuyback = pendingBuybackQueue.find(
    (item) => item.address === normalizedAddress,
  );
  const userQueuePosition = userPendingBuyback
    ? pendingBuybackQueue.findIndex((item) => item.id === userPendingBuyback.id) + 1
    : null;

  const parsedStakeCardCount = Math.max(Number.parseInt(stakeCardCount, 10) || 0, 0);
  const parsedBuybackCardCount = Math.max(Number.parseInt(buybackCardCount, 10) || 0, 0);

  const estimate = useMemo(() => {
    const principal = parsedStakeCardCount * CARD_POINTS;
    const days = Math.round(selectedPlan.months * 30);
    const totalAirdrop = principal * selectedPlan.annualRate * (selectedPlan.months / 12);
    const dailyAirdrop = days > 0 ? totalAirdrop / days : 0;

    return {
      principal,
      days,
      totalAirdrop,
      dailyAirdrop,
    };
  }, [parsedStakeCardCount, selectedPlan]);

  const handleCreateStake = async () => {
    if (!address) {
      toast.error("请先连接钱包");
      return;
    }

    if (parsedStakeCardCount <= 0) {
      toast.error("请输入质押数量");
      return;
    }

    if (parsedStakeCardCount > operableCards) {
      toast.error("质押数量不能超过可操作的未质押鉴定服务卡数量");
      return;
    }

    setBusyAction("stake");

    try {
      await createStakeRecord({
        type: "stake",
        address,
        cardCount: parsedStakeCardCount,
        ownedCardCount: cardBalance,
        months: selectedPlan.months,
        annualRate: selectedPlan.annualRate,
      });
      toast.success("质押记录已提交");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "质押提交失败");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateBuyback = async () => {
    if (!address) {
      toast.error("请先连接钱包");
      return;
    }

    if (parsedBuybackCardCount <= 0) {
      toast.error("请输入回购申请数量");
      return;
    }

    if (parsedBuybackCardCount > operableCards) {
      toast.error("回购数量不能超过可操作的未质押鉴定服务卡数量");
      return;
    }

    setBusyAction("buyback");

    try {
      await createBuybackRequest({
        type: "buyback",
        address,
        cardCount: parsedBuybackCardCount,
        ownedCardCount: cardBalance,
      });
      toast.success("回购申请已提交，已按申请时间进入队列");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "回购申请提交失败");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-16 sm:px-0 sm:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Phenix Token Points</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
            质押服务卡，天天得PHENIX福利
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            一张鉴定服务卡等值于 1,000 PHENIX 积分，质押服务卡获得 PHENIX 积分！
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/nft"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              获取会员凭证
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/assets"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              查看我的资产
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-3">
        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <WalletCards className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-xl font-semibold text-sky-950">持有鉴定服务卡</h2>
          <div className="mt-5 text-5xl font-semibold text-sky-950">
            {isConnected ? cardBalance : "-"}
          </div>
          <p className="mt-3 text-sm leading-6 text-sky-900/60">
            从钱包实时读取当前账户持有数量。
          </p>
        </div>
        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <ShieldCheck className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-xl font-semibold text-sky-950">质押中</h2>
          <div className="mt-5 text-5xl font-semibold text-sky-950">
            {isConnected ? activeStakedCards : "-"}
          </div>
          <p className="mt-3 text-sm leading-6 text-sky-900/60">
            已提交质押记录的鉴定服务卡。
          </p>
        </div>
        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <HandCoins className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-xl font-semibold text-sky-950">未质押</h2>
          <div className="mt-5 text-5xl font-semibold text-sky-950">
            {isConnected ? availableCards : "-"}
          </div>
          <p className="mt-3 text-sm leading-6 text-sky-900/60">
            未质押卡可继续质押
          </p>
        </div>
      </section>

      <section className="grid gap-4 border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <Coins className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-2xl font-semibold text-sky-950">积分换算</h2>
          <div className="mt-6 border-y border-sky-100 py-6">
            <div className="text-sm text-sky-900/60">鉴定服务卡</div>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-5xl font-semibold text-sky-950">1</span>
              <span className="pb-2 text-sky-900/70">张</span>
            </div>
          </div>
          <div className="pt-6">
            <div className="text-sm text-sky-900/60">对应 PHENIX 积分</div>
            <div className="mt-2 text-5xl font-semibold text-sky-950">{CARD_POINTS}</div>
          </div>
        </div>

        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <BadgeCheck className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-2xl font-semibold text-sky-950">获得规则</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => (
              <button
                key={plan.months}
                type="button"
                onClick={() => setSelectedMonths(plan.months)}
                className={`border p-5 text-left transition ${
                  selectedPlan.months === plan.months
                    ? "border-sky-400 bg-sky-50 text-sky-950"
                    : "border-sky-100 bg-white text-sky-950 hover:bg-sky-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-semibold">{plan.months} 个月</span>
                  <span className="text-sm text-sky-900/60">年化</span>
                </div>
                <div className="mt-4 text-4xl font-semibold text-sky-950">
                  {(plan.annualRate * 100).toFixed(0)}%
                </div>
                <p className="mt-3 text-sm leading-6 text-sky-900/60">日日获得 PHENIX 积分</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Staking Estimate</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">质押领积分</h2>
          <p className="mt-6 leading-8 text-sky-900/70">
            输入计划质押的未质押鉴定服务卡数量，选择质押周期，即可估算对应 PHENIX 积分获得。
          </p>
        </div>

        <div className="border border-sky-100 bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-sky-950" htmlFor="stake-card-count">
            质押鉴定服务卡数量
          </label>
          <input
            id="stake-card-count"
            type="number"
            min="0"
            step="1"
            value={stakeCardCount}
            onChange={(event) => setStakeCardCount(event.target.value)}
            className="mt-3 w-full border border-sky-200 bg-white px-4 py-3 text-2xl font-semibold text-sky-950 outline-none transition focus:border-sky-500"
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <Coins className="h-4 w-4" />
                质押基数
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{formatPoints(estimate.principal)} PHENIX</div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <CalendarDays className="h-4 w-4" />
                质押周期
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{selectedPlan.months} 个月</div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <Gift className="h-4 w-4" />
                预计总获得
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{formatPoints(estimate.totalAirdrop)} PHENIX</div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <ShieldCheck className="h-4 w-4" />
                预计日日获得
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{formatPoints(estimate.dailyAirdrop)} PHENIX</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateStake}
            disabled={!isConnected || busyAction === "stake"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-900/40"
          >
            {busyAction === "stake" ? "提交中..." : "提交质押"}
          </button>

          <p className="mt-6 text-sm leading-7 text-sky-900/60">
            测算按 1 张鉴定服务卡 = 1000 PHENIX、每月 30 天估算。最终积分发放以实际质押合约、平台规则与链上记录为准。
          </p>
        </div>
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">RMB Buyback Queue</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">未质押卡平台回购</h2>
            <p className="mt-6 leading-8 text-sky-900/70">
              未质押的鉴定服务卡可提交平台回购申请，质押中的服务卡不能提交回购申请。平台按申请时间戳排序处理，支付 RMB 后完成交易。
            </p>
          </div>

          <div className="border border-sky-100 bg-white p-6 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-sky-50 p-5">
                <div className="flex items-center gap-2 text-sm text-sky-900/60">
                  <ListOrdered className="h-4 w-4" />
                  当前排队总数
                </div>
                <div className="mt-3 text-2xl font-semibold text-sky-950">{pendingBuybackQueue.length}</div>
              </div>
              <div className="bg-sky-50 p-5">
                <div className="flex items-center gap-2 text-sm text-sky-900/60">
                  <HandCoins className="h-4 w-4" />
                  我的排队位置
                </div>
                <div className="mt-3 text-2xl font-semibold text-sky-950">
                  {userQueuePosition ? `第 ${userQueuePosition} 位` : "未排队"}
                </div>
              </div>
            </div>

            <label className="mt-6 block text-sm font-semibold text-sky-950" htmlFor="buyback-card-count">
              申请回购鉴定服务卡数量
            </label>
            <input
              id="buyback-card-count"
              type="number"
              min="0"
              step="1"
              value={buybackCardCount}
              onChange={(event) => setBuybackCardCount(event.target.value)}
              className="mt-3 w-full border border-sky-200 bg-white px-4 py-3 text-2xl font-semibold text-sky-950 outline-none transition focus:border-sky-500"
            />

            <button
              type="button"
              onClick={handleCreateBuyback}
              disabled={!isConnected || busyAction === "buyback"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-900/40"
            >
              {busyAction === "buyback" ? "提交中..." : "提交 RMB 回购申请"}
            </button>

            {userPendingBuyback && (
              <div className="mt-6 border border-sky-100 bg-sky-50 p-5">
                <div className="text-sm text-sky-900/60">我的待处理申请</div>
                <div className="mt-3 font-semibold text-sky-950">
                  {userPendingBuyback.cardCount} 张，排第 {userQueuePosition} 位
                </div>
                <div className="mt-2 text-sm text-sky-900/60">
                  申请时间：{formatDateTime(userPendingBuyback.createdAt)}
                </div>
              </div>
            )}

            <p className="mt-6 text-sm leading-7 text-sky-900/60">
              排队位置按待处理申请的时间戳从早到晚计算。只有可操作的未质押服务卡能进入回购队列；平台审核后，以 RMB 支付完成回购交易。
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-sky-950">我的质押记录</h2>
            <div className="mt-5 space-y-3">
              {userStakes.length === 0 ? (
                <p className="text-sm leading-7 text-sky-900/60">暂无质押记录。</p>
              ) : (
                userStakes.map((item) => (
                  <div key={item.id} className="border border-sky-100 bg-sky-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-semibold text-sky-950">
                        {item.cardCount} 张 / {item.months} 个月
                      </div>
                      <div className="text-sm text-sky-700">
                        {item.status === "active" ? "质押中" : "已释放"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-sky-900/60">
                      年化 {(item.annualRate * 100).toFixed(0)}% / {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-sky-950">我的回购申请</h2>
            <div className="mt-5 space-y-3">
              {userBuybackRequests.length === 0 ? (
                <p className="text-sm leading-7 text-sky-900/60">暂无回购申请。</p>
              ) : (
                userBuybackRequests.map((item) => {
                  const queuePosition =
                    item.status === "pending"
                      ? pendingBuybackQueue.findIndex((queueItem) => queueItem.id === item.id) + 1
                      : 0;

                  return (
                    <div key={item.id} className="border border-sky-100 bg-sky-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="font-semibold text-sky-950">
                          {item.cardCount} 张 / {item.payoutCurrency} 回购
                        </div>
                        <div className="text-sm text-sky-700">
                          {item.status === "pending" ? `排第 ${queuePosition} 位` : item.status}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-sky-900/60">
                        申请时间：{formatDateTime(item.createdAt)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
