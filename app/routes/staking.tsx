import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAccount, useReadContract } from "wagmi";
import { type Abi } from "viem";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Gift,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import fnftAbi from "@/abi/fnft.json";
import RightsBoundaryNotice from "@/components/biz/RightsBoundaryNotice";
import ConnectButton from "@/components/wallet/ConnectButton";
import {
  formatPhenix,
  isConfigured,
  STAKING_PLANS,
  useFnftStakingActions,
  useFnftTokenIds,
  useStakingPlans,
  useStakingPoolStatus,
  useStakingPositions,
} from "@/hooks/useFnftStaking";
import {
  ACTIVE_FNFT_STAKING_ADDRESS,
  STAKING_FNFT_ADDRESS,
} from "@/lib/constants";
import { STAKING_CHAIN } from "@/lib/staking-chain";

const serviceCardAbi = fnftAbi as Abi;

function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function formatDays(days: number) {
  if (days % 30 === 0) return `${days / 30} 个月`;
  return `${days} 天`;
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function chunkUnstakePositionIds(
  positionIds: string[],
  positions: Array<{ idText: string; tokenCount: number }>,
) {
  const tokenCounts = new Map(positions.map((position) => [position.idText, position.tokenCount]));
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentTransfers = 0;

  for (const positionId of positionIds) {
    const tokenCount = tokenCounts.get(positionId) ?? 0;
    const nextWouldOverflow =
      currentChunk.length >= 20 || currentTransfers + tokenCount > 100;

    if (nextWouldOverflow && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentTransfers = 0;
    }

    currentChunk.push(positionId);
    currentTransfers += tokenCount;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function meta() {
  return [
    { title: "F-NFT Staking | PHENIX" },
    { name: "description", content: "Stake F-NFT service cards on-chain to earn PHENIX rewards." },
  ];
}

export default function Staking() {
  const { address, isConnected } = useAccount();
  const [selectedPlanId, setSelectedPlanId] = useState<number>(2);
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [selectedPositionIds, setSelectedPositionIds] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<"stake" | "claim" | "unstake" | null>(null);

  const configured = isConfigured(ACTIVE_FNFT_STAKING_ADDRESS) && isConfigured(STAKING_FNFT_ADDRESS);

  const {
    data: walletTokenIds = [],
    isLoading: tokenIdsLoading,
    refetch: refetchTokenIds,
  } = useFnftTokenIds();
  const { data: stakingPlans = STAKING_PLANS } = useStakingPlans();
  const {
    data: positions = [],
    isLoading: positionsLoading,
    refetch: refetchPositions,
  } = useStakingPositions();
  const {
    data: poolStatus,
    isLoading: poolLoading,
    refetch: refetchPoolStatus,
  } = useStakingPoolStatus();
  const { configured: actionsConfigured, stake, claim, unstakeTo } = useFnftStakingActions();

  const { data: isApprovedForAll = false } = useReadContract({
    address:
      configured && isConnected
        ? (STAKING_FNFT_ADDRESS as `0x${string}`)
        : undefined,
    abi: serviceCardAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, ACTIVE_FNFT_STAKING_ADDRESS as `0x${string}`] : undefined,
    chainId: STAKING_CHAIN.id,
    query: {
      enabled: configured && isConnected && !!address,
      refetchOnWindowFocus: true,
    },
  });

  const selectedPlan =
    stakingPlans.find((plan) => plan.id === selectedPlanId) ?? STAKING_PLANS[2];
  const plansById = useMemo(
    () => new Map(stakingPlans.map((plan) => [plan.id, plan])),
    [stakingPlans],
  );
  const now = Math.floor(Date.now() / 1000);

  const totalClaimable = useMemo(
    () => positions.reduce((sum, position) => sum + position.claimable, 0n),
    [positions],
  );
  const activePositions = useMemo(
    () => positions.filter((position) => !position.nftWithdrawn),
    [positions],
  );
  const unlockablePositions = useMemo(
    () => activePositions.filter((position) => position.unlockTime <= now),
    [activePositions, now],
  );
  const selectedRewardPreview =
    selectedPlan ? BigInt(selectedTokenIds.length) * selectedPlan.rewardPerNft : 0n;

  async function refreshAll() {
    await Promise.all([refetchTokenIds(), refetchPositions(), refetchPoolStatus()]);
  }

  function toggleToken(tokenId: string) {
    setSelectedTokenIds((current) => {
      if (current.includes(tokenId)) {
        return current.filter((item) => item !== tokenId);
      }

      if (current.length >= 50) {
        toast.error("单个仓位最多选择 50 张 F-NFT");
        return current;
      }

      return [...current, tokenId];
    });
  }

  function togglePosition(positionId: string) {
    setSelectedPositionIds((current) => {
      if (current.includes(positionId)) {
        return current.filter((item) => item !== positionId);
      }

      if (current.length >= 20) {
        toast.error("单次最多选择 20 个仓位");
        return current;
      }

      return [...current, positionId];
    });
  }

  async function handleStake() {
    if (!selectedTokenIds.length) {
      toast.error("请先选择要质押的 F-NFT");
      return;
    }
    if (!actionsConfigured) {
      toast.error("Staking contract is not configured");
      return;
    }

    setBusyAction("stake");
    try {
      await stake(selectedTokenIds, selectedPlanId);
      setSelectedTokenIds([]);
      await refreshAll();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleClaim(positionIds: string[]) {
    if (!positionIds.length) {
      toast.error("没有可领取奖励的仓位");
      return;
    }
    if (!poolStatus?.rewardSolvent) {
      toast.error("奖励池不足，claim 暂停");
      return;
    }

    setBusyAction("claim");
    try {
      for (const batch of chunkArray(positionIds, 20)) {
        await claim(batch);
      }
      setSelectedPositionIds((current) => current.filter((id) => !positionIds.includes(id)));
      await refreshAll();
    } finally {
      setBusyAction(null);
    }
  }

  async function handleUnstake(positionIds: string[]) {
    if (!positionIds.length) {
      toast.error("没有可提取的仓位");
      return;
    }

    const nftTransfers = positions
      .filter((position) => positionIds.includes(position.idText))
      .reduce((sum, position) => sum + position.tokenCount, 0);
    if (nftTransfers > 100) {
      toast.message("将分批提取，单笔最多处理 100 张 F-NFT");
    }

    setBusyAction("unstake");
    try {
      for (const batch of chunkUnstakePositionIds(positionIds, positions)) {
        await unstakeTo(batch);
      }
      setSelectedPositionIds((current) => current.filter((id) => !positionIds.includes(id)));
      await refreshAll();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <div className="-mx-4 md:mx-0">
      <section className="border-b border-sky-100 bg-white/80 px-4 py-16 sm:px-0 sm:py-24">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">F-NFT Staking</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-sky-950 sm:text-6xl">
            将服务卡质押到链上，按锁仓周期领取 PHENIX
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-sky-900/70">
            质押流程已切换为链上合约执行。钱包中的 F-NFT 会直接转入 staking 合约，奖励按仓位线性释放，到期后可提取原卡。
          </p>
          <RightsBoundaryNotice className="mt-6 max-w-3xl" compact />
          <div className="mt-6 border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-900/70">
            当前网络：{STAKING_CHAIN.name}。开发环境默认读取 Base Sepolia，生产环境读取 Base。
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/assets"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              查看我的资产
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/membership"
              className="inline-flex items-center justify-center gap-2 border border-sky-300 px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50"
            >
              查看会员体系
            </Link>
          </div>
        </div>
      </section>

      {!configured && (
        <section className="px-4 py-16 sm:px-0">
          <div className="border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
            <h2 className="text-xl font-semibold">Staking contract not configured</h2>
            <p className="mt-3 text-sm leading-6">
              请在 `app/lib/constants.ts` 中设置当前 staking 网络和公开合约地址。
              Cloudflare 部署不依赖前端 `.env` 注入。
            </p>
          </div>
        </section>
      )}

      {configured && (
        <>
          <section className="grid gap-4 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-4">
            <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <WalletCards className="h-7 w-7 text-sky-700" />
              <h2 className="mt-5 text-xl font-semibold text-sky-950">钱包中 F-NFT</h2>
              <div className="mt-5 text-5xl font-semibold text-sky-950">
                {isConnected ? walletTokenIds.length : "-"}
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-900/60">可直接选中并创建新仓位。</p>
            </div>

            <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <ShieldCheck className="h-7 w-7 text-sky-700" />
              <h2 className="mt-5 text-xl font-semibold text-sky-950">活跃仓位</h2>
              <div className="mt-5 text-5xl font-semibold text-sky-950">
                {isConnected ? activePositions.length : "-"}
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-900/60">未提取原卡的 staking positions。</p>
            </div>

            <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <Gift className="h-7 w-7 text-sky-700" />
              <h2 className="mt-5 text-xl font-semibold text-sky-950">待领取奖励</h2>
              <div className="mt-5 text-5xl font-semibold text-sky-950">
                {isConnected ? formatPhenix(totalClaimable) : "-"}
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-900/60">按当前区块时间可领取的 PHENIX。</p>
            </div>

            <div className="border border-sky-100 bg-white/80 p-6 shadow-sm">
              <Coins className="h-7 w-7 text-sky-700" />
              <h2 className="mt-5 text-xl font-semibold text-sky-950">奖励池状态</h2>
              <div className="mt-5 text-3xl font-semibold text-sky-950">
                {poolLoading || !poolStatus ? "-" : formatPhenix(poolStatus.balance)}
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-900/60">
                {poolStatus?.rewardSolvent ? "奖励池充足" : "奖励池存在缺口"}
              </p>
            </div>
          </section>

          {!isConnected && (
            <section className="px-4 pb-16 sm:px-0">
              <div className="border border-sky-100 bg-white/80 p-8 shadow-sm">
                <WalletCards className="h-7 w-7 text-sky-700" />
                <h2 className="mt-5 text-xl font-semibold text-sky-950">连接钱包开始质押</h2>
                <p className="mt-3 leading-7 text-sky-900/70">
                  连接后可读取持仓、授权 staking 合约，并提交 stake、claim、unstake 交易。
                </p>
                <div className="mt-6">
                  <ConnectButton />
                </div>
              </div>
            </section>
          )}

          {isConnected && (
            <>
              <section className="grid gap-8 border-y border-sky-100 bg-white/70 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Create Position</p>
                  <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">选择 F-NFT 并创建质押仓位</h2>
                  <p className="mt-6 leading-8 text-sky-900/70">
                    首次质押会先请求 `setApprovalForAll` 授权。合约限制单仓位最多 50 张卡，单次最多处理 20 个仓位。
                  </p>
                  <div className="mt-6 border border-sky-100 bg-sky-50/70 p-4 text-sm leading-6 text-sky-900/70">
                    当前授权状态：{isApprovedForAll ? "已授权" : "未授权"}。
                  </div>
                </div>

                <div className="border border-sky-100 bg-white p-6 shadow-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {stakingPlans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`border p-5 text-left transition ${
                          selectedPlanId === plan.id
                            ? "border-sky-400 bg-sky-50 text-sky-950"
                            : "border-sky-100 bg-white text-sky-950 hover:bg-sky-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-lg font-semibold">{plan.months} 个月</span>
                          <span className="text-sm text-sky-900/60">{plan.annualRate}</span>
                        </div>
                        <div className="mt-3 text-sm text-sky-900/60">锁仓 {formatDays(plan.lockDays)}</div>
                        <div className="mt-2 text-2xl font-semibold text-sky-950">
                          {formatPhenix(plan.rewardPerNft)} PHENIX
                        </div>
                        <p className="mt-2 text-sm leading-6 text-sky-900/60">每张 F-NFT 的总奖励</p>
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 border border-sky-100 bg-sky-50 p-5">
                    <div className="text-sm text-sky-900/60">已选 F-NFT</div>
                    <div className="mt-2 text-3xl font-semibold text-sky-950">{selectedTokenIds.length} 张</div>
                    <div className="mt-2 text-sm text-sky-900/60">
                      预计总奖励 {formatPhenix(selectedRewardPreview)} PHENIX
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg font-semibold text-sky-950">可质押的 F-NFT</h3>
                      {tokenIdsLoading && <span className="text-sm text-sky-900/60">读取中...</span>}
                    </div>

                    {walletTokenIds.length === 0 && !tokenIdsLoading && (
                      <div className="mt-4 border border-dashed border-sky-200 bg-sky-50/60 p-6 text-sm leading-6 text-sky-900/70">
                        当前钱包没有可质押的 F-NFT，或该账户持仓超过前端显示上限。
                      </div>
                    )}

                    {walletTokenIds.length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {walletTokenIds.map((tokenId) => {
                          const selected = selectedTokenIds.includes(tokenId);
                          return (
                            <button
                              key={tokenId}
                              type="button"
                              onClick={() => toggleToken(tokenId)}
                              className={`border p-4 text-left transition ${
                                selected
                                  ? "border-sky-400 bg-sky-50"
                                  : "border-sky-100 bg-white hover:bg-sky-50"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-lg font-semibold text-sky-950">#{tokenId}</div>
                                {selected && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                    已选择
                                  </span>
                                )}
                              </div>
                              <div className="mt-2 text-sm text-sky-900/60">将转入 staking 合约托管</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleStake}
                    disabled={busyAction === "stake" || selectedTokenIds.length === 0}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-900/40"
                  >
                    {busyAction === "stake" ? "提交中..." : "创建质押仓位"}
                  </button>
                </div>
              </section>

              <section className="grid gap-8 px-4 py-16 sm:px-0 sm:py-24 lg:grid-cols-[0.85fr_1.15fr]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Rewards</p>
                  <h2 className="mt-4 text-3xl font-semibold text-sky-950 sm:text-5xl">领取奖励与提取原卡</h2>
                  <p className="mt-6 leading-8 text-sky-900/70">
                    奖励按仓位线性释放。到期前只能 claim，不能 unstake；到期后可将 F-NFT 提取回当前钱包。
                  </p>
                  {poolStatus && (
                    <div className="mt-6 space-y-3 border border-sky-100 bg-sky-50/70 p-5 text-sm text-sky-900/70">
                      <div>合约 PHENIX 余额：{formatPhenix(poolStatus.balance)}</div>
                      <div>已预留奖励：{formatPhenix(poolStatus.reservedRewards)}</div>
                      <div>奖励池缺口：{formatPhenix(poolStatus.rewardDeficit)}</div>
                    </div>
                  )}
                </div>

                <div className="border border-sky-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() =>
                        handleClaim(
                          positions.filter((position) => position.claimable > 0n).map((position) => position.idText),
                        )
                      }
                      disabled={busyAction !== null || totalClaimable === 0n || !poolStatus?.rewardSolvent}
                      className="inline-flex flex-1 items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-900/40"
                    >
                      {busyAction === "claim" ? "领取中..." : "领取全部可用奖励"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUnstake(unlockablePositions.map((position) => position.idText))
                      }
                      disabled={busyAction !== null || unlockablePositions.length === 0}
                      className="inline-flex flex-1 items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-sky-200 disabled:text-sky-900/40"
                    >
                      {busyAction === "unstake" ? "提取中..." : "提取全部已到期仓位"}
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    {positionsLoading && (
                      <div className="border border-sky-100 bg-sky-50/60 p-6 text-sm text-sky-900/70">
                        正在读取 staking 仓位...
                      </div>
                    )}

                    {!positionsLoading && positions.length === 0 && (
                      <div className="border border-dashed border-sky-200 bg-sky-50/60 p-6 text-sm leading-6 text-sky-900/70">
                        当前账户还没有 staking 仓位。
                      </div>
                    )}

                    {positions.map((position) => {
                      const selected = selectedPositionIds.includes(position.idText);
                      const unlocked = position.unlockTime <= now;
                      return (
                        <div key={position.idText} className="border border-sky-100 bg-sky-50/70 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="text-lg font-semibold text-sky-950">
                                Position #{position.idText}
                              </div>
                              <div className="mt-2 text-sm text-sky-900/60">
                                {position.tokenCount} 张 F-NFT /{" "}
                                {plansById.has(position.planId)
                                  ? formatDays(plansById.get(position.planId)?.lockDays ?? 0)
                                  : "-"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => togglePosition(position.idText)}
                              className={`border px-3 py-1.5 text-xs font-semibold transition ${
                                selected
                                  ? "border-sky-400 bg-white text-sky-950"
                                  : "border-sky-200 bg-sky-50 text-sky-900/70 hover:bg-white"
                              }`}
                            >
                              {selected ? "已选中" : "选择仓位"}
                            </button>
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="bg-white p-4">
                              <div className="text-sm text-sky-900/60">可领取奖励</div>
                              <div className="mt-2 text-2xl font-semibold text-sky-950">
                                {formatPhenix(position.claimable)}
                              </div>
                            </div>
                            <div className="bg-white p-4">
                              <div className="text-sm text-sky-900/60">总奖励</div>
                              <div className="mt-2 text-2xl font-semibold text-sky-950">
                                {formatPhenix(position.totalReward)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 text-sm leading-7 text-sky-900/70">
                            <div>开始时间：{formatDateTime(position.startTime)}</div>
                            <div>解锁时间：{formatDateTime(position.unlockTime)}</div>
                            <div>已领取：{formatPhenix(position.claimedReward)} PHENIX</div>
                            <div>包含卡号：{position.tokenIds.map((tokenId) => `#${tokenId}`).join(", ")}</div>
                            <div>状态：{position.nftWithdrawn ? "已提取" : unlocked ? "已到期，可提取" : "锁仓中"}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedPositionIds.length > 0 && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleClaim(
                            positions
                              .filter(
                                (position) =>
                                  selectedPositionIds.includes(position.idText) && position.claimable > 0n,
                              )
                              .map((position) => position.idText),
                          )
                        }
                        disabled={busyAction !== null || !poolStatus?.rewardSolvent}
                        className="inline-flex items-center justify-center gap-2 border border-sky-900 bg-sky-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:border-sky-200 disabled:bg-sky-100 disabled:text-sky-900/40"
                      >
                        领取选中仓位奖励
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUnstake(
                            positions
                              .filter(
                                (position) =>
                                  selectedPositionIds.includes(position.idText) &&
                                  !position.nftWithdrawn &&
                                  position.unlockTime <= now,
                              )
                              .map((position) => position.idText),
                          )
                        }
                        disabled={busyAction !== null}
                        className="inline-flex items-center justify-center gap-2 border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-950 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-sky-200 disabled:text-sky-900/40"
                      >
                        提取选中已到期仓位
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
