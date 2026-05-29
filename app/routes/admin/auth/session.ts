import type { LoaderFunctionArgs } from "react-router";

import { getSuperAdminSession } from "@/lib/server/admin-auth";

export async function loader({ context, request }: LoaderFunctionArgs) {
  const session = await getSuperAdminSession(context, request);

  return Response.json({
    authenticated: Boolean(session),
    admin: session
      ? {
        address: session.address,
        role: session.role,
        expiresAt: session.expiresAt,
      }
      : null,
  });
}

