import type { ActionFunctionArgs } from "react-router";

import { verifyAdminLogin } from "@/lib/server/admin-auth";

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || typeof payload !== "object") {
    return Response.json({ error: "Missing login payload" }, { status: 400 });
  }

  const { session, cookie } = await verifyAdminLogin(
    context,
    request,
    payload as {
      address?: unknown;
      nonce?: unknown;
      message?: unknown;
      signature?: unknown;
    },
  );

  return Response.json(
    {
      ok: true,
      admin: {
        address: session.address,
        role: session.role,
        expiresAt: session.expiresAt,
      },
    },
    {
      headers: {
        "Set-Cookie": cookie,
      },
    },
  );
}

