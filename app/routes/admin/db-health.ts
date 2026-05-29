import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import {
  deleteAppSetting,
  getAppSetting,
  listAppSettings,
  upsertAppSetting,
} from "@/lib/server/app-settings.repository";
import { queryFirst } from "@/lib/server/db";

type HealthRow = {
  ok: number;
};

export async function loader({ context }: LoaderFunctionArgs) {
  const health = await queryFirst<HealthRow>(context, "SELECT 1 AS ok");

  return Response.json({
    ok: health?.ok === 1,
    binding: "DB",
  });
}

export async function action({ context, request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }

  if (!isLocalRequest(request)) {
    return Response.json(
      { error: "DB health write checks are only available locally" },
      { status: 403 },
    );
  }

  const settings = await listAppSettings(context);
  const key = "__db_health_check__";

  const inserted = await upsertAppSetting(context, {
    key,
    value: "insert",
    description: "Temporary D1 health check row",
  });

  const updated = await upsertAppSetting(context, {
    key,
    value: "update",
    description: "Temporary D1 health check row",
  });

  const loaded = await getAppSetting(context, key);
  const deleted = await deleteAppSetting(context, key);

  return Response.json({
    ok: loaded?.value === "update" && deleted,
    appSettingsCountBeforeCheck: settings.length,
    inserted,
    updated,
    loaded,
    deleted,
  });
}

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}
