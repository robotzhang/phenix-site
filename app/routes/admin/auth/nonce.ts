import type { ActionFunctionArgs } from "react-router";

import { createAdminLoginChallenge } from "@/lib/server/admin-auth";

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const payload = await request.json().catch(() => null);
  const challenge = await createAdminLoginChallenge(
    context,
    request,
    payload && typeof payload === "object"
      ? (payload as { address?: unknown }).address
      : undefined,
  );

  return Response.json(challenge);
}

