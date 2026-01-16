import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const fileHash = url.searchParams.get("hash");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 动态地址
  const imageUrl = `https://rwa-cdn.phenixmcga.com/${fileHash}/cover.png`;

  const metadata = {
    name: `Phenix RWA #${id}`,
    description: "Your on-chain Phenix RWA asset.",
    image: imageUrl,
    attributes: [
      { trait_type: "Token ID", value: id },
      { trait_type: "File Hash", value: fileHash },
    ]
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
