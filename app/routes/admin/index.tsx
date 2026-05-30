import {
  ArrowRight,
  Database,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import {
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";

import { Button } from "@/components/ui/button";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";

type AdminDashboardData = {
  admin: {
    address: `0x${string}`;
    role: "super_admin";
    expiresAt: number;
  };
};

export async function loader({ context, request }: LoaderFunctionArgs) {
  const admin = await requireSuperAdminPage(context, request);

  return {
    admin: {
      address: admin.address,
      role: admin.role,
      expiresAt: admin.expiresAt,
    },
  } satisfies AdminDashboardData;
}

export function meta() {
  return [
    { title: "管理总览 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatExpiresAt(expiresAt: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(expiresAt * 1000));
}

export default function AdminDashboard() {
  const { admin } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-neutral-100 px-6 py-6 text-neutral-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="admin-dashboard-hero p-6 text-white sm:p-8">
              <div className="inline-flex items-center gap-2 border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                <ShieldCheck className="h-4 w-4" />
                Admin Console
              </div>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
                总览
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                这里是管理员入口。你可以先进入资产库管理，或者用下方的资源状态卡片确认 D1 和会话状态。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="bg-white text-slate-950 hover:bg-white/90">
                  <Link to="/admin/asset">
                    <FileCheck2 className="h-4 w-4" />
                    进入资产库
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link to="/admin/db-health" target="_blank" rel="noreferrer">
                    <Database className="h-4 w-4" />
                    查看 DB Health
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-px bg-neutral-200 sm:grid-cols-2 lg:grid-cols-1">
              <Card title="超级管理员" value={shortAddress(admin.address)} note="来自 D1 admin_wallets" />
              <Card title="会话有效期" value={formatExpiresAt(admin.expiresAt)} note="phenix_admin_session" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="管理入口"
            description="资产库、D1 健康检查和后续管理页面都会挂在这个 shell 下。"
          />
          <InfoCard
            title="权限模型"
            description="当前登录仅验证超级管理员地址，不会自动授予链上 owner 权限。"
          />
          <InfoCard
            title="默认路径"
            description="打开 /admin 会进入这个总览页，而不是 404。"
          />
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  note,
}: {
  title: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-white p-5">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="mt-2 text-lg font-semibold text-neutral-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-neutral-500">{note}</div>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="text-base font-semibold text-neutral-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-neutral-900">
        <ArrowRight className="h-4 w-4" />
        继续操作
      </div>
    </div>
  );
}
