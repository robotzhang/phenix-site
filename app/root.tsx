import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import clsx from "clsx";

import type { Route } from "./+types/root";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from '@/components/wallet/Providers';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useScrollHeader } from "@/lib/useScrollHeader";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon-blue.svg", type: "image/svg+xml" },
  { rel: "shortcut icon", href: "/favicon-blue.svg" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://unpkg.com/@rainbow-me/rainbowkit@2.2.9/styles.css",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <Toaster position="top-center" />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { scrolled } = useScrollHeader(50);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Providers>
        <div className="min-h-screen text-foreground">
          <Outlet />
        </div>
      </Providers>
    );
  }

  //
  return (
    <Providers>
      <div className="min-h-screen flex flex-col text-foreground">
        <header 
          className={
            clsx(
              "transition-colors duration-500 fixed top-0 left-0 h-14 sm:h-16 px-4 sm:px-6 right-0 w-full z-20",
              scrolled || !isHome ? "bg-white/[0.88] backdrop-blur-md border-b border-b-sky-100 shadow-sm shadow-sky-950/[0.05]" : "border-b border-b-transparent",
            )
          }
        >
          <Header scrolled={scrolled || !isHome} />
        </header>
        <main className={clsx("flex-1 container", isHome ? "pt-0" : "pt-14 sm:pt-16")}>
          <Outlet />
        </main>
        <footer>
          <Footer />
        </footer>
      </div>
    </Providers>
    
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
