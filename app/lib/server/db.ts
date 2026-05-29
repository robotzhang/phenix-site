import type { AppLoadContext } from "react-router";

export type D1Param =
  | string
  | number
  | boolean
  | null
  | ArrayBuffer
  | ArrayBufferView;

export function getDb(context: AppLoadContext): D1Database {
  const db = context.cloudflare?.env.DB;

  if (!db) {
    throw new Response("D1 database is not configured", { status: 500 });
  }

  return db;
}

export async function queryAll<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  context: AppLoadContext,
  sql: string,
  params: readonly D1Param[] = [],
): Promise<T[]> {
  const result = await prepare(getDb(context), sql, params).all<T>();
  return result.results;
}

export async function queryFirst<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  context: AppLoadContext,
  sql: string,
  params: readonly D1Param[] = [],
): Promise<T | null> {
  return prepare(getDb(context), sql, params).first<T>();
}

export async function execute<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  context: AppLoadContext,
  sql: string,
  params: readonly D1Param[] = [],
): Promise<D1Result<T>> {
  return prepare(getDb(context), sql, params).run<T>();
}

function prepare(
  db: D1Database,
  sql: string,
  params: readonly D1Param[],
): D1PreparedStatement {
  const statement = db.prepare(sql);
  return params.length > 0 ? statement.bind(...params) : statement;
}

