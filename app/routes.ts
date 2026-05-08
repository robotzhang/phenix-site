import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("assets", "./routes/assets.tsx"),
  route("nft", "./routes/nft.tsx"),
  route("nft/metadata", "./routes/nft-metadata.tsx"),
  route("rwa", "./routes/rwa/list.tsx"),
  route("rwa/metadata", "./routes/rwa/metadata.tsx"),
  route("rwa/:rwaId", "./routes/rwa/show.tsx"),
  route("admin/rwa/storage", "./routes/admin/rwa-storage.tsx"),
  route("admin/rwa", "./routes/admin/rwa.tsx"),
  route("membership", "./routes/membership.tsx"),
  route("points-mall", "./routes/points-mall.tsx"),
  route("staking/storage", "./routes/staking-storage.tsx"),
  route("staking", "./routes/staking.tsx"),
  route("custody", "./routes/custody.tsx"),
  route("liquidity", "./routes/liquidity.tsx"),
  route("meme", "./routes/meme.tsx"),
  ...prefix("support", [
    route("bridge", "routes/support/bridge.tsx"),
  ]),
] satisfies RouteConfig;
