import { redirect, type ActionFunctionArgs } from "react-router";

import {
  revokeAdminSession,
  sanitizeAdminRedirect,
} from "@/lib/server/admin-auth";

export async function action({ context, request }: ActionFunctionArgs) {
  const cookie = await revokeAdminSession(context, request);
  const formData = await request.formData().catch(() => null);
  const redirectTo = sanitizeAdminRedirect(formData?.get("redirectTo"));

  throw redirect(`/admin/login?redirectTo=${encodeURIComponent(redirectTo)}`, {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}

