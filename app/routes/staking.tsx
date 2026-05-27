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
import RightsBoundaryNotice from "@/components/biz/RightsBoundaryNotice";

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
    { title: "服务卡权益积分规则 | PHENIX" },
    { name: "description", content: "服务卡权益使用周期、积分规则与转让/退出服务申请登记。" },
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
      toast.error("请输入服务卡数量");
      return;
    }

    if (parsedStakeCardCount > operableCards) {
      toast.error("数量不能超过可操作的服务卡数量");
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
      toast.success("权益使用周期记录已提交");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "权益使用周期提交失败");
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
      toast.error("请输入转让/退出服务申请数量");
      return;
    }

    if (parsedBuybackCardCount > operableCards) {
      toast.error("申请数量不能超过可操作的服务卡数量");
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
      toast.success("转让/退出服务申请已提交，平台将协助登记");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "转让/退出服务申请提交失败");
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
            服务卡权益使用周期，按平台规则累计积分
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            会员可选择服务卡权益保留期，平台根据权益使用周期、积分计量单位和线上记录累计积分；服务卡不支持直接兑换积分或现金权益。
          </p>
          <RightsBoundaryNotice className="mt-6 max-w-3xl" compact />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              查看会员体系
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
          <h2 className="mt-5 text-xl font-semibold text-sky-950">权益保留期中</h2>
          <div className="mt-5 text-5xl font-semibold text-sky-950">
            {isConnected ? activeStakedCards : "-"}
          </div>
          <p className="mt-3 text-sm leading-6 text-sky-900/60">
            已提交权益使用周期记录的鉴定服务卡。
          </p>
        </div>
        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <HandCoins className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-xl font-semibold text-sky-950">可操作服务卡</h2>
          <div className="mt-5 text-5xl font-semibold text-sky-950">
            {isConnected ? availableCards : "-"}
          </div>
          <p className="mt-3 text-sm leading-6 text-sky-900/60">
            可选择权益保留期或提交转让/退出服务申请。
          </p>
        </div>
      </section>

      <section className="grid gap-4 border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <Coins className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-2xl font-semibold text-sky-950">权益积分计量参考</h2>
          <div className="mt-6 border-y border-sky-100 py-6">
            <div className="text-sm text-sky-900/60">参与权益使用周期的鉴定服务卡</div>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-5xl font-semibold text-sky-950">1</span>
              <span className="pb-2 text-sky-900/70">张</span>
            </div>
          </div>
          <div className="pt-6">
            <div className="text-sm text-sky-900/60">积分计量单位</div>
            <div className="mt-2 text-5xl font-semibold text-sky-950">{CARD_POINTS}</div>
          </div>
          <p className="mt-6 border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
            1 张服务卡对应 1000 积分计量单位，用于平台权益核算，不代表现金价值或任何固定收益。
          </p>
        </div>

        <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
          <BadgeCheck className="h-7 w-7 text-sky-700" />
          <h2 className="mt-5 text-2xl font-semibold text-sky-950">权益积分规则</h2>
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
                  <span className="text-sm text-sky-900/60">积分奖励比例</span>
                </div>
                <div className="mt-4 text-4xl font-semibold text-sky-950">
                  {(plan.annualRate * 100).toFixed(0)}%
                </div>
                <p className="mt-3 text-sm leading-6 text-sky-900/60">按平台规则累计积分</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Rights Estimate</p>
          <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">权益积分测算</h2>
          <p className="mt-6 leading-8 text-sky-900/70">
            输入计划参与权益使用周期的鉴定服务卡数量，选择周期，即可按平台规则测算可能累计的积分。
          </p>
        </div>

        <div className="border border-sky-100 bg-white p-6 shadow-sm">
          <label className="text-sm font-semibold text-sky-950" htmlFor="stake-card-count">
            鉴定服务卡数量
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
                积分计量单位
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{formatPoints(estimate.principal)} 单位</div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <CalendarDays className="h-4 w-4" />
                权益使用周期
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{selectedPlan.months} 个月</div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <Gift className="h-4 w-4" />
                预计累计积分
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{formatPoints(estimate.totalAirdrop)} 积分</div>
            </div>
            <div className="bg-sky-50 p-5">
              <div className="flex items-center gap-2 text-sm text-sky-900/60">
                <ShieldCheck className="h-4 w-4" />
                按日折算积分
              </div>
              <div className="mt-3 text-2xl font-semibold text-sky-950">{formatPoints(estimate.dailyAirdrop)} 积分</div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateStake}
            disabled={!isConnected || busyAction === "stake"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-900/40"
          >
            {busyAction === "stake" ? "提交中..." : "提交权益使用周期"}
          </button>

          <p className="mt-6 text-sm leading-7 text-sky-900/60">
            测算以 1 张服务卡对应 1000 积分计量单位、每月 30 天估算。该计量单位仅用于平台权益核算，不代表现金价值、固定收益或服务卡可直接兑换积分。最终积分记录以平台规则与线上记录为准。
          </p>
        </div>
      </section>

      <section className="border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Transfer Service Queue</p>
            <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">服务卡转让/退出服务申请</h2>
            <p className="mt-6 leading-8 text-sky-900/70">
              可操作的鉴定服务卡可提交转让/退出服务申请，由平台协助登记；是否成交取决于市场需求、规则审核和实际服务进度，平台不承诺成交。
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
              转让/退出服务申请数量
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
              {busyAction === "buyback" ? "提交中..." : "提交转让/退出服务申请"}
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
              平台仅协助登记与服务对接，不承诺成交价格、成交时间或退出结果。
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-0 sm:py-24">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-sky-950">我的权益使用周期记录</h2>
            <div className="mt-5 space-y-3">
              {userStakes.length === 0 ? (
                <p className="text-sm leading-7 text-sky-900/60">暂无权益使用周期记录。</p>
              ) : (
                userStakes.map((item) => (
                  <div key={item.id} className="border border-sky-100 bg-sky-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-semibold text-sky-950">
                        {item.cardCount} 张 / {item.months} 个月
                      </div>
                      <div className="text-sm text-sky-700">
                        {item.status === "active" ? "权益保留期中" : "已释放"}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-sky-900/60">
                      积分奖励比例 {(item.annualRate * 100).toFixed(0)}% / {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-sky-950">我的转让/退出服务申请</h2>
            <div className="mt-5 space-y-3">
              {userBuybackRequests.length === 0 ? (
                <p className="text-sm leading-7 text-sky-900/60">暂无转让/退出服务申请。</p>
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
                          {item.cardCount} 张 / 转让服务登记
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
