import type { AppLoadContext } from "react-router";

import {
  normalizeAdminAddress,
  type AdminSession,
} from "@/lib/server/admin-auth";
import { execute, queryAll, queryFirst } from "@/lib/server/db";

type AdminWalletStatus = "active" | "disabled";

type AdminWalletRow = Record<string, unknown> & {
  address: string;
  role: "super_admin";
  status: AdminWalletStatus;
  label: string | null;
  created_by: string | null;
  disabled_by: string | null;
  created_at: number;
  updated_at: number;
  disabled_at: number | null;
};

export type AdminWalletListItem = {
  address: `0x${string}`;
  role: "super_admin";
  status: AdminWalletStatus;
  label: string;
  createdBy: string;
  disabledBy: string;
  createdAt: number;
  updatedAt: number;
  disabledAt: number | null;
};

export async function listAdminWallets(context: AppLoadContext) {
  const rows = await queryAll<AdminWalletRow>(
    context,
    `
      SELECT
        address,
        role,
        status,
        label,
        created_by,
        disabled_by,
        created_at,
        updated_at,
        disabled_at
      FROM admin_wallets
      ORDER BY status ASC, created_at ASC, address ASC
    `,
  );

  return rows.map(normalizeAdminWalletRow);
}

export async function addAdminWallet(
  context: AppLoadContext,
  input: {
    address: unknown;
    label?: unknown;
    currentAdmin: AdminSession;
  },
) {
  const address = normalizeRequiredAdminAddress(input.address);
  const label = normalizeLabel(input.label);
  const existing = await queryFirst<Pick<AdminWalletRow, "address" | "status">>(
    context,
    `
      SELECT address, status
      FROM admin_wallets
      WHERE lower(address) = lower(?)
      LIMIT 1
    `,
    [address],
  );

  if (existing) {
    await execute(
      context,
      `
        UPDATE admin_wallets
        SET
          label = ?,
          role = 'super_admin',
          status = 'active',
          updated_at = unixepoch(),
          disabled_at = NULL,
          disabled_by = NULL
        WHERE lower(address) = lower(?)
      `,
      [label || null, existing.address],
    );
    return address;
  }

  await execute(
    context,
    `
      INSERT INTO admin_wallets (
        address,
        role,
        status,
        label,
        created_by,
        created_at,
        updated_at
      )
      VALUES (?, 'super_admin', 'active', ?, ?, unixepoch(), unixepoch())
    `,
    [address, label || null, input.currentAdmin.address],
  );

  return address;
}

export async function disableAdminWallet(
  context: AppLoadContext,
  input: {
    address: unknown;
    currentAdmin: AdminSession;
  },
) {
  const address = normalizeRequiredAdminAddress(input.address);

  if (address.toLowerCase() === input.currentAdmin.address.toLowerCase()) {
    throw new Error("不能禁用当前登录账号");
  }

  const existing = await readAdminWalletByAddress(context, address);

  if (!existing) {
    throw new Error("管理员钱包不存在");
  }

  if (existing.status === "disabled") {
    return address;
  }

  const activeCount = await countActiveAdminWallets(context);

  if (activeCount <= 1) {
    throw new Error("至少需要保留 1 个启用的管理员钱包");
  }

  await execute(
    context,
    `
      UPDATE admin_wallets
      SET
        status = 'disabled',
        disabled_at = unixepoch(),
        disabled_by = ?,
        updated_at = unixepoch()
      WHERE lower(address) = lower(?)
    `,
    [input.currentAdmin.address, address],
  );

  await revokeAdminSessionsByAddress(context, address);

  return address;
}

export async function enableAdminWallet(
  context: AppLoadContext,
  input: {
    address: unknown;
  },
) {
  const address = normalizeRequiredAdminAddress(input.address);
  const existing = await readAdminWalletByAddress(context, address);

  if (!existing) {
    throw new Error("管理员钱包不存在");
  }

  await execute(
    context,
    `
      UPDATE admin_wallets
      SET
        status = 'active',
        disabled_at = NULL,
        disabled_by = NULL,
        updated_at = unixepoch()
      WHERE lower(address) = lower(?)
    `,
    [address],
  );

  return address;
}

async function readAdminWalletByAddress(
  context: AppLoadContext,
  address: `0x${string}`,
) {
  return queryFirst<Pick<AdminWalletRow, "address" | "status">>(
    context,
    `
      SELECT address, status
      FROM admin_wallets
      WHERE lower(address) = lower(?)
      LIMIT 1
    `,
    [address],
  );
}

async function countActiveAdminWallets(context: AppLoadContext) {
  const row = await queryFirst<Record<string, unknown> & { count: number }>(
    context,
    "SELECT COUNT(*) AS count FROM admin_wallets WHERE status = 'active'",
  );

  return row?.count ?? 0;
}

async function revokeAdminSessionsByAddress(
  context: AppLoadContext,
  address: `0x${string}`,
) {
  await execute(
    context,
    `
      UPDATE admin_sessions
      SET revoked_at = unixepoch()
      WHERE lower(address) = lower(?) AND revoked_at IS NULL
    `,
    [address],
  );
}

function normalizeRequiredAdminAddress(value: unknown) {
  const address = normalizeAdminAddress(value);

  if (!address) {
    throw new Error("请输入有效的钱包地址");
  }

  return address;
}

function normalizeLabel(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 64);
}

function normalizeAdminWalletRow(row: AdminWalletRow): AdminWalletListItem {
  const address = normalizeAdminAddress(row.address) ?? (row.address as `0x${string}`);

  return {
    address,
    role: "super_admin",
    status: row.status,
    label: row.label ?? "",
    createdBy: row.created_by ?? "",
    disabledBy: row.disabled_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    disabledAt: row.disabled_at,
  };
}
