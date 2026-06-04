import { useQuery } from "@tanstack/react-query";
import { formatUnits, type Abi, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain } from "wagmi";
import { toast } from "sonner";

import fnftAbi from "@/abi/fnft.json";
import fnftStakingAbi from "@/abi/fnft-staking.json";
import erc20Abi from "@/abi/erc20.json";
import { useSafeContractWrite } from "@/hooks/useSafeContractWrite";
import {
  ACTIVE_FNFT_STAKING_ADDRESS,
  PHENIX_DECIMALS,
  STAKING_FNFT_ADDRESS,
  STAKING_PHENIX_ADDRESS,
  ZERO_ADDRESS,
} from "@/lib/constants";
import { STAKING_CHAIN } from "@/lib/staking-chain";

const stakingAbi = fnftStakingAbi as Abi;
const serviceCardAbi = fnftAbi as Abi;
const tokenAbi = erc20Abi as Abi;

export type StakingPlan = {
  id: number;
  months: number;
  lockDays: number;
  annualRate: string;
  rewardPerNft: bigint;
};

export const STAKING_PLANS: readonly StakingPlan[] = [
  { id: 0, months: 3, lockDays: 90, annualRate: "4%", rewardPerNft: 10n * 10n ** 18n },
  { id: 1, months: 6, lockDays: 180, annualRate: "5%", rewardPerNft: 25n * 10n ** 18n },
  { id: 2, months: 12, lockDays: 360, annualRate: "8%", rewardPerNft: 80n * 10n ** 18n },
  { id: 3, months: 24, lockDays: 720, annualRate: "10%", rewardPerNft: 200n * 10n ** 18n },
] as const;

const MAX_UI_TOKEN_IDS = 200;
const POSITIONS_PAGE_SIZE = 100n;

export function isConfigured(address: string): address is Address {
  return address !== ZERO_ADDRESS && /^0x[a-fA-F0-9]{40}$/.test(address);
}

function toAddress(address: string): Address {
  return address as Address;
}

function asBigInt(value: unknown) {
  return typeof value === "bigint" ? value : BigInt(value?.toString() ?? "0");
}

function asNumber(value: unknown) {
  return Number(asBigInt(value));
}

function normalizePosition(raw: any) {
  return {
    owner: (raw.owner ?? raw[0]) as Address,
    planId: Number(raw.planId ?? raw[1]),
    startTime: asNumber(raw.startTime ?? raw[2]),
    unlockTime: asNumber(raw.unlockTime ?? raw[3]),
    tokenCount: asNumber(raw.tokenCount ?? raw[4]),
    totalReward: asBigInt(raw.totalReward ?? raw[5]),
    claimedReward: asBigInt(raw.claimedReward ?? raw[6]),
    nftWithdrawn: Boolean(raw.nftWithdrawn ?? raw[7]),
  };
}

export function formatPhenix(value: bigint) {
  const formatted = formatUnits(value, PHENIX_DECIMALS);
  const [whole, fraction = ""] = formatted.split(".");
  const trimmed = fraction.slice(0, 4).replace(/0+$/, "");
  return trimmed ? `${whole}.${trimmed}` : whole;
}

export function useFnftTokenIds() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: STAKING_CHAIN.id });
  const enabled = !!address && !!publicClient && isConfigured(STAKING_FNFT_ADDRESS);

  return useQuery({
    queryKey: ["staking-fnft-token-ids", STAKING_CHAIN.id, STAKING_FNFT_ADDRESS, address],
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!address || !publicClient || !isConfigured(STAKING_FNFT_ADDRESS)) return [];
      const fnftAddress = toAddress(STAKING_FNFT_ADDRESS);

      const balance = await publicClient.readContract({
        address: fnftAddress,
        abi: serviceCardAbi,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;

      const visibleCount = Math.min(Number(balance), MAX_UI_TOKEN_IDS);
      const tokenIds = await Promise.all(
        Array.from({ length: visibleCount }, (_, index) =>
          publicClient.readContract({
            address: fnftAddress,
            abi: serviceCardAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(index)],
          }) as Promise<bigint>,
        ),
      );

      return tokenIds.map((tokenId) => tokenId.toString());
    },
  });
}

export function useStakingPlans() {
  const publicClient = usePublicClient({ chainId: STAKING_CHAIN.id });
  const enabled = !!publicClient && isConfigured(ACTIVE_FNFT_STAKING_ADDRESS);

  return useQuery({
    queryKey: ["staking-plans", STAKING_CHAIN.id, ACTIVE_FNFT_STAKING_ADDRESS],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<StakingPlan[]> => {
      if (!publicClient || !isConfigured(ACTIVE_FNFT_STAKING_ADDRESS)) return [...STAKING_PLANS];
      const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

      const planRows = await Promise.all(
        STAKING_PLANS.map(async (fallbackPlan) => {
          const planInfo = await publicClient.readContract({
            address: stakingAddress,
            abi: stakingAbi,
            functionName: "planInfo",
            args: [fallbackPlan.id],
          }) as readonly [bigint, bigint, bigint, bigint];

          return {
            ...fallbackPlan,
            lockDays: Number(planInfo[2] / 86400n),
            rewardPerNft: planInfo[3],
          };
        }),
      );

      return planRows;
    },
    placeholderData: [...STAKING_PLANS],
  });
}

export function useStakingPositions() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: STAKING_CHAIN.id });
  const enabled = !!address && !!publicClient && isConfigured(ACTIVE_FNFT_STAKING_ADDRESS);

  return useQuery({
    queryKey: ["staking-positions", STAKING_CHAIN.id, ACTIVE_FNFT_STAKING_ADDRESS, address],
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!address || !publicClient || !isConfigured(ACTIVE_FNFT_STAKING_ADDRESS)) return [];
      const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

      const countRaw = await publicClient.readContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: "userPositionCount",
        args: [address],
      }) as bigint;

      const count = Number(countRaw);
      const pages = Math.ceil(count / Number(POSITIONS_PAGE_SIZE));
      const ids: bigint[] = [];

      for (let page = 0; page < pages; page++) {
        const pageIds = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "positionsOf",
          args: [address, BigInt(page) * POSITIONS_PAGE_SIZE, POSITIONS_PAGE_SIZE],
        }) as bigint[];
        ids.push(...pageIds);
      }

      const rows = await Promise.all(
        ids.map(async (positionId) => {
          const [infoRaw, claimableRaw, tokenIdsRaw] = await Promise.all([
            publicClient.readContract({
              address: stakingAddress,
              abi: stakingAbi,
              functionName: "positionInfo",
              args: [positionId],
            }),
            publicClient.readContract({
              address: stakingAddress,
              abi: stakingAbi,
              functionName: "claimable",
              args: [positionId],
            }) as Promise<bigint>,
            publicClient.readContract({
              address: stakingAddress,
              abi: stakingAbi,
              functionName: "positionTokenIds",
              args: [positionId],
            }) as Promise<bigint[]>,
          ]);
          const info = normalizePosition(infoRaw);

          return {
            id: positionId,
            idText: positionId.toString(),
            ...info,
            claimable: claimableRaw,
            tokenIds: tokenIdsRaw.map((tokenId) => tokenId.toString()),
          };
        }),
      );

      return rows.sort((a, b) => Number(b.id - a.id));
    },
  });
}

export function useStakingPoolStatus() {
  const publicClient = usePublicClient({ chainId: STAKING_CHAIN.id });
  const enabled = !!publicClient && isConfigured(ACTIVE_FNFT_STAKING_ADDRESS);

  return useQuery({
    queryKey: ["staking-pool-status", STAKING_CHAIN.id, ACTIVE_FNFT_STAKING_ADDRESS, STAKING_PHENIX_ADDRESS],
    enabled,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      if (!publicClient || !isConfigured(ACTIVE_FNFT_STAKING_ADDRESS)) {
        return {
          balance: 0n,
          reservedRewards: 0n,
          rewardDeficit: 0n,
          rewardSolvent: false,
          paused: false,
          permanentlyStopped: false,
        };
      }
      const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

      const [balance, reservedRewards, rewardDeficit, rewardSolvent, paused, permanentlyStopped] = await Promise.all([
        isConfigured(STAKING_PHENIX_ADDRESS)
          ? publicClient.readContract({
              address: toAddress(STAKING_PHENIX_ADDRESS),
              abi: tokenAbi,
              functionName: "balanceOf",
              args: [stakingAddress],
            }) as Promise<bigint>
          : Promise.resolve(0n),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "reservedRewards",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "rewardDeficit",
        }) as Promise<bigint>,
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "rewardSolvent",
        }) as Promise<boolean>,
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "paused",
        }) as Promise<boolean>,
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: "permanentlyStopped",
        }) as Promise<boolean>,
      ]);

      return {
        balance,
        reservedRewards,
        rewardDeficit,
        rewardSolvent,
        paused,
        permanentlyStopped,
      };
    },
  });
}

export function useFnftStakingActions() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient({ chainId: STAKING_CHAIN.id });
  const { switchChainAsync } = useSwitchChain();
  const { write } = useSafeContractWrite();

  const configured = isConfigured(ACTIVE_FNFT_STAKING_ADDRESS) && isConfigured(STAKING_FNFT_ADDRESS);

  const ensureStakingChain = async () => {
    if (chainId === STAKING_CHAIN.id) return;

    try {
      await switchChainAsync({ chainId: STAKING_CHAIN.id });
    } catch (error) {
      toast.error(`Switch wallet to ${STAKING_CHAIN.name}`);
      throw error;
    }
  };

  const approveAll = async () => {
    if (!address || !publicClient || !configured) {
      toast.error("Staking contract is not ready");
      return;
    }
    await ensureStakingChain();

    const fnftAddress = toAddress(STAKING_FNFT_ADDRESS);
    const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

    const simulation = await publicClient.simulateContract({
      address: fnftAddress,
      abi: serviceCardAbi,
      functionName: "setApprovalForAll",
      args: [stakingAddress, true],
      account: address,
    });

    await write(simulation.request, publicClient);
  };

  const stake = async (tokenIds: string[], planId: number) => {
    if (!address || !publicClient || !configured) {
      toast.error("Staking contract is not ready");
      return;
    }
    if (tokenIds.length === 0) {
      toast.error("Select at least one F-NFT");
      return;
    }
    await ensureStakingChain();

    const fnftAddress = toAddress(STAKING_FNFT_ADDRESS);
    const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

    const approved = await publicClient.readContract({
      address: fnftAddress,
      abi: serviceCardAbi,
      functionName: "isApprovedForAll",
      args: [address, stakingAddress],
    }) as boolean;

    if (!approved) {
      await approveAll();
    }

    const simulation = await publicClient.simulateContract({
      address: stakingAddress,
      abi: stakingAbi,
      functionName: "stake",
      args: [tokenIds.map((tokenId) => BigInt(tokenId)), planId],
      account: address,
    });

    await write(simulation.request, publicClient);
  };

  const claim = async (positionIds: string[]) => {
    if (!address || !publicClient || !configured) {
      toast.error("Staking contract is not ready");
      return;
    }
    await ensureStakingChain();

    const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

    const simulation = await publicClient.simulateContract({
      address: stakingAddress,
      abi: stakingAbi,
      functionName: "claim",
      args: [positionIds.map((positionId) => BigInt(positionId))],
      account: address,
    });

    await write(simulation.request, publicClient);
  };

  const unstakeTo = async (positionIds: string[], recipient = address) => {
    if (!address || !recipient || !publicClient || !configured) {
      toast.error("Staking contract is not ready");
      return;
    }
    await ensureStakingChain();

    const stakingAddress = toAddress(ACTIVE_FNFT_STAKING_ADDRESS);

    const simulation = await publicClient.simulateContract({
      address: stakingAddress,
      abi: stakingAbi,
      functionName: "unstakeTo",
      args: [positionIds.map((positionId) => BigInt(positionId)), toAddress(recipient)],
      account: address,
    });

    await write(simulation.request, publicClient);
  };

  return {
    configured,
    approveAll,
    stake,
    claim,
    unstakeTo,
  };
}
