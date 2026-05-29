import type { AppLoadContext } from "react-router";

import { execute, queryAll, queryFirst } from "@/lib/server/db";

export type AppSettingRow = {
  key: string;
  value: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type UpsertAppSettingInput = {
  key: string;
  value: string;
  description?: string | null;
};

export function listAppSettings(
  context: AppLoadContext,
): Promise<AppSettingRow[]> {
  return queryAll<AppSettingRow>(
    context,
    `
      SELECT key, value, description, created_at, updated_at
      FROM app_settings
      ORDER BY key ASC
    `,
  );
}

export function getAppSetting(
  context: AppLoadContext,
  key: string,
): Promise<AppSettingRow | null> {
  return queryFirst<AppSettingRow>(
    context,
    `
      SELECT key, value, description, created_at, updated_at
      FROM app_settings
      WHERE key = ?
    `,
    [key],
  );
}

export async function upsertAppSetting(
  context: AppLoadContext,
  input: UpsertAppSettingInput,
): Promise<AppSettingRow> {
  const description = input.description ?? null;

  await execute(
    context,
    `
      INSERT INTO app_settings (key, value, description)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        description = excluded.description,
        updated_at = unixepoch()
    `,
    [input.key, input.value, description],
  );

  const setting = await getAppSetting(context, input.key);

  if (!setting) {
    throw new Response("Failed to load saved app setting", { status: 500 });
  }

  return setting;
}

export async function deleteAppSetting(
  context: AppLoadContext,
  key: string,
): Promise<boolean> {
  const result = await execute(context, "DELETE FROM app_settings WHERE key = ?", [
    key,
  ]);

  return result.meta.changes > 0;
}

