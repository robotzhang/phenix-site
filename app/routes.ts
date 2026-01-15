import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("assets", "./routes/assets.tsx"),
  route("nft", "./routes/nft.tsx"),
  route("nft/metadata", "./routes/nft-metadata.tsx"),
  route("rwa", "./routes/rwa/list.tsx"),
  route("rwa/:rwaId", "./routes/rwa/show.tsx"),
  route("meme", "./routes/meme.tsx"),
  ...prefix("support", [
    route("bridge", "routes/support/bridge.tsx"),
  ]),
] satisfies RouteConfig;
