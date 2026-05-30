import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { requireSuperAdminApi } from "@/lib/server/admin-auth";

const MAX_PACKAGE_BYTES = 60 * 1024 * 1024;
const PACKAGE_CONTENT_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

function getEnv(context: ActionFunctionArgs["context"] | LoaderFunctionArgs["context"]) {
  return (context as { cloudflare?: { env?: Env } }).cloudflare?.env;
}

function getPackageContentType(request: Request) {
  return request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(buffer: ArrayBuffer) {
  return toHex(await crypto.subtle.digest("SHA-256", buffer));
}

function normalizeAssetCode(value: string | null) {
  return (value ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

function buildPackageKey(hash: string) {
  return `asset-packages/${hash}.zip`;
}

function buildPackageURL(hash: string) {
  return `/asset/package/${hash}.zip`;
}

function resolvePackageHash(pathname: string) {
  const prefix = "/asset/package/";

  if (!pathname.startsWith(prefix)) return "";

  const raw = decodeURIComponent(pathname.slice(prefix.length)).replace(/\.zip$/i, "");
  return /^[a-f0-9]{64}$/i.test(raw) ? raw.toLowerCase() : "";
}

export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "PUT") {
    return jsonResponse(
      { error: "Method Not Allowed" },
      { status: 405, headers: { Allow: "PUT" } },
    );
  }

  await requireSuperAdminApi(context, request);

  const env = getEnv(context);
  const bucket = env?.ASSET_PACKAGES;

  if (!bucket) {
    return jsonResponse(
      { error: "Asset package storage is not configured" },
      { status: 500 },
    );
  }

  const contentType = getPackageContentType(request);

  if (!PACKAGE_CONTENT_TYPES.has(contentType)) {
    return jsonResponse(
      { error: "仅支持 ZIP 文件包" },
      { status: 415 },
    );
  }

  const body = await request.arrayBuffer();

  if (!body.byteLength) {
    return jsonResponse({ error: "文件包为空" }, { status: 400 });
  }

  if (body.byteLength > MAX_PACKAGE_BYTES) {
    return jsonResponse(
      { error: "文件包过大，请控制在 60MB 以内" },
      { status: 413 },
    );
  }

  const packageHash = await sha256Hex(body);
  const packageKey = buildPackageKey(packageHash);
  const assetCode = normalizeAssetCode(new URL(request.url).searchParams.get("assetCode"));

  if (!(await bucket.head(packageKey))) {
    await bucket.put(packageKey, body, {
      httpMetadata: {
        contentType: "application/zip",
        contentDisposition: `attachment; filename="${assetCode || "phenix-asset"}-${packageHash}.zip"`,
      },
      customMetadata: {
        assetCode,
        packageHash,
      },
    });
  }

  return jsonResponse({
    fileHash: packageHash,
    packageHash,
    packageKey,
    packageSize: String(body.byteLength),
    packageURL: buildPackageURL(packageHash),
  });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET" },
    });
  }

  const packageHash = resolvePackageHash(new URL(request.url).pathname);

  if (!packageHash) {
    return new Response("Not Found", { status: 404 });
  }

  const bucket = getEnv(context)?.ASSET_PACKAGES;

  if (!bucket) {
    return new Response("Asset package storage is not configured", { status: 500 });
  }

  const object = await bucket.get(buildPackageKey(packageHash));

  if (!object) {
    return new Response("Not Found", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/zip",
      "Content-Length": String(object.size),
      "Content-Disposition":
        object.httpMetadata?.contentDisposition ??
        `attachment; filename="phenix-asset-${packageHash}.zip"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
