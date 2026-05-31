import type { AppLoadContext } from "react-router";

import {
  PRODUCT_ASSETS,
  getProductAssetDisplayName,
  getProductAssetIdFromStorageKey,
  getProductAssetStorageKey,
  normalizeProductAssetCode,
} from "@/data/product-assets";
import {
  emptyRwaAdminStorageDocument,
  normalizeRwaAdminAssetURLs,
  trimAdminStorageString,
  type RwaAdminMetadata,
  type RwaAdminMetadataInput,
  type RwaAdminStorageDocument,
} from "@/lib/rwa-admin-storage.shared";
import { RWA_CHAIN_ID, RWA_CONTRACT_ADDRESS } from "@/lib/rwa-chain-config";
import { execute, queryAll, queryFirst } from "@/lib/server/db";

type AssetChainState = "draft" | "issuing" | "onchain" | "issue_failed";
type MediaRole = "product" | "certificate";

type AssetRow = Record<string, unknown> & {
  id: number;
  asset_code: string;
  chain_state: AssetChainState;
  display_state: "active" | "hidden" | "archived";
  created_at: number;
  updated_at: number;
};

type AssetDetailRow = AssetRow & {
  chain_id: number | null;
  contract_address: string | null;
  recipient_address: string | null;
  name: string | null;
  phenix_price_text: string | null;
  file_hash: string | null;
  package_key: string | null;
  package_url: string | null;
  package_size_bytes: number | null;
  rwa_id: string | null;
  token_uri: string | null;
  issue_tx_hash: string | null;
  onchain_status: "published" | "unpublished" | "burned" | null;
  confirmed_at: number | null;
  locked_at: number | null;
  onchain_updated_at: number | null;
  member_price_cny_cents: number | null;
  category_label: string | null;
  source_label: string | null;
  spec: string | null;
  size: string | null;
  description: string | null;
  sort_order: number | null;
  offchain_updated_at: number | null;
};

type MediaRow = Record<string, unknown> & {
  asset_id: number;
  role: MediaRole;
  url: string;
  storage_key: string | null;
  sort_order: number;
};

export type AssetTokenMetadata = {
  rwaId: string;
  name: string;
  fileHash: string;
  imageURL: string;
};

export type OnchainAssetSnapshot = {
  assetCode: string;
  tokenId: string;
  name: string;
  owner: string;
  pricePhenix: string;
  pricePhenixWei: string;
  fileHash: string;
  tokenURI: string;
  status: "published" | "unpublished" | "burned";
  imageURL?: string;
  categoryLabel: string;
  sellerCategoryLabel: string;
  spec?: string;
  size?: string;
  txHash?: string;
  confirmedAt?: string;
};

export type OnchainAssetUpsertResult = {
  assetCode: string;
  tokenId: string;
  action: "created" | "updated" | "skipped";
  reason?: string;
};

const CONTRACT_ADDRESS = RWA_CONTRACT_ADDRESS.toLowerCase();
const INITIAL_ONCHAIN_ASSET_SNAPSHOTS: OnchainAssetSnapshot[] = [
  {
    assetCode: "PR00001",
    tokenId: "1",
    name: "蓝宝石 戒指 PR00001",
    owner: "0xc5D4C6c5Fa4ad10dC768fc589f782Ef8c8CB0cA7",
    pricePhenix: "1000000",
    pricePhenixWei: "1000000000000000000000000",
    fileHash: "f4b03bf7dea1a568f32f4f6af22cc70b",
    tokenURI:
      "https://phenixmcga.com/rwa/metadata?id=1&hash=f4b03bf7dea1a568f32f4f6af22cc70b",
    status: "published",
    imageURL:
      "https://rwa-cdn.phenixmcga.com/f4b03bf7dea1a568f32f4f6af22cc70b/cover.png",
    categoryLabel: "宝石",
    sellerCategoryLabel: "平台",
    spec: "待维护",
    size: "待维护",
  },
];
const INITIAL_MEMBER_PRICE_CNY_BY_ASSET_CODE: Record<string, number> = {
  PR00001: 1_000_000,
};
const TABLE_MISSING_PATTERNS = [
  "no such table: assets",
  "no such table: asset_onchain_data",
  "no such table: asset_offchain_data",
  "no such table: asset_media",
];

let catalogSeeded = false;

export function isAssetSchemaMissingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return TABLE_MISSING_PATTERNS.some((pattern) =>
    message.toLowerCase().includes(pattern),
  );
}

export async function readAssetAdminStorageDocument(
  context: AppLoadContext,
): Promise<RwaAdminStorageDocument> {
  await seedProductAssetCatalog(context);

  const rows = await queryAll<AssetDetailRow>(
    context,
    `
      SELECT
        assets.id,
        assets.asset_code,
        assets.chain_state,
        assets.display_state,
        assets.created_at,
        assets.updated_at,
        asset_onchain_data.chain_id,
        asset_onchain_data.contract_address,
        asset_onchain_data.recipient_address,
        asset_onchain_data.name,
        asset_onchain_data.phenix_price_text,
        asset_onchain_data.file_hash,
        asset_onchain_data.package_key,
        asset_onchain_data.package_url,
        asset_onchain_data.package_size_bytes,
        asset_onchain_data.rwa_id,
        asset_onchain_data.token_uri,
        asset_onchain_data.issue_tx_hash,
        asset_onchain_data.onchain_status,
        asset_onchain_data.confirmed_at,
        asset_onchain_data.locked_at,
        asset_onchain_data.updated_at AS onchain_updated_at,
        asset_offchain_data.member_price_cny_cents,
        asset_offchain_data.category_label,
        asset_offchain_data.source_label,
        asset_offchain_data.spec,
        asset_offchain_data.size,
        asset_offchain_data.description,
        asset_offchain_data.sort_order,
        asset_offchain_data.updated_at AS offchain_updated_at
      FROM assets
      LEFT JOIN asset_onchain_data ON asset_onchain_data.asset_id = assets.id
      LEFT JOIN asset_offchain_data ON asset_offchain_data.asset_id = assets.id
      WHERE assets.display_state != 'archived'
      ORDER BY assets.asset_code ASC
    `,
  );

  const mediaByAssetId = await readMediaByAssetId(context);
  const document = emptyRwaAdminStorageDocument();

  for (const row of rows) {
    const media = mediaByAssetId.get(row.id) ?? [];
    const metadata = buildAdminMetadataFromRow(row, media);
    document.items[metadata.tokenId] = metadata;

    if (metadata.chainTokenId) {
      document.items[metadata.chainTokenId] = {
        ...metadata,
        tokenId: metadata.chainTokenId,
        assetKind: "chain",
      };
    }
  }

  document.updatedAt =
    rows.reduce<string>((latest, row) => {
      const updatedAt = unixToIso(
        Math.max(
          row.updated_at ?? 0,
          row.onchain_updated_at ?? 0,
          row.offchain_updated_at ?? 0,
        ),
      );
      return updatedAt > latest ? updatedAt : latest;
    }, document.updatedAt) || document.updatedAt;

  return document;
}

export async function saveAssetAdminMetadata(
  context: AppLoadContext,
  tokenId: string,
  metadata: RwaAdminMetadataInput,
) {
  await seedProductAssetCatalog(context);

  const assetCode = resolveAssetCode(tokenId, metadata);

  if (!assetCode) {
    throw new Error("缺少资产编号");
  }

  const hasOnchainPayload = containsOnchainPayload(metadata);
  const requestedChainState = hasOnchainPayload
    ? resolveChainState(tokenId, metadata)
    : "draft";
  const asset = await ensureAsset(context, assetCode, requestedChainState);
  await ensureOffchainData(context, asset.id);

  await upsertOffchainData(context, asset.id, metadata);

  if (!hasOnchainPayload) {
    return readAssetAdminStorageDocument(context);
  }

  const onchain = await ensureOnchainData(context, asset.id);
  const locked = Boolean(onchain.locked_at) || asset.chain_state === "onchain";

  if (!locked) {
    await updateOnchainDraft(context, asset.id, tokenId, metadata);
    await replaceMediaIfProvided(context, asset.id, "product", metadata.imageURLs);
    await replaceMediaIfProvided(
      context,
      asset.id,
      "certificate",
      metadata.certificateURLs,
    );
  } else {
    await updateLockedChainReference(context, asset.id, tokenId, metadata);
  }

  await updateAssetChainState(context, asset.id, asset.chain_state, requestedChainState);

  return readAssetAdminStorageDocument(context);
}

export async function deleteAssetAdminMetadata(
  context: AppLoadContext,
  tokenId: string,
) {
  const assetCode =
    getProductAssetIdFromStorageKey(tokenId) || normalizeProductAssetCode(tokenId);

  if (!assetCode) {
    return readAssetAdminStorageDocument(context);
  }

  const asset = await queryFirst<AssetRow>(
    context,
    "SELECT * FROM assets WHERE asset_code = ?",
    [assetCode],
  );

  if (!asset) {
    return readAssetAdminStorageDocument(context);
  }

  if (asset.chain_state === "onchain") {
    await execute(
      context,
      "UPDATE assets SET display_state = 'hidden', updated_at = unixepoch() WHERE id = ?",
      [asset.id],
    );
  } else {
    await execute(context, "DELETE FROM assets WHERE id = ?", [asset.id]);
  }

  return readAssetAdminStorageDocument(context);
}

export async function readAssetTokenMetadata(
  context: AppLoadContext,
  rwaId: string,
  fileHash?: string | null,
): Promise<AssetTokenMetadata | null> {
  await seedProductAssetCatalog(context);

  const row = await queryFirst<AssetDetailRow>(
    context,
    `
      SELECT
        assets.id,
        assets.asset_code,
        assets.chain_state,
        assets.display_state,
        assets.created_at,
        assets.updated_at,
        asset_onchain_data.chain_id,
        asset_onchain_data.contract_address,
        asset_onchain_data.recipient_address,
        asset_onchain_data.name,
        asset_onchain_data.phenix_price_text,
        asset_onchain_data.file_hash,
        asset_onchain_data.package_key,
        asset_onchain_data.package_url,
        asset_onchain_data.package_size_bytes,
        asset_onchain_data.rwa_id,
        asset_onchain_data.token_uri,
        asset_onchain_data.issue_tx_hash,
        asset_onchain_data.onchain_status,
        asset_onchain_data.confirmed_at,
        asset_onchain_data.locked_at,
        asset_onchain_data.updated_at AS onchain_updated_at,
        asset_offchain_data.member_price_cny_cents,
        asset_offchain_data.category_label,
        asset_offchain_data.source_label,
        asset_offchain_data.spec,
        asset_offchain_data.size,
        asset_offchain_data.description,
        asset_offchain_data.sort_order,
        asset_offchain_data.updated_at AS offchain_updated_at
      FROM assets
      INNER JOIN asset_onchain_data ON asset_onchain_data.asset_id = assets.id
      LEFT JOIN asset_offchain_data ON asset_offchain_data.asset_id = assets.id
      WHERE asset_onchain_data.rwa_id = ?
        AND (? IS NULL OR asset_onchain_data.file_hash = ?)
      LIMIT 1
    `,
    [rwaId, fileHash || null, fileHash || null],
  );

  if (!row?.rwa_id || !row.file_hash) {
    return null;
  }

  const media = (await readMediaByAssetId(context)).get(row.id) ?? [];
  const imageURL = media.find((item) => item.role === "product")?.url ?? "";

  return {
    rwaId: row.rwa_id,
    name: row.name || row.asset_code,
    fileHash: row.file_hash,
    imageURL,
  };
}

export async function upsertOnchainAssetSnapshot(
  context: AppLoadContext,
  snapshot: OnchainAssetSnapshot,
): Promise<OnchainAssetUpsertResult> {
  await seedProductAssetCatalog(context);
  return upsertOnchainAssetSnapshotRow(context, snapshot);
}

async function upsertOnchainAssetSnapshotRow(
  context: AppLoadContext,
  snapshot: OnchainAssetSnapshot,
): Promise<OnchainAssetUpsertResult> {
  const tokenId = trimAdminStorageString(snapshot.tokenId);
  const requestedAssetCode = normalizeProductAssetCode(snapshot.assetCode);

  if (!tokenId || !requestedAssetCode) {
    return {
      assetCode: requestedAssetCode,
      tokenId,
      action: "skipped",
      reason: "missing_token_or_asset_code",
    };
  }

  const existingByRwaId = await queryFirst<AssetRow>(
    context,
    `
      SELECT assets.*
      FROM assets
      INNER JOIN asset_onchain_data ON asset_onchain_data.asset_id = assets.id
      WHERE asset_onchain_data.rwa_id = ?
      LIMIT 1
    `,
    [tokenId],
  );
  const assetCode = existingByRwaId?.asset_code ?? requestedAssetCode;
  let asset =
    existingByRwaId ??
    (await queryFirst<AssetRow>(
      context,
      "SELECT * FROM assets WHERE asset_code = ?",
      [assetCode],
    ));
  const existedBeforeSync = Boolean(asset);

  if (!asset) {
    await execute(
      context,
      `
        INSERT INTO assets (asset_code, chain_state, display_state)
        VALUES (?, 'draft', 'active')
        ON CONFLICT(asset_code) DO NOTHING
      `,
      [assetCode],
    );
    asset = await queryFirst<AssetRow>(
      context,
      "SELECT * FROM assets WHERE asset_code = ?",
      [assetCode],
    );
  }

  if (!asset) {
    return {
      assetCode,
      tokenId,
      action: "skipped",
      reason: "asset_not_found_after_insert",
    };
  }

  await ensureOffchainData(context, asset.id);
  await fillOffchainPlaceholders(context, asset.id, snapshot);
  const onchain = await ensureOnchainData(context, asset.id);

  if (onchain.rwa_id && onchain.rwa_id !== tokenId) {
    return {
      assetCode: asset.asset_code,
      tokenId,
      action: "skipped",
      reason: "asset_already_linked_to_another_token",
    };
  }

  await updateOnchainSnapshot(
    context,
    asset.id,
    snapshot,
    Boolean(onchain.locked_at) || asset.chain_state === "onchain",
  );
  await insertProductMediaIfMissing(
    context,
    asset.id,
    asset.chain_state,
    snapshot.imageURL,
  );
  await execute(
    context,
    `
      UPDATE assets
      SET chain_state = 'onchain',
          display_state = 'active',
          updated_at = unixepoch()
      WHERE id = ?
    `,
    [asset.id],
  );

  return {
    assetCode: asset.asset_code,
    tokenId,
    action: existedBeforeSync ? "updated" : "created",
  };
}

async function seedProductAssetCatalog(context: AppLoadContext) {
  if (catalogSeeded) {
    return;
  }

  for (const asset of PRODUCT_ASSETS) {
    const assetCode = normalizeProductAssetCode(asset.id);
    await execute(
      context,
      `
        INSERT INTO assets (asset_code, chain_state, display_state)
        VALUES (?, 'draft', 'active')
        ON CONFLICT(asset_code) DO NOTHING
      `,
      [assetCode],
    );

    const row = await queryFirst<AssetRow>(
      context,
      "SELECT * FROM assets WHERE asset_code = ?",
      [assetCode],
    );

    if (!row) continue;

    await execute(
      context,
      `
        INSERT INTO asset_onchain_data (
          asset_id,
          chain_id,
          contract_address,
          name,
          file_hash,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, unixepoch(), unixepoch())
        ON CONFLICT(asset_id) DO NOTHING
      `,
      [
        row.id,
        RWA_CHAIN_ID,
        CONTRACT_ADDRESS,
        getProductAssetDisplayName(asset),
        asset.fileHash || null,
      ],
    );

    await execute(
      context,
      `
        INSERT INTO asset_offchain_data (
          asset_id,
          member_price_cny_cents,
          category_label,
          source_label,
          spec,
          size,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, unixepoch())
        ON CONFLICT(asset_id) DO NOTHING
      `,
      [
        row.id,
        priceCnyToCents(asset.priceCny),
        asset.categoryLabel,
        asset.sellerCategoryLabel,
        asset.spec,
        asset.size,
      ],
    );

    const mediaCount = await queryFirst<Record<string, unknown> & { count: number }>(
      context,
      "SELECT COUNT(*) AS count FROM asset_media WHERE asset_id = ?",
      [row.id],
    );

    if ((mediaCount?.count ?? 0) === 0) {
      await insertMedia(context, row.id, "product", asset.imageURLs);
      await insertMedia(context, row.id, "certificate", asset.certificateURLs);
    }
  }

  if (RWA_CHAIN_ID === 8453) {
    for (const snapshot of INITIAL_ONCHAIN_ASSET_SNAPSHOTS) {
      if (!(await isInitialOnchainAssetSeeded(context, snapshot))) {
        await upsertOnchainAssetSnapshotRow(context, snapshot);
      }
      await seedInitialMemberPriceCny(context, snapshot.assetCode);
    }
  }

  catalogSeeded = true;
}

async function seedInitialMemberPriceCny(
  context: AppLoadContext,
  assetCode: string,
) {
  const normalizedAssetCode = normalizeProductAssetCode(assetCode);
  const memberPriceCny = INITIAL_MEMBER_PRICE_CNY_BY_ASSET_CODE[normalizedAssetCode];

  if (!memberPriceCny) {
    return;
  }

  const asset = await queryFirst<AssetRow>(
    context,
    "SELECT * FROM assets WHERE asset_code = ?",
    [normalizedAssetCode],
  );

  if (!asset) {
    return;
  }

  await ensureOffchainData(context, asset.id);
  await execute(
    context,
    `
      UPDATE asset_offchain_data
      SET
        member_price_cny_cents = CASE
          WHEN member_price_cny_cents IS NULL OR member_price_cny_cents <= 0 THEN ?
          ELSE member_price_cny_cents
        END,
        updated_at = CASE
          WHEN member_price_cny_cents IS NULL OR member_price_cny_cents <= 0 THEN unixepoch()
          ELSE updated_at
        END
      WHERE asset_id = ?
    `,
    [priceCnyToCents(memberPriceCny), asset.id],
  );
}

async function isInitialOnchainAssetSeeded(
  context: AppLoadContext,
  snapshot: OnchainAssetSnapshot,
) {
  const row = await queryFirst<Record<string, unknown> & { id: number }>(
    context,
    `
      SELECT assets.id
      FROM assets
      INNER JOIN asset_onchain_data ON asset_onchain_data.asset_id = assets.id
      WHERE asset_onchain_data.rwa_id = ?
      LIMIT 1
    `,
    [snapshot.tokenId],
  );

  return Boolean(row);
}

async function ensureAsset(
  context: AppLoadContext,
  assetCode: string,
  requestedChainState: AssetChainState,
) {
  await execute(
    context,
    `
      INSERT INTO assets (asset_code, chain_state, display_state)
      VALUES (?, ?, 'active')
      ON CONFLICT(asset_code) DO NOTHING
    `,
    [assetCode, requestedChainState],
  );

  const asset = await queryFirst<AssetRow>(
    context,
    "SELECT * FROM assets WHERE asset_code = ?",
    [assetCode],
  );

  if (!asset) {
    throw new Error("资产不存在");
  }

  return asset;
}

async function ensureOnchainData(context: AppLoadContext, assetId: number) {
  await execute(
    context,
    `
      INSERT INTO asset_onchain_data (
        asset_id,
        chain_id,
        contract_address,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, unixepoch(), unixepoch())
      ON CONFLICT(asset_id) DO NOTHING
    `,
    [assetId, RWA_CHAIN_ID, CONTRACT_ADDRESS],
  );

  const row = await queryFirst<
    Record<string, unknown> & {
      locked_at: number | null;
      rwa_id: string | null;
    }
  >(
    context,
    "SELECT locked_at, rwa_id FROM asset_onchain_data WHERE asset_id = ?",
    [assetId],
  );

  if (!row) {
    throw new Error("资产链上资料不存在");
  }

  return row;
}

async function ensureOffchainData(context: AppLoadContext, assetId: number) {
  await execute(
    context,
    `
      INSERT INTO asset_offchain_data (asset_id, updated_at)
      VALUES (?, unixepoch())
      ON CONFLICT(asset_id) DO NOTHING
    `,
    [assetId],
  );
}

async function upsertOffchainData(
  context: AppLoadContext,
  assetId: number,
  metadata: RwaAdminMetadataInput,
) {
  await execute(
    context,
    `
      UPDATE asset_offchain_data
      SET
        member_price_cny_cents = COALESCE(?, member_price_cny_cents),
        category_label = COALESCE(?, category_label),
        source_label = COALESCE(?, source_label),
        spec = COALESCE(?, spec),
        size = COALESCE(?, size),
        updated_at = unixepoch()
      WHERE asset_id = ?
    `,
    [
      parsePriceCnyCents(metadata.priceCny),
      trimAdminStorageString(metadata.categoryLabel) || null,
      trimAdminStorageString(metadata.sellerCategoryLabel) || null,
      trimAdminStorageString(metadata.spec) || null,
      trimAdminStorageString(metadata.size) || null,
      assetId,
    ],
  );
}

async function fillOffchainPlaceholders(
  context: AppLoadContext,
  assetId: number,
  snapshot: OnchainAssetSnapshot,
) {
  await execute(
    context,
    `
      UPDATE asset_offchain_data
      SET
        category_label = CASE
          WHEN category_label IS NULL OR trim(category_label) = '' THEN ?
          ELSE category_label
        END,
        source_label = CASE
          WHEN source_label IS NULL OR trim(source_label) = '' THEN ?
          ELSE source_label
        END,
        spec = CASE
          WHEN spec IS NULL OR trim(spec) = '' THEN ?
          ELSE spec
        END,
        size = CASE
          WHEN size IS NULL OR trim(size) = '' THEN ?
          ELSE size
        END,
        updated_at = unixepoch()
      WHERE asset_id = ?
    `,
    [
      trimAdminStorageString(snapshot.categoryLabel) || "文化艺术品",
      trimAdminStorageString(snapshot.sellerCategoryLabel) || "平台",
      trimAdminStorageString(snapshot.spec) || "待维护",
      trimAdminStorageString(snapshot.size) || "待维护",
      assetId,
    ],
  );
}

async function updateOnchainSnapshot(
  context: AppLoadContext,
  assetId: number,
  snapshot: OnchainAssetSnapshot,
  locked: boolean,
) {
  const confirmedAt = isoToUnixSeconds(snapshot.confirmedAt);

  if (locked) {
    await execute(
      context,
      `
        UPDATE asset_onchain_data
        SET
          rwa_id = COALESCE(rwa_id, ?),
          token_uri = COALESCE(NULLIF(token_uri, ''), ?),
          issue_tx_hash = COALESCE(NULLIF(issue_tx_hash, ''), ?),
          onchain_status = COALESCE(?, onchain_status),
          confirmed_at = COALESCE(confirmed_at, ?),
          updated_at = unixepoch()
        WHERE asset_id = ?
      `,
      [
        trimAdminStorageString(snapshot.tokenId) || null,
        trimAdminStorageString(snapshot.tokenURI) || null,
        trimAdminStorageString(snapshot.txHash) || null,
        snapshot.status || null,
        confirmedAt,
        assetId,
      ],
    );
    return;
  }

  await execute(
    context,
    `
      UPDATE asset_onchain_data
      SET
        contract_address = COALESCE(NULLIF(contract_address, ''), ?),
        recipient_address = COALESCE(NULLIF(recipient_address, ''), ?),
        name = COALESCE(NULLIF(name, ''), ?),
        phenix_price_wei = COALESCE(NULLIF(phenix_price_wei, ''), ?),
        phenix_price_text = COALESCE(NULLIF(phenix_price_text, ''), ?),
        file_hash = COALESCE(NULLIF(file_hash, ''), ?),
        rwa_id = COALESCE(rwa_id, ?),
        token_uri = COALESCE(NULLIF(token_uri, ''), ?),
        issue_tx_hash = COALESCE(NULLIF(issue_tx_hash, ''), ?),
        onchain_status = COALESCE(?, onchain_status),
        confirmed_at = COALESCE(confirmed_at, ?),
        locked_at = COALESCE(locked_at, unixepoch()),
        updated_at = unixepoch()
      WHERE asset_id = ?
    `,
    [
      CONTRACT_ADDRESS,
      trimAdminStorageString(snapshot.owner) || null,
      trimAdminStorageString(snapshot.name) || null,
      trimAdminStorageString(snapshot.pricePhenixWei) || null,
      trimAdminStorageString(snapshot.pricePhenix) || null,
      trimAdminStorageString(snapshot.fileHash) || null,
      trimAdminStorageString(snapshot.tokenId) || null,
      trimAdminStorageString(snapshot.tokenURI) || null,
      trimAdminStorageString(snapshot.txHash) || null,
      snapshot.status || null,
      confirmedAt,
      assetId,
    ],
  );
}

async function updateOnchainDraft(
  context: AppLoadContext,
  assetId: number,
  tokenId: string,
  metadata: RwaAdminMetadataInput,
) {
  const chainStatus = resolveChainState(tokenId, metadata);
  const shouldLock = chainStatus === "onchain";
  const confirmedAt = isoToUnixSeconds(metadata.chainConfirmedAt);
  const rwaId = resolveRwaId(tokenId, metadata);

  await execute(
    context,
    `
      UPDATE asset_onchain_data
      SET
        contract_address = ?,
        recipient_address = COALESCE(?, recipient_address),
        name = COALESCE(?, name),
        phenix_price_wei = COALESCE(?, phenix_price_wei),
        phenix_price_text = COALESCE(?, phenix_price_text),
        file_hash = COALESCE(?, file_hash),
        package_key = COALESCE(?, package_key),
        package_url = COALESCE(?, package_url),
        package_size_bytes = COALESCE(?, package_size_bytes),
        rwa_id = COALESCE(?, rwa_id),
        token_uri = COALESCE(?, token_uri),
        issue_tx_hash = COALESCE(?, issue_tx_hash),
        onchain_status = COALESCE(?, onchain_status),
        confirmed_at = COALESCE(?, confirmed_at),
        locked_at = CASE
          WHEN ? = 1 THEN COALESCE(locked_at, unixepoch())
          ELSE locked_at
        END,
        updated_at = unixepoch()
      WHERE asset_id = ?
    `,
    [
      CONTRACT_ADDRESS,
      trimAdminStorageString(metadata.recipient) || null,
      trimAdminStorageString(metadata.name) || null,
      parsePhenixWeiString(metadata.pricePhenix),
      trimAdminStorageString(metadata.pricePhenix) || null,
      trimAdminStorageString(metadata.fileHash) || null,
      trimAdminStorageString(metadata.packageKey) || null,
      trimAdminStorageString(metadata.packageURL) || null,
      parsePositiveInteger(metadata.packageSize),
      rwaId || null,
      trimAdminStorageString(metadata.tokenURI) || null,
      trimAdminStorageString(metadata.chainTxHash) || null,
      metadata.status === 1 ? "unpublished" : metadata.status === 0 ? "published" : null,
      confirmedAt,
      shouldLock ? 1 : 0,
      assetId,
    ],
  );
}

async function updateLockedChainReference(
  context: AppLoadContext,
  assetId: number,
  tokenId: string,
  metadata: RwaAdminMetadataInput,
) {
  const rwaId = resolveRwaId(tokenId, metadata);

  await execute(
    context,
    `
      UPDATE asset_onchain_data
      SET
        rwa_id = COALESCE(rwa_id, ?),
        token_uri = COALESCE(token_uri, ?),
        issue_tx_hash = COALESCE(issue_tx_hash, ?),
        onchain_status = COALESCE(?, onchain_status),
        updated_at = unixepoch()
      WHERE asset_id = ?
    `,
    [
      rwaId || null,
      trimAdminStorageString(metadata.tokenURI) || null,
      trimAdminStorageString(metadata.chainTxHash) || null,
      metadata.status === 1 ? "unpublished" : metadata.status === 0 ? "published" : null,
      assetId,
    ],
  );
}

async function updateAssetChainState(
  context: AppLoadContext,
  assetId: number,
  currentState: AssetChainState,
  requestedState: AssetChainState,
) {
  const nextState = currentState === "onchain" ? "onchain" : requestedState;

  await execute(
    context,
    "UPDATE assets SET chain_state = ?, updated_at = unixepoch() WHERE id = ?",
    [nextState, assetId],
  );
}

async function replaceMediaIfProvided(
  context: AppLoadContext,
  assetId: number,
  role: MediaRole,
  value: unknown,
) {
  const urls = normalizeRwaAdminAssetURLs(value, role === "product" ? 8 : 6);

  if (!urls) return;

  await execute(
    context,
    "DELETE FROM asset_media WHERE asset_id = ? AND role = ?",
    [assetId, role],
  );
  await insertMedia(context, assetId, role, urls);
}

async function insertMedia(
  context: AppLoadContext,
  assetId: number,
  role: MediaRole,
  urls: string[],
) {
  for (const [index, url] of urls.entries()) {
    await execute(
      context,
      `
        INSERT INTO asset_media (asset_id, role, url, sort_order)
        VALUES (?, ?, ?, ?)
      `,
      [assetId, role, url, index],
    );
  }
}

async function insertProductMediaIfMissing(
  context: AppLoadContext,
  assetId: number,
  currentChainState: AssetChainState,
  imageURL?: string,
) {
  const normalizedImageURL = trimAdminStorageString(imageURL);

  if (!normalizedImageURL || currentChainState === "onchain") return;

  const mediaCount = await queryFirst<Record<string, unknown> & { count: number }>(
    context,
    "SELECT COUNT(*) AS count FROM asset_media WHERE asset_id = ? AND role = 'product'",
    [assetId],
  );

  if ((mediaCount?.count ?? 0) > 0) return;

  await insertMedia(context, assetId, "product", [normalizedImageURL]);
}

async function readMediaByAssetId(context: AppLoadContext) {
  const rows = await queryAll<MediaRow>(
    context,
    `
      SELECT asset_id, role, url, storage_key, sort_order
      FROM asset_media
      ORDER BY asset_id ASC, role ASC, sort_order ASC
    `,
  );
  const byAssetId = new Map<number, MediaRow[]>();

  for (const row of rows) {
    const items = byAssetId.get(row.asset_id) ?? [];
    items.push(row);
    byAssetId.set(row.asset_id, items);
  }

  return byAssetId;
}

function buildAdminMetadataFromRow(
  row: AssetDetailRow,
  media: MediaRow[],
): RwaAdminMetadata {
  const imageURLs = media
    .filter((item) => item.role === "product")
    .map((item) => item.url);
  const certificateURLs = media
    .filter((item) => item.role === "certificate")
    .map((item) => item.url);
  const updatedAt = unixToIso(
    Math.max(row.updated_at, row.onchain_updated_at ?? 0, row.offchain_updated_at ?? 0),
  );

  return {
    tokenId: getProductAssetStorageKey(row.asset_code),
    assetKind: "product",
    assetCode: row.asset_code,
    name: row.name ?? row.asset_code,
    categoryLabel: row.category_label || "文化艺术品",
    sellerCategoryLabel: row.source_label || "平台",
    spec: row.spec || undefined,
    size: row.size || undefined,
    priceCny: formatCnyFromCents(row.member_price_cny_cents),
    recipient: row.recipient_address || undefined,
    pricePhenix: row.phenix_price_text || undefined,
    fileHash: row.file_hash || undefined,
    imageURL: imageURLs[0],
    imageURLs: imageURLs.length > 0 ? imageURLs : undefined,
    certificateURLs: certificateURLs.length > 0 ? certificateURLs : undefined,
    packageURL: row.package_url || undefined,
    packageKey: row.package_key || undefined,
    packageSize: row.package_size_bytes ? String(row.package_size_bytes) : undefined,
    chainStatus: mapChainStateToMetadataStatus(row.chain_state),
    chainTokenId: row.rwa_id || undefined,
    chainTxHash: row.issue_tx_hash || undefined,
    chainConfirmedAt: row.confirmed_at ? unixToIso(row.confirmed_at) : undefined,
    tokenURI: row.token_uri || undefined,
    status:
      row.onchain_status === "published"
        ? 0
        : row.onchain_status === "unpublished"
          ? 1
          : undefined,
    createdAt: unixToIso(row.created_at),
    updatedAt,
  };
}

function containsOnchainPayload(metadata: RwaAdminMetadataInput) {
  if (metadata.assetKind === "chain") {
    return true;
  }

  const onchainKeys: (keyof RwaAdminMetadataInput)[] = [
    "name",
    "recipient",
    "pricePhenix",
    "fileHash",
    "imageURL",
    "imageURLs",
    "certificateURLs",
    "packageURL",
    "packageKey",
    "packageSize",
    "chainStatus",
    "chainTokenId",
    "chainTxHash",
    "chainConfirmedAt",
    "tokenURI",
    "status",
  ];

  return onchainKeys.some((key) =>
    Object.prototype.hasOwnProperty.call(metadata, key),
  );
}

function resolveAssetCode(tokenId: string, metadata: RwaAdminMetadataInput) {
  return (
    normalizeProductAssetCode(metadata.assetCode ?? "") ||
    getProductAssetIdFromStorageKey(tokenId)
  );
}

function resolveRwaId(tokenId: string, metadata: RwaAdminMetadataInput) {
  const fromMetadata = trimAdminStorageString(metadata.chainTokenId);
  if (fromMetadata) return fromMetadata;

  const normalizedTokenId = tokenId.trim();
  return /^\d+$/.test(normalizedTokenId) ? normalizedTokenId : "";
}

function resolveChainState(
  tokenId: string,
  metadata: RwaAdminMetadataInput,
): AssetChainState {
  if (metadata.chainStatus === "confirmed" || resolveRwaId(tokenId, metadata)) {
    return "onchain";
  }

  if (metadata.chainStatus === "pending") return "issuing";
  if (metadata.chainStatus === "failed") return "issue_failed";
  return "draft";
}

function mapChainStateToMetadataStatus(state: AssetChainState) {
  if (state === "onchain") return "confirmed";
  if (state === "issuing") return "pending";
  if (state === "issue_failed") return "failed";
  return "draft";
}

function parsePriceCnyCents(value: unknown) {
  const normalized = trimAdminStorageString(value).replace(/[,\s￥¥]/g, "");

  if (!normalized) return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function priceCnyToCents(value: number) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

function formatCnyFromCents(value: number | null) {
  if (value === null || value === undefined) return undefined;
  const cny = value / 100;
  return Number.isInteger(cny) ? String(cny) : String(cny);
}

function parsePositiveInteger(value: unknown) {
  const normalized = trimAdminStorageString(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function parsePhenixWeiString(value: unknown) {
  const normalized = trimAdminStorageString(value).replace(/[,\s]/g, "");

  if (!/^\d+(\.\d{1,18})?$/.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  return (
    BigInt(whole) * 10n ** 18n +
    BigInt((fraction + "0".repeat(18)).slice(0, 18))
  ).toString();
}

function isoToUnixSeconds(value: unknown) {
  const normalized = trimAdminStorageString(value);
  if (!normalized) return null;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? Math.floor(parsed / 1000) : null;
}

function unixToIso(value: number) {
  return new Date(Math.max(0, value) * 1000).toISOString();
}
