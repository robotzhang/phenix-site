import { DurableObject } from "cloudflare:workers";

import {
  emptyStakingStorageDocument,
  normalizePositiveInteger,
  normalizeStakingStorageDocument,
  normalizeWalletAddress,
  type StakingStorageDocument,
} from "@/lib/staking-storage.shared";

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

function createRecordId(prefix: string, now: string) {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `${prefix}-${Date.parse(now)}-${suffix}`;
}

export class StakingStorage extends DurableObject {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }

  private async readDocument(): Promise<StakingStorageDocument> {
    const stored = await this.ctx.storage.get("document");
    return normalizeStakingStorageDocument(
      stored ?? emptyStakingStorageDocument(),
    );
  }

  private async writeDocument(document: StakingStorageDocument) {
    await this.ctx.storage.put("document", document);
    return document;
  }

  async fetch(request: Request) {
    if (request.method === "GET") {
      return jsonResponse(await this.readDocument());
    }

    if (request.method === "POST") {
      const raw = await request.json();
      const payload = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const address = normalizeWalletAddress(payload.address);
      const cardCount = normalizePositiveInteger(payload.cardCount);
      const ownedCardCount = normalizePositiveInteger(payload.ownedCardCount);

      if (!address || cardCount <= 0) {
        return jsonResponse(
          { error: "缺少钱包地址或鉴定服务卡数量" },
          { status: 400 },
        );
      }

      if (ownedCardCount <= 0) {
        return jsonResponse(
          { error: "缺少当前持有的鉴定服务卡数量" },
          { status: 400 },
        );
      }

      const now = new Date().toISOString();
      const document = await this.readDocument();
      const activeStakedCards = Object.values(document.stakes)
        .filter((item) => item.address === address && item.status === "active")
        .reduce((sum, item) => sum + item.cardCount, 0);
      const pendingBuybackCards = Object.values(document.buybackRequests)
        .filter((item) => item.address === address && item.status === "pending")
        .reduce((sum, item) => sum + item.cardCount, 0);
      const operableCards = Math.max(
        ownedCardCount - activeStakedCards - pendingBuybackCards,
        0,
      );

      if (cardCount > operableCards) {
        return jsonResponse(
          { error: "数量超过可操作的未质押鉴定服务卡，质押中的服务卡不能提交回购申请" },
          { status: 400 },
        );
      }

      if (payload.type === "stake") {
        const months = normalizePositiveInteger(payload.months);
        const annualRate =
          typeof payload.annualRate === "number" && Number.isFinite(payload.annualRate)
            ? payload.annualRate
            : Number(payload.annualRate);

        if (months <= 0 || !Number.isFinite(annualRate) || annualRate <= 0) {
          return jsonResponse(
            { error: "缺少质押周期或年化规则" },
            { status: 400 },
          );
        }

        const id = createRecordId("stake", now);
        document.stakes[id] = {
          id,
          address,
          cardCount,
          months,
          annualRate,
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
        document.updatedAt = now;

        return jsonResponse(await this.writeDocument(document));
      }

      if (payload.type === "buyback") {
        const id = createRecordId("buyback", now);
        document.buybackRequests[id] = {
          id,
          address,
          cardCount,
          payoutCurrency: "RMB",
          status: "pending",
          createdAt: now,
          updatedAt: now,
        };
        document.updatedAt = now;

        return jsonResponse(await this.writeDocument(document));
      }

      return jsonResponse({ error: "未知操作类型" }, { status: 400 });
    }

    return jsonResponse(
      { error: "Method Not Allowed" },
      {
        status: 405,
        headers: {
          Allow: "GET, POST",
        },
      },
    );
  }
}
