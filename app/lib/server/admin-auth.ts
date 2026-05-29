import { redirect, type AppLoadContext } from "react-router";
import { getAddress, isAddress, verifyMessage } from "viem";

import { execute, queryFirst } from "@/lib/server/db";

const ADMIN_SESSION_COOKIE = "phenix_admin_session";
const ADMIN_NONCE_TTL_SECONDS = 5 * 60;
const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60;
const BASE_CHAIN_ID = 8453;

export type AdminSession = {
  id: string;
  address: `0x${string}`;
  role: "super_admin";
  expiresAt: number;
};

type AdminWalletRow = {
  address: string;
  role: "super_admin";
  status: "active" | "disabled";
};

type AdminNonceRow = {
  nonce: string;
  address: string;
  message: string;
  expires_at: number;
  consumed_at: number | null;
};

type AdminSessionRow = {
  id: string;
  address: string;
  role: "super_admin";
  status: "active" | "disabled";
  expires_at: number;
  revoked_at: number | null;
};

export function normalizeAdminAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== "string" || !isAddress(value)) {
    return null;
  }

  return getAddress(value).toLowerCase() as `0x${string}`;
}

export async function createAdminLoginChallenge(
  context: AppLoadContext,
  request: Request,
  rawAddress: unknown,
) {
  const address = normalizeAdminAddress(rawAddress);

  if (!address) {
    jsonError("Invalid wallet address", 400);
  }

  const now = currentUnixSeconds();
  const expiresAt = now + ADMIN_NONCE_TTL_SECONDS;
  const nonce = crypto.randomUUID();
  const message = createLoginMessage({
    address,
    nonce,
    request,
    issuedAt: new Date(now * 1000).toISOString(),
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  });

  await execute(
    context,
    `
      INSERT INTO admin_auth_nonces (nonce, address, message, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    [nonce, address, message, expiresAt],
  );

  return {
    address,
    nonce,
    message,
    expiresAt,
  };
}

export async function verifyAdminLogin(
  context: AppLoadContext,
  request: Request,
  input: {
    address?: unknown;
    nonce?: unknown;
    message?: unknown;
    signature?: unknown;
  },
) {
  const address = normalizeAdminAddress(input.address);
  const nonce = typeof input.nonce === "string" ? input.nonce : "";
  const message = typeof input.message === "string" ? input.message : "";
  const signature = typeof input.signature === "string" ? input.signature : "";

  if (!address || !nonce || !message || !signature) {
    jsonError("Missing login payload", 400);
  }

  const now = currentUnixSeconds();
  const storedNonce = await queryFirst<AdminNonceRow>(
    context,
    `
      SELECT nonce, address, message, expires_at, consumed_at
      FROM admin_auth_nonces
      WHERE nonce = ? AND address = ?
    `,
    [nonce, address],
  );

  if (!storedNonce || storedNonce.message !== message) {
    jsonError("Invalid login challenge", 400);
  }

  if (storedNonce.consumed_at !== null || storedNonce.expires_at < now) {
    jsonError("Login challenge expired", 400);
  }

  let signatureValid = false;

  try {
    signatureValid = await verifyMessage({
      address,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    jsonError("Invalid wallet signature", 401);
  }

  const adminWallet = await queryFirst<AdminWalletRow>(
    context,
    `
      SELECT address, role, status
      FROM admin_wallets
      WHERE address = ? AND role = 'super_admin' AND status = 'active'
    `,
    [address],
  );

  if (!adminWallet) {
    jsonError("Wallet is not a super administrator", 403);
  }

  await execute(
    context,
    "UPDATE admin_auth_nonces SET consumed_at = ? WHERE nonce = ?",
    [now, nonce],
  );

  const sessionId = crypto.randomUUID();
  const expiresAt = now + ADMIN_SESSION_TTL_SECONDS;

  await execute(
    context,
    `
      INSERT INTO admin_sessions (id, address, expires_at)
      VALUES (?, ?, ?)
    `,
    [sessionId, address, expiresAt],
  );

  return {
    session: {
      id: sessionId,
      address,
      role: "super_admin" as const,
      expiresAt,
    },
    cookie: serializeAdminSessionCookie(request, sessionId, expiresAt),
  };
}

export async function getSuperAdminSession(
  context: AppLoadContext,
  request: Request,
): Promise<AdminSession | null> {
  const sessionId = getCookie(request, ADMIN_SESSION_COOKIE);

  if (!sessionId) {
    return null;
  }

  const now = currentUnixSeconds();
  const row = await queryFirst<AdminSessionRow>(
    context,
    `
      SELECT
        admin_sessions.id,
        admin_sessions.address,
        admin_sessions.expires_at,
        admin_sessions.revoked_at,
        admin_wallets.role,
        admin_wallets.status
      FROM admin_sessions
      INNER JOIN admin_wallets ON admin_wallets.address = admin_sessions.address
      WHERE admin_sessions.id = ?
    `,
    [sessionId],
  );

  if (
    !row ||
    row.revoked_at !== null ||
    row.expires_at < now ||
    row.role !== "super_admin" ||
    row.status !== "active"
  ) {
    return null;
  }

  const address = normalizeAdminAddress(row.address);

  if (!address) {
    return null;
  }

  return {
    id: row.id,
    address,
    role: "super_admin",
    expiresAt: row.expires_at,
  };
}

export async function requireSuperAdminPage(
  context: AppLoadContext,
  request: Request,
) {
  const session = await getSuperAdminSession(context, request);

  if (!session) {
    const url = new URL(request.url);
    const redirectTo = `${url.pathname}${url.search}`;
    throw redirect(`/admin/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  return session;
}

export async function requireSuperAdminApi(
  context: AppLoadContext,
  request: Request,
) {
  const session = await getSuperAdminSession(context, request);

  if (!session) {
    jsonError("Unauthorized", 401);
  }

  return session;
}

export async function revokeAdminSession(
  context: AppLoadContext,
  request: Request,
) {
  const sessionId = getCookie(request, ADMIN_SESSION_COOKIE);

  if (sessionId) {
    await execute(
      context,
      "UPDATE admin_sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL",
      [currentUnixSeconds(), sessionId],
    );
  }

  return serializeExpiredAdminSessionCookie(request);
}

export function sanitizeAdminRedirect(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/admin")) {
    return "/admin/asset";
  }

  if (value.startsWith("/admin/auth") || value.startsWith("/admin/login")) {
    return "/admin/asset";
  }

  if (value.startsWith("/admin/logout")) {
    return "/admin/asset";
  }

  return value;
}

function createLoginMessage({
  address,
  nonce,
  request,
  issuedAt,
  expiresAt,
}: {
  address: `0x${string}`;
  nonce: string;
  request: Request;
  issuedAt: string;
  expiresAt: string;
}) {
  const url = new URL(request.url);

  return [
    "Phenix Admin wants you to sign in with your Ethereum account:",
    address,
    "",
    "Sign this message to access the Phenix admin console.",
    "",
    `URI: ${url.origin}/admin/login`,
    "Version: 1",
    `Chain ID: ${BASE_CHAIN_ID}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expiresAt}`,
  ].join("\n");
}

function serializeAdminSessionCookie(
  request: Request,
  sessionId: string,
  expiresAt: number,
) {
  const maxAge = Math.max(0, expiresAt - currentUnixSeconds());
  return serializeCookie(request, ADMIN_SESSION_COOKIE, sessionId, maxAge);
}

function serializeExpiredAdminSessionCookie(request: Request) {
  return serializeCookie(request, ADMIN_SESSION_COOKIE, "", 0);
}

function serializeCookie(
  request: Request,
  name: string,
  value: string,
  maxAge: number,
) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/admin",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function getCookie(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return "";
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return "";
}

function currentUnixSeconds() {
  return Math.floor(Date.now() / 1000);
}

function jsonError(message: string, status: number): never {
  throw Response.json({ error: message }, { status });
}
