import { useEffect, useState } from "react";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  Ban,
  Ellipsis,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserPlus,
  WalletCards,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdminPage } from "@/lib/server/admin-auth";
import {
  addAdminWallet,
  disableAdminWallet,
  enableAdminWallet,
  listAdminWallets,
  type AdminWalletListItem,
} from "@/lib/server/admin-wallets.repository";
import { AssetHeader } from "./asset/shared";

type SettingsAccountsLoaderData = {
  admin: {
    address: `0x${string}`;
  };
  wallets: AdminWalletListItem[];
};

type SettingsAccountsActionData = {
  ok: boolean;
  intent: "add-admin-wallet" | "disable-admin-wallet" | "enable-admin-wallet" | "unknown";
  message: string;
};

export async function loader({ context, request }: LoaderFunctionArgs) {
  const admin = await requireSuperAdminPage(context, request);
  const wallets = await listAdminWallets(context);

  return {
    admin: {
      address: admin.address,
    },
    wallets,
  } satisfies SettingsAccountsLoaderData;
}

export async function action({ context, request }: ActionFunctionArgs) {
  const admin = await requireSuperAdminPage(context, request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");

  try {
    if (intent === "add-admin-wallet") {
      const address = await addAdminWallet(context, {
        address: formData.get("address"),
        label: formData.get("label"),
        currentAdmin: admin,
      });

      return {
        ok: true,
        intent,
        message: `${shortAddress(address)} 已添加为超级管理员`,
      } satisfies SettingsAccountsActionData;
    }

    if (intent === "disable-admin-wallet") {
      const address = await disableAdminWallet(context, {
        address: formData.get("address"),
        currentAdmin: admin,
      });

      return {
        ok: true,
        intent,
        message: `${shortAddress(address)} 已禁用，现有会话已失效`,
      } satisfies SettingsAccountsActionData;
    }

    if (intent === "enable-admin-wallet") {
      const address = await enableAdminWallet(context, {
        address: formData.get("address"),
      });

      return {
        ok: true,
        intent,
        message: `${shortAddress(address)} 已恢复启用`,
      } satisfies SettingsAccountsActionData;
    }

    return {
      ok: false,
      intent: "unknown",
      message: "未知的账号管理操作",
    } satisfies SettingsAccountsActionData;
  } catch (error) {
    return {
      ok: false,
      intent: isKnownIntent(intent) ? intent : "unknown",
      message: error instanceof Error ? error.message : "账号管理操作失败",
    } satisfies SettingsAccountsActionData;
  }
}

export function meta() {
  return [
    { title: "账号管理 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminSettingsAccounts() {
  const loaderData = useLoaderData<typeof loader>() as SettingsAccountsLoaderData | null;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    if (actionData?.ok && actionData.intent === "add-admin-wallet") {
      setAddModalOpen(false);
    }
  }, [actionData]);

  if (!loaderData) {
    return <SettingsAccountsDataMissing />;
  }

  const { admin, wallets } = loaderData;
  const submitting = navigation.state === "submitting";
  const activeCount = wallets.filter((wallet) => wallet.status === "active").length;

  return (
    <div className="admin-asset-theme min-h-screen bg-neutral-100 text-neutral-950">
      <AssetHeader
        title="账号管理"
        description="维护可登录后台的超级管理员钱包白名单"
      >
        <Button size="sm" type="button" onClick={() => setAddModalOpen(true)}>
          <Plus />
          添加管理员
        </Button>
      </AssetHeader>

      <main className="mx-auto flex max-w-7xl flex-col gap-4 p-6">
        {actionData ? (
          <div
            className={
              actionData.ok
                ? "border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                : "border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            }
          >
            {actionData.message}
          </div>
        ) : null}

        <section className="border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-neutral-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold">
                <WalletCards className="size-5 text-neutral-700" />
                管理员账号
              </div>
              <p className="mt-1 text-sm leading-6 text-neutral-500">
                只有启用状态的钱包可以通过签名登录后台。禁用后会同步撤销该钱包已有会话。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{wallets.length} 个钱包</Badge>
              <Badge variant="outline">启用 {activeCount}</Badge>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>账号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建</TableHead>
                <TableHead>禁用</TableHead>
                <TableHead className="text-right">更多操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <AdminWalletRow
                  key={wallet.address}
                  wallet={wallet}
                  currentAddress={admin.address}
                  activeCount={activeCount}
                  submitting={submitting}
                />
              ))}
            </TableBody>
          </Table>

          {wallets.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              暂无管理员钱包。
            </div>
          ) : null}
        </section>
      </main>

      {addModalOpen ? (
        <AddAdminWalletModal
          submitting={submitting}
          actionData={actionData}
          onClose={() => setAddModalOpen(false)}
        />
      ) : null}
    </div>
  );
}

function SettingsAccountsDataMissing() {
  return (
    <div className="min-h-screen bg-neutral-100 px-6 py-6 text-neutral-950">
      <div className="mx-auto max-w-6xl">
        <section className="border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-900 text-white">
              <WalletCards className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight">账号数据未加载</h1>
              <p className="mt-2 text-sm leading-6">
                当前页面没有拿到账号管理数据。通常是本地开发热更新后 loader 还未刷新，重新加载页面即可。
              </p>
              <Button
                type="button"
                className="mt-4 bg-amber-900 text-white hover:bg-amber-950"
                onClick={() => window.location.reload()}
              >
                重新加载账号管理
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AddAdminWalletModal({
  submitting,
  actionData,
  onClose,
}: {
  submitting: boolean;
  actionData?: SettingsAccountsActionData;
  onClose: () => void;
}) {
  const addError =
    actionData?.intent === "add-admin-wallet" && !actionData.ok ? actionData.message : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/30 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-admin-wallet-title"
        className="flex max-h-[min(640px,calc(100vh-32px))] w-full max-w-lg flex-col border border-neutral-200 bg-white shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 id="add-admin-wallet-title" className="text-lg font-semibold">
              添加管理员
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              添加 EVM 钱包地址后，该钱包可以通过签名登录后台。
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">关闭</span>
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {addError ? (
            <div className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {addError}
            </div>
          ) : null}

          <Form id="add-admin-wallet-form" method="post" className="grid gap-4">
            <input type="hidden" name="intent" value="add-admin-wallet" />
            <label className="grid gap-2">
              <span className="text-sm font-medium">钱包地址</span>
              <Input
                name="address"
                autoComplete="off"
                placeholder="0x..."
                disabled={submitting}
                required
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">备注名称</span>
              <Input
                name="label"
                autoComplete="off"
                placeholder="例如：运营管理员"
                disabled={submitting}
                maxLength={64}
              />
            </label>
            <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              当前仅支持超级管理员。为避免锁死后台，不能禁用当前登录账号，也不能禁用最后一个启用管理员。
            </div>
          </Form>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-5 py-4">
          <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
            取消
          </Button>
          <Button type="submit" form="add-admin-wallet-form" disabled={submitting}>
            <UserPlus className="size-4" />
            添加管理员
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminWalletRow({
  wallet,
  currentAddress,
  activeCount,
  submitting,
}: {
  wallet: AdminWalletListItem;
  currentAddress: `0x${string}`;
  activeCount: number;
  submitting: boolean;
}) {
  const isCurrent = wallet.address.toLowerCase() === currentAddress.toLowerCase();
  const canDisable = wallet.status === "active" && !isCurrent && activeCount > 1;
  const canEnable = wallet.status === "disabled";
  const actionFormId = `admin-wallet-action-${wallet.address}`;

  return (
    <TableRow>
      <TableCell>
        <div className="grid min-w-[280px] gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{wallet.label || "未命名管理员"}</span>
            {isCurrent ? <Badge variant="outline">当前账号</Badge> : null}
          </div>
          <div className="break-all font-mono text-xs text-neutral-500">{wallet.address}</div>
        </div>
      </TableCell>
      <TableCell>
        {wallet.status === "active" ? (
          <Badge className="bg-emerald-600">
            <ShieldCheck className="size-3" />
            启用
          </Badge>
        ) : (
          <Badge variant="secondary">
            <Ban className="size-3" />
            禁用
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="grid gap-1 text-sm">
          <span>{formatUnix(wallet.createdAt)}</span>
          {wallet.createdBy ? (
            <span className="font-mono text-xs text-neutral-500">
              by {shortAddress(wallet.createdBy)}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        {wallet.disabledAt ? (
          <div className="grid gap-1 text-sm">
            <span>{formatUnix(wallet.disabledAt)}</span>
            {wallet.disabledBy ? (
              <span className="font-mono text-xs text-neutral-500">
                by {shortAddress(wallet.disabledBy)}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-neutral-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Form id={actionFormId} method="post" className="hidden">
          <input
            type="hidden"
            name="intent"
            value={wallet.status === "active" ? "disable-admin-wallet" : "enable-admin-wallet"}
          />
          <input type="hidden" name="address" value={wallet.address} />
        </Form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="更多操作">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              更多操作
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {wallet.status === "active" ? (
                <DropdownMenuItem asChild disabled={!canDisable || submitting}>
                  <button type="submit" form={actionFormId} disabled={!canDisable || submitting}>
                    <Ban />
                    禁用账号
                  </button>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild disabled={!canEnable || submitting}>
                  <button type="submit" form={actionFormId} disabled={!canEnable || submitting}>
                    <RotateCcw />
                    恢复启用
                  </button>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            {!canDisable && wallet.status === "active" ? (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs leading-5 text-muted-foreground">
                  {isCurrent ? "不能禁用当前登录账号" : "至少保留 1 个启用管理员"}
                </div>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

function isKnownIntent(
  value: string,
): value is SettingsAccountsActionData["intent"] {
  return (
    value === "add-admin-wallet" ||
    value === "disable-admin-wallet" ||
    value === "enable-admin-wallet"
  );
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatUnix(value: number | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}
