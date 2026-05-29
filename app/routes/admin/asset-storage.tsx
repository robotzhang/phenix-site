import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import {
  RWA_ADMIN_IMAGE_ROUTE,
  RWA_ADMIN_STORAGE_ROUTE,
} from "@/lib/rwa-admin-storage.shared";
import { requireSuperAdminApi } from "@/lib/server/admin-auth";

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
