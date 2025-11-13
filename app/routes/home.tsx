import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Phenix RWA" },
    { name: "description", content: "Welcome Phenix RWA!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>this is phenix RWA!</h1>
      <div>{loaderData.message}</div>
    </div>
  );
}
