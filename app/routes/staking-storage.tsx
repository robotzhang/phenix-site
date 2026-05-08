import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { STAKING_STORAGE_ROUTE } from "@/lib/staking-storage.shared";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return handleStakingStorageRequest(request, context);
}

export async function action({ request, context }: ActionFunctionArgs) {
  return handleStakingStorageRequest(request, context);
}

async function handleStakingStorageRequest(
  request: Request,
  context: LoaderFunctionArgs["context"],
) {
  const url = new URL(request.url);

  if (url.pathname !== STAKING_STORAGE_ROUTE) {
    return new Response("Not Found", { status: 404 });
  }

  const env = (context as { cloudflare?: { env?: Env } }).cloudflare?.env;

  if (!env?.STAKING_STORAGE) {
    return Response.json(
      { error: "Staking storage is not configured" },
      { status: 500 },
    );
  }

  const id = env.STAKING_STORAGE.idFromName("global");
  const stub = env.STAKING_STORAGE.get(id);
  return stub.fetch(request);
}
