import FQA from "@/components/biz/FQA";
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
    <div className="py-10 sm:py-20">
      <h1 className="text-5xl font-semibold text-center flex flex-col gap-2">
        <p>The Ticket</p>
        <p>Of Phenix RWA!</p>
      </h1>

      <div className="mt-10 p-6 relative shadow-lg rounded-2xl max-w-lg m-auto flex flex-col gap-1 bg-card text-card-foreground">
        <Buy />
      </div>

      <div className="py-10 sm:py-20 max-w-5xl m-auto">
        <h2 className="text-3xl font-semibold mb-2 sm:mb-6">FQA</h2>
        <FQA />
      </div>
    </div>
  );
}
