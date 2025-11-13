import type { Route } from "./+types/home";
import { Buy } from "@/components/biz/Buy";

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
    <div className="py-20">
      <h1 className="text-5xl font-semibold text-center">
        The ticket for RWA!
      </h1>

      <div className="mt-6">
        <Buy />
      </div>
    </div>
  );
}
