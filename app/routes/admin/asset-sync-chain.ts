import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { requireSuperAdminApi } from "@/lib/server/admin-auth";
import { syncOnchainRwaAssetsToDatabase } from "@/lib/server/rwa-chain-sync";

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminApi(context, request);

  return Response.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json(
      { error: "Method Not Allowed" },
      { status: 405, headers: { Allow: "POST" } },
    );
  }

  await requireSuperAdminApi(context, request);

  try {
    return Response.json(await syncOnchainRwaAssetsToDatabase(context));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "同步链上资产失败" },
      { status: 500 },
    );
  }
}
