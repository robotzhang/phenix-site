import { useNavigate, useParams, type LoaderFunctionArgs } from "react-router";

import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import { OffchainAssetEditor } from "./asset/offchain-editor";

export async function loader({ context, request }: LoaderFunctionArgs) {
  await requireSuperAdminPage(context, request);
  return null;
}

export function meta() {
  return [
    { title: "编辑链下资料 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminAssetEdit() {
  const { assetId } = useParams();
  const navigate = useNavigate();

  return (
    <OffchainAssetEditor
      assetId={assetId}
      mode="page"
      onSaved={(assetCode) => navigate(`/admin/asset/${assetCode}`)}
    />
  );
}
