export type StakingRecordStatus = "active" | "released";
export type BuybackRequestStatus = "pending" | "completed" | "cancelled";

export interface StakingRecord {
  id: string;
  address: string;
  cardCount: number;
  months: number;
  annualRate: number;
  status: StakingRecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BuybackRequest {
  id: string;
  address: string;
  cardCount: number;
  payoutCurrency: "RMB";
  status: BuybackRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StakingStorageDocument {
  version: 1;
  updatedAt: string;
  stakes: Record<string, StakingRecord>;
  buybackRequests: Record<string, BuybackRequest>;
}

export interface CreateStakePayload {
  type: "stake";
  address: string;
  cardCount: number;
  ownedCardCount: number;
  months: number;
  annualRate: number;
}

export interface CreateBuybackPayload {
  type: "buyback";
  address: string;
  cardCount: number;
  ownedCardCount: number;
}

export type StakingStoragePayload = CreateStakePayload | CreateBuybackPayload;

export const STAKING_STORAGE_ROUTE = "/staking/storage" as const;

export function trimStakingStorageString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function normalizeWalletAddress(value: unknown) {
  const address = trimStakingStorageString(value).toLowerCase();
  return /^0x[a-f0-9]{40}$/.test(address) ? address : "";
}

export function normalizePositiveInteger(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numberValue)) return 0;
  return Math.max(Math.floor(numberValue), 0);
}

export function emptyStakingStorageDocument(
  updatedAt = new Date().toISOString(),
): StakingStorageDocument {
  return {
    version: 1,
    updatedAt,
    stakes: {},
    buybackRequests: {},
  };
}

export function cloneStakingStorageDocument(
  document: StakingStorageDocument,
): StakingStorageDocument {
  return {
    version: 1,
    updatedAt: document.updatedAt,
    stakes: Object.fromEntries(
      Object.entries(document.stakes).map(([id, item]) => [id, { ...item }]),
    ),
    buybackRequests: Object.fromEntries(
      Object.entries(document.buybackRequests).map(([id, item]) => [
        id,
        { ...item },
      ]),
    ),
  };
}

function normalizeStakingRecord(
  id: string,
  value: Partial<StakingRecord>,
): StakingRecord | null {
  const address = normalizeWalletAddress(value.address);
  const cardCount = normalizePositiveInteger(value.cardCount);
  const months = normalizePositiveInteger(value.months);
  const annualRate =
    typeof value.annualRate === "number" && Number.isFinite(value.annualRate)
      ? value.annualRate
      : 0;
  const createdAt = trimStakingStorageString(value.createdAt);
  const updatedAt = trimStakingStorageString(value.updatedAt) || createdAt;
  const status: StakingRecordStatus =
    value.status === "released" ? "released" : "active";

  if (!id || !address || cardCount <= 0 || months <= 0 || annualRate <= 0 || !createdAt) {
    return null;
  }

  return {
    id,
    address,
    cardCount,
    months,
    annualRate,
    status,
    createdAt,
    updatedAt,
  };
}

function normalizeBuybackRequest(
  id: string,
  value: Partial<BuybackRequest>,
): BuybackRequest | null {
  const address = normalizeWalletAddress(value.address);
  const cardCount = normalizePositiveInteger(value.cardCount);
  const createdAt = trimStakingStorageString(value.createdAt);
  const updatedAt = trimStakingStorageString(value.updatedAt) || createdAt;
  const status: BuybackRequestStatus =
    value.status === "completed" || value.status === "cancelled"
      ? value.status
      : "pending";

  if (!id || !address || cardCount <= 0 || !createdAt) {
    return null;
  }

  return {
    id,
    address,
    cardCount,
    payoutCurrency: "RMB",
    status,
    createdAt,
    updatedAt,
  };
}

export function normalizeStakingStorageDocument(
  input: unknown,
): StakingStorageDocument {
  const candidate =
    input && typeof input === "object"
      ? (input as Partial<StakingStorageDocument>)
      : {};
  const rawStakes =
    candidate.stakes && typeof candidate.stakes === "object"
      ? candidate.stakes
      : {};
  const rawBuybackRequests =
    candidate.buybackRequests && typeof candidate.buybackRequests === "object"
      ? candidate.buybackRequests
      : {};

  const stakes: Record<string, StakingRecord> = {};
  const buybackRequests: Record<string, BuybackRequest> = {};

  for (const [rawId, rawValue] of Object.entries(rawStakes)) {
    if (!rawValue || typeof rawValue !== "object") continue;

    const value = rawValue as Partial<StakingRecord>;
    const id = trimStakingStorageString(value.id) || String(rawId);
    const record = normalizeStakingRecord(id, value);

    if (record) {
      stakes[record.id] = record;
    }
  }

  for (const [rawId, rawValue] of Object.entries(rawBuybackRequests)) {
    if (!rawValue || typeof rawValue !== "object") continue;

    const value = rawValue as Partial<BuybackRequest>;
    const id = trimStakingStorageString(value.id) || String(rawId);
    const request = normalizeBuybackRequest(id, value);

    if (request) {
      buybackRequests[request.id] = request;
    }
  }

  return {
    version: 1,
    updatedAt: trimStakingStorageString(candidate.updatedAt) || new Date().toISOString(),
    stakes,
    buybackRequests,
  };
}
