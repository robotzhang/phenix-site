import { DurableObject } from "cloudflare:workers";

import {
  emptyRwaAdminStorageDocument,
  normalizeRwaAdminImageURLs,
  normalizeRwaAdminStorageDocument,
  trimAdminStorageString,
  type RwaAdminMetadata,
  type RwaAdminStorageDocument,
} from "@/lib/rwa-admin-storage.shared";

const MAX_IMAGE_BYTES = 450_000;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

function readMetadataPayload(raw: unknown) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const payload = raw as Partial<RwaAdminMetadata> & {
    tokenId?: unknown;
  };
  const tokenId = trimAdminStorageString(payload.tokenId);
  const categoryLabel = trimAdminStorageString(payload.categoryLabel);
  const sellerCategoryLabel = trimAdminStorageString(payload.sellerCategoryLabel);

  if (!tokenId) return null;

  return {
    tokenId,
    categoryLabel,
    sellerCategoryLabel,
    name: trimAdminStorageString(payload.name) || undefined,
    recipient: trimAdminStorageString(payload.recipient) || undefined,
    pricePhenix: trimAdminStorageString(payload.pricePhenix) || undefined,
    fileHash: trimAdminStorageString(payload.fileHash) || undefined,
    imageURL: trimAdminStorageString(payload.imageURL) || undefined,
    imageURLs: normalizeRwaAdminImageURLs(payload.imageURLs),
    tokenURI: trimAdminStorageString(payload.tokenURI) || undefined,
    status: typeof payload.status === "number" ? payload.status : undefined,
  };
}

function getImageContentType(request: Request) {
  return request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
}

function buildImageKey(contentType: string) {
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const random =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `asset-image:${random}.${extension}`;
}

function resolveImageKey(pathname: string) {
  const prefix = "/admin/asset/image/";
  if (!pathname.startsWith(prefix)) return "";
  return decodeURIComponent(pathname.slice(prefix.length));
}

export class RwaAdminStorage extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  private async readDocument(): Promise<RwaAdminStorageDocument> {
    const stored = await this.ctx.storage.get("document");
    return normalizeRwaAdminStorageDocument(
      stored ?? emptyRwaAdminStorageDocument(),
    );
  }

  private async writeDocument(document: RwaAdminStorageDocument) {
    await this.ctx.storage.put("document", document);
    return document;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const imageKey = resolveImageKey(url.pathname);

      if (imageKey) {
        const stored = await this.ctx.storage.get<{
          body: ArrayBuffer;
          contentType: string;
        }>(imageKey);

        if (!stored) {
          return new Response("Not Found", { status: 404 });
        }

        return new Response(stored.body, {
          headers: {
            "Content-Type": stored.contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      return jsonResponse(await this.readDocument());
    }

    if (request.method === "PUT") {
      const contentType = getImageContentType(request);

      if (!SUPPORTED_IMAGE_TYPES.has(contentType)) {
        return jsonResponse(
          { error: "仅支持 JPG、PNG 或 WebP 图片" },
          { status: 415 },
        );
      }

      const body = await request.arrayBuffer();
      if (body.byteLength > MAX_IMAGE_BYTES) {
        return jsonResponse(
          { error: "图片过大，请压缩到 450KB 以内" },
          { status: 413 },
        );
      }

      const key = buildImageKey(contentType);
      await this.ctx.storage.put(key, { body, contentType });

      return jsonResponse({
        imageURL: `/admin/asset/image/${encodeURIComponent(key)}`,
      });
    }

    if (request.method === "POST") {
      const payload = readMetadataPayload(await request.json());

      if (!payload || !payload.categoryLabel || !payload.sellerCategoryLabel) {
        return jsonResponse(
          {
            error: "缺少 tokenId、资产类别或卖家类别",
          },
          { status: 400 },
        );
      }

      const now = new Date().toISOString();
      const document = await this.readDocument();
      const previous = document.items[payload.tokenId];

      document.items[payload.tokenId] = {
        tokenId: payload.tokenId,
        categoryLabel: payload.categoryLabel,
        sellerCategoryLabel: payload.sellerCategoryLabel,
        createdAt: previous?.createdAt ?? now,
        updatedAt: now,
        name: payload.name ?? previous?.name,
        recipient: payload.recipient ?? previous?.recipient,
        pricePhenix: payload.pricePhenix ?? previous?.pricePhenix,
        fileHash: payload.fileHash ?? previous?.fileHash,
        imageURL: payload.imageURL ?? previous?.imageURL,
        imageURLs: payload.imageURLs ?? previous?.imageURLs,
        tokenURI: payload.tokenURI ?? previous?.tokenURI,
        status: payload.status ?? previous?.status,
      };
      document.updatedAt = now;

      return jsonResponse(await this.writeDocument(document));
    }

    if (request.method === "DELETE") {
      const raw = await request.json();
      const tokenId = trimAdminStorageString(
        raw && typeof raw === "object" ? (raw as { tokenId?: unknown }).tokenId : "",
      );

      if (!tokenId) {
        return jsonResponse({ error: "缺少 tokenId" }, { status: 400 });
      }

      const now = new Date().toISOString();
      const document = await this.readDocument();
      delete document.items[tokenId];
      document.updatedAt = now;

      return jsonResponse(await this.writeDocument(document));
    }

    return jsonResponse(
      { error: "Method Not Allowed" },
      {
        status: 405,
        headers: {
      Allow: "GET, POST, DELETE",
        },
      },
    );
  }
}
