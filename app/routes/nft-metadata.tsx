import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  // 你可以替换成自己的图片地址
  const imageUrl = `https://phenix-site.dianin.workers.dev/logo.png`;

  const metadata = {
    name: `Phenix FNFT #${id}`,
    description: "Your on-chain Phenix F-NFT asset.",
    image: imageUrl,
    attributes: [
      { trait_type: "Token ID", value: id },
    ]
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
