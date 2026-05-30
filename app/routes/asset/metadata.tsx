import type { LoaderFunctionArgs } from "react-router";

import {
  isAssetSchemaMissingError,
  readAssetTokenMetadata,
} from "@/lib/server/assets.repository";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const fileHash = url.searchParams.get("hash");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const storedMetadata = await readAssetTokenMetadata(context, id, fileHash).catch(
    (error) => {
      if (isAssetSchemaMissingError(error)) return null;
      throw error;
    },
  );
  const resolvedFileHash = storedMetadata?.fileHash || fileHash || "";
  const imageUrl = storedMetadata?.imageURL
    ? resolvePublicAssetURL(request, storedMetadata.imageURL)
    : `https://rwa-cdn.phenixmcga.com/${resolvedFileHash}/cover.png`;

  const metadata = {
    name: storedMetadata?.name || `Phenix Asset #${id}`,
    description: "Your on-chain Phenix asset.",
    image: imageUrl,
    attributes: [
      { trait_type: "Token ID", value: id },
      { trait_type: "File Hash", value: resolvedFileHash },
    ]
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

function resolvePublicAssetURL(request: Request, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, new URL(request.url).origin).toString();
}
