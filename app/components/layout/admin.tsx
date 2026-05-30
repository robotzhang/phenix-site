import clsx from "clsx";
import {
  Form,
  NavLink,
  Outlet,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import {
  ChevronDown,
  FileCheck2,
  House,
  LayoutDashboard,
  LogOut,
  Settings2,
  UserCog,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalLoading } from "@/components/ui/ssr-global-loading";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  reloadDocument?: boolean;
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
    isActive ? "is-active bg-neutral-200/60" : "",
    "admin-nav-link outline-hidden flex items-center gap-1 rounded-lg px-2 py-1 text-base hover:bg-neutral-200/60",
  );
}

function NavItem({ to, icon: Icon, label, end, reloadDocument }: NavItemProps) {
  return (
    <li>
      <NavLink
        end={end}
        reloadDocument={reloadDocument}
        to={to}
        className={({ isActive }) => navLinkClass(isActive)}
      >
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
  const addressLabel = shortAddress(admin.address);

  return (
    <>
      <GlobalLoading />
      <div className="admin-shell min-h-screen bg-neutral-100 text-neutral-950">
        <aside className="admin-sidebar fixed inset-y-0 left-0 z-20 flex h-screen w-64 flex-col border-r bg-transparent p-3">
          <div>
            <div className="flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                aria-label="返回官网"
                title="返回官网"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#821313,#d1a047)] text-[#fff8ec] shadow-sm shadow-red-950/20 outline-hidden hover:bg-[linear-gradient(135deg,#5f0b0b,#c99532)] focus-visible:bg-[linear-gradient(135deg,#5f0b0b,#c99532)]"
              >
                <House className="size-4" />
              </a>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-left outline-hidden hover:bg-neutral-200/60 focus-visible:bg-neutral-200/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold tracking-tight">
                        PHENIX
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                        Admin
                      </div>
                    </div>
                    <ChevronDown className="size-4 shrink-0 text-neutral-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-64">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Avatar size="lg" className="rounded-lg">
                      <AvatarFallback className="rounded-lg">A</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">
                        <span className="truncate">{addressLabel}</span>
                      </div>
                      <div className="truncate text-sm text-muted-foreground">
                        超级管理员
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <Form method="post" action="/admin/logout">
                      <input type="hidden" name="redirectTo" value="/admin" />
                      <DropdownMenuItem asChild>
                        <button type="submit" className="w-full">
                          <LogOut className="size-4" />
                          退出登录
                        </button>
                      </DropdownMenuItem>
                    </Form>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <NavGroup title="常用">
              <NavItem to="/admin" icon={LayoutDashboard} label="总览" end reloadDocument />
              <NavItem to="/admin/asset" icon={FileCheck2} label="资产库" end />
            </NavGroup>

            <NavGroup title="设置">
              <NavItem to="/admin/settings" icon={Settings2} label="通用" end />
              <NavItem to="/admin/settings/accounts" icon={UserCog} label="账号" end />
            </NavGroup>
          </div>
        </aside>

        <main className="ml-64 min-h-screen min-w-0 overflow-x-auto bg-neutral-100">
          <Outlet />
        </main>
      </div>
    </>
  );
}
