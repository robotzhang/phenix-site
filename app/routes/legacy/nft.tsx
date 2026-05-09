import { redirect } from "react-router";

export function loader() {
  throw redirect("/rda", 301);
}

export default function LegacyNft() {
  return null;
}
