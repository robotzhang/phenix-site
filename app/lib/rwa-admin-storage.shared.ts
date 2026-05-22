export interface RwaAdminMetadata {
  tokenId: string;
  categoryLabel: string;
  sellerCategoryLabel: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  recipient?: string;
  pricePhenix?: string;
  fileHash?: string;
  imageURL?: string;
  imageURLs?: string[];
  tokenURI?: string;
  status?: number;
}

export type RwaAdminMetadataMap = Record<string, RwaAdminMetadata>;

export interface RwaAdminStorageDocument {
  version: 1;
  updatedAt: string;
  items: RwaAdminMetadataMap;
}

export interface RwaAdminMetadataInput {
  categoryLabel: string;
  sellerCategoryLabel: string;
  name?: string;
  recipient?: string;
  pricePhenix?: string;
  fileHash?: string;
  imageURL?: string;
  imageURLs?: string[];
  tokenURI?: string;
  status?: number;
}

export const RWA_ADMIN_STORAGE_ROUTE = "/admin/asset/storage" as const;
export const RWA_ADMIN_IMAGE_ROUTE = "/admin/asset/image" as const;

export function trimAdminStorageString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function cloneRwaAdminMetadataMap(map: RwaAdminMetadataMap) {
  return Object.fromEntries(
    Object.entries(map).map(([tokenId, metadata]) => [
      tokenId,
      { ...metadata },
    ]),
  ) as RwaAdminMetadataMap;
}

export function normalizeRwaAdminImageURLs(value: unknown) {
  if (!Array.isArray(value)) return undefined;

  const imageURLs = Array.from(
    new Set(
      value
        .map((item) => trimAdminStorageString(item))
        .filter(Boolean),
    ),
  );

  return imageURLs.length > 0 ? imageURLs.slice(0, 5) : undefined;
}

export function emptyRwaAdminStorageDocument(
  updatedAt = new Date().toISOString(),
): RwaAdminStorageDocument {
  return {
    version: 1,
    updatedAt,
    items: {},
  };
}

export function normalizeRwaAdminStorageDocument(
  input: unknown,
): RwaAdminStorageDocument {
  const candidate =
    input && typeof input === "object"
      ? (input as Partial<RwaAdminStorageDocument>)
      : {};
  const items =
    candidate.items && typeof candidate.items === "object"
      ? candidate.items
      : {};

  const normalizedItems: RwaAdminMetadataMap = {};

  for (const [tokenId, rawValue] of Object.entries(items)) {
    if (!rawValue || typeof rawValue !== "object") continue;

    const value = rawValue as Partial<RwaAdminMetadata>;
    const categoryLabel = trimAdminStorageString(value.categoryLabel);
    const sellerCategoryLabel = trimAdminStorageString(
      value.sellerCategoryLabel,
    );

    if (!categoryLabel || !sellerCategoryLabel) continue;

    const normalizedTokenId =
      trimAdminStorageString(value.tokenId) || String(tokenId);
    const createdAt =
      trimAdminStorageString(value.createdAt) || new Date().toISOString();
    const updatedAt = trimAdminStorageString(value.updatedAt) || createdAt;

    normalizedItems[normalizedTokenId] = {
      tokenId: normalizedTokenId,
      categoryLabel,
      sellerCategoryLabel,
      createdAt,
      updatedAt,
      name: trimAdminStorageString(value.name) || undefined,
      recipient: trimAdminStorageString(value.recipient) || undefined,
      pricePhenix: trimAdminStorageString(value.pricePhenix) || undefined,
      fileHash: trimAdminStorageString(value.fileHash) || undefined,
      imageURL: trimAdminStorageString(value.imageURL) || undefined,
      imageURLs: normalizeRwaAdminImageURLs(value.imageURLs),
      tokenURI: trimAdminStorageString(value.tokenURI) || undefined,
      status: typeof value.status === "number" ? value.status : undefined,
    };
  }

  return {
    version: 1,
    updatedAt: trimAdminStorageString(candidate.updatedAt) || new Date().toISOString(),
    items: normalizedItems,
  };
}
