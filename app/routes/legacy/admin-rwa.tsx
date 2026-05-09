import { redirect } from "react-router";

export function loader() {
  throw redirect("/admin/asset", 301);
}

export default function LegacyAdminRwa() {
  return null;
}
