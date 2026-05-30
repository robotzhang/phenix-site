import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import {
  RWA_ADMIN_IMAGE_ROUTE,
  RWA_ADMIN_STORAGE_ROUTE,
  trimAdminStorageString,
  type RwaAdminMetadataInput,
} from "@/lib/rwa-admin-storage.shared";
import {
  deleteAssetAdminMetadata,
  isAssetSchemaMissingError,
  readAssetAdminStorageDocument,
  saveAssetAdminMetadata,
} from "@/lib/server/assets.repository";
import { requireSuperAdminApi } from "@/lib/server/admin-auth";

const MAX_IMAGE_BYTES = 450_000;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_KIND_SEGMENTS = {
  product: "images",
  certificate: "certificates",
} as const;

export async function loader({ request, context }: LoaderFunctionArgs) {
  return handleRwaAdminStorageRequest(request, context);
}

export async function action({ request, context }: ActionFunctionArgs) {
  return handleRwaAdminStorageRequest(request, context);
}

async function handleRwaAdminStorageRequest(
  request: Request,
  context: LoaderFunctionArgs["context"],
) {
  const url = new URL(request.url);

  if (
    url.pathname !== RWA_ADMIN_STORAGE_ROUTE &&
    url.pathname !== RWA_ADMIN_IMAGE_ROUTE &&
    !url.pathname.startsWith(`${RWA_ADMIN_IMAGE_ROUTE}/`) &&
    url.pathname !== "/admin/rwa/storage"
  ) {
    return new Response("Not Found", { status: 404 });
  }

  if (request.method !== "GET") {
    await requireSuperAdminApi(context, request);
  }

  if (
    url.pathname === RWA_ADMIN_IMAGE_ROUTE ||
    url.pathname.startsWith(`${RWA_ADMIN_IMAGE_ROUTE}/`)
  ) {
    return handleAssetImageRequest(request, context, url);
  }

  if (url.pathname === RWA_ADMIN_STORAGE_ROUTE) {
    try {
      if (request.method === "GET") {
        return Response.json(await readAssetAdminStorageDocument(context));
      }

      if (request.method === "POST") {
        const payload = await request.json();
        const tokenId = readTokenId(payload);

        if (!tokenId) {
          return Response.json({ error: "缺少 tokenId" }, { status: 400 });
        }

        if (!readRequiredString(payload, "categoryLabel") || !readRequiredString(payload, "sellerCategoryLabel")) {
          return Response.json(
            { error: "缺少资产类别或卖家类别" },
            { status: 400 },
          );
        }

        return Response.json(
          await saveAssetAdminMetadata(
            context,
            tokenId,
            payload as RwaAdminMetadataInput,
          ),
        );
      }

      if (request.method === "DELETE") {
        const payload = await request.json();
        const tokenId = readTokenId(payload);

        if (!tokenId) {
          return Response.json({ error: "缺少 tokenId" }, { status: 400 });
        }

        return Response.json(await deleteAssetAdminMetadata(context, tokenId));
      }

      return Response.json(
        { error: "Method Not Allowed" },
        { status: 405, headers: { Allow: "GET, POST, DELETE" } },
      );
    } catch (error) {
      if (!isAssetSchemaMissingError(error)) {
        return Response.json(
          { error: error instanceof Error ? error.message : "资产数据库操作失败" },
          { status: 500 },
        );
      }

      return proxyRwaAdminStorageRequest(request, context);
    }
  }

  return proxyRwaAdminStorageRequest(request, context);
}

async function handleAssetImageRequest(
  request: Request,
  context: LoaderFunctionArgs["context"],
  url: URL,
) {
  if (request.method === "GET") {
    const imageKey = resolveImageKey(url.pathname);

    if (!imageKey) {
      return proxyRwaAdminStorageRequest(request, context);
    }

    const bucket = getAssetsBucket(context);
    const object = bucket ? await bucket.get(imageKey) : null;

    if (object) {
      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType ?? guessImageContentType(imageKey),
          "Content-Length": String(object.size),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return proxyRwaAdminStorageRequest(request, context);
  }

  if (request.method !== "PUT") {
    return Response.json(
      { error: "Method Not Allowed" },
      { status: 405, headers: { Allow: "GET, PUT" } },
    );
  }

  const bucket = getAssetsBucket(context);

  if (!bucket) {
    return proxyRwaAdminStorageRequest(request, context);
  }

  const contentType = getImageContentType(request);

  if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
    return Response.json({ error: "仅支持 JPG、PNG 或 WebP 图片" }, { status: 415 });
  }

  const body = await request.arrayBuffer();

  if (body.byteLength > MAX_IMAGE_BYTES) {
    return Response.json(
      { error: "图片过大，请压缩到 450KB 以内" },
      { status: 413 },
    );
  }

  const kind = normalizeImageKind(url.searchParams.get("kind"));
  const imageKey = buildImageKey({
    contentType,
    kind,
  });

  await bucket.put(imageKey, body, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      kind,
    },
  });

  return Response.json({
    imageKey,
    imageURL: `${RWA_ADMIN_IMAGE_ROUTE}/${encodeURIComponent(imageKey)}`,
  });
}

function getAssetsBucket(context: LoaderFunctionArgs["context"]) {
  return (context as { cloudflare?: { env?: Env } }).cloudflare?.env?.ASSETS;
}

function getImageContentType(request: Request) {
  return request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function normalizeImageKind(value: string | null): keyof typeof IMAGE_KIND_SEGMENTS {
  return value === "certificate" ? "certificate" : "product";
}

function buildImageKey({
  contentType,
  kind,
}: {
  contentType: string;
  kind: keyof typeof IMAGE_KIND_SEGMENTS;
}) {
  const extension =
    contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const random =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${IMAGE_KIND_SEGMENTS[kind]}/${random}.${extension}`;
}

function resolveImageKey(pathname: string) {
  const prefix = `${RWA_ADMIN_IMAGE_ROUTE}/`;
  if (!pathname.startsWith(prefix)) return "";
  return decodeURIComponent(pathname.slice(prefix.length));
}

function guessImageContentType(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function readTokenId(payload: unknown) {
  return trimAdminStorageString(
    payload && typeof payload === "object"
      ? (payload as { tokenId?: unknown }).tokenId
      : "",
  );
}

function readRequiredString(payload: unknown, key: keyof RwaAdminMetadataInput) {
  return trimAdminStorageString(
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)[key]
      : "",
  );
}

function proxyRwaAdminStorageRequest(
  request: Request,
  context: LoaderFunctionArgs["context"],
) {
  const env = (context as { cloudflare?: { env?: Env } }).cloudflare?.env;

  if (!env?.RWA_ADMIN_STORAGE) {
    return Response.json(
      { error: "RWA admin storage is not configured" },
      { status: 500 },
    );
  }

  const id = env.RWA_ADMIN_STORAGE.idFromName("global");
  const stub = env.RWA_ADMIN_STORAGE.get(id);
  return stub.fetch(request);
}
