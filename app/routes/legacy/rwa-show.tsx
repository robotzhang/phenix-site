import { redirect, type LoaderFunctionArgs } from "react-router";

export function loader({ params }: LoaderFunctionArgs) {
  throw redirect(`/asset/${params.assetId ?? ""}`, 301);
}

export default function LegacyRwaShow() {
  return null;
}
