import clsx from "clsx";
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import {
  FileCheck2,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";

type AdminLayoutData = {
  admin: {
    address: `0x${string}`;
    role: "super_admin";
    expiresAt: number;
  };
};

type NavItemProps = {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
};

export async function loader({ context, request }: LoaderFunctionArgs) {
  const admin = await requireSuperAdminPage(context, request);

  return {
    admin: {
      address: admin.address,
      role: admin.role,
      expiresAt: admin.expiresAt,
    },
  } satisfies AdminLayoutData;
}

function navLinkClass(isActive: boolean) {
  return clsx(
    isActive ? "bg-neutral-200/60" : "",
    "outline-hidden flex items-center gap-1 rounded-lg px-2 py-1 text-sm hover:bg-neutral-200/60",
  );
}

function NavItem({ to, icon: Icon, label, end }: NavItemProps) {
  return (
    <li>
      <NavLink end={end} to={to} className={({ isActive }) => navLinkClass(isActive)}>
        <Icon strokeWidth={1} className="h-5 w-5" />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}

function NavGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="mt-4 h-6 px-2 text-sm text-neutral-400 antialiased">
        {title}
      </div>
      <ul className="flex flex-col gap-1">{children}</ul>
    </>
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function AdminLayout() {
  const { admin } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-20 flex h-screen w-64 flex-col justify-between border-r bg-transparent p-3">
        <div>
          <div className="flex items-center justify-between gap-2 py-1 pl-1 pr-0">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold tracking-tight">
                  PHENIX
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Admin
                </div>
              </div>
            </div>
          </div>

          <NavGroup title="常用">
            <NavItem to="/admin/asset" icon={FileCheck2} label="资产库" end />
          </NavGroup>

          <NavGroup title="系统">
            <NavItem to="/" icon={LayoutDashboard} label="返回官网" />
          </NavGroup>
        </div>

        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <div className="text-xs text-neutral-500">超级管理员</div>
          <div className="mt-1 truncate text-sm font-semibold">
            {shortAddress(admin.address)}
          </div>
          <Form method="post" action="/admin/logout" className="mt-3">
            <input type="hidden" name="redirectTo" value="/admin/asset" />
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <LogOut className="h-4 w-4" />
              退出
            </Button>
          </Form>
        </div>
      </aside>

      <main className="ml-64 min-h-screen min-w-0 overflow-x-auto bg-neutral-100">
        <Outlet />
      </main>
    </div>
  );
}
