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

  const imageUrl = `https://phenixmcga.com/member-credential.svg`;

  const metadata = {
    name: `PHENIX 鉴定服务卡 #${id}`,
    description: "PHENIX 鉴定服务卡线上凭证。",
    image: imageUrl,
    attributes: [
      { trait_type: "鉴定服务卡编号", value: id },
    ]
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
