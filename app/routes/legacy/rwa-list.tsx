import { redirect } from "react-router";

export function loader() {
  throw redirect("/asset", 301);
}

export default function LegacyRwaList() {
  return null;
}
