import { useState } from "react";
import {
  Link,
  redirect,
  useLoaderData,
  useNavigate,
  type LoaderFunctionArgs,
} from "react-router";
import { LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAccount, useSignMessage } from "wagmi";

import ConnectButton from "@/components/wallet/ConnectButton";
import { Button } from "@/components/ui/button";
import {
  getSuperAdminSession,
  sanitizeAdminRedirect,
} from "@/lib/server/admin-auth";

type LoginLoaderData = {
  redirectTo: string;
};

type ChallengeResponse = {
  address: string;
  nonce: string;
  message: string;
};

export async function loader({ context, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const redirectTo = sanitizeAdminRedirect(url.searchParams.get("redirectTo"));
  const session = await getSuperAdminSession(context, request);

  if (session) {
    throw redirect(redirectTo);
  }

  return { redirectTo } satisfies LoginLoaderData;
}

export function meta() {
  return [
    { title: "管理员登录 | PHENIX" },
    { name: "robots", content: "noindex,nofollow" },
  ];
}

export default function AdminLogin() {
  const { redirectTo } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = async () => {
    if (!address) {
      setError("请先连接钱包");
      return;
    }

    setPending(true);
    setError("");

    try {
      const challengeResponse = await fetch("/admin/auth/nonce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ address }),
      });

      const challenge = await readJson<ChallengeResponse>(challengeResponse);

      if (!challengeResponse.ok) {
        throw new Error(getApiError(challenge, "生成登录挑战失败"));
      }

      const signature = await signMessageAsync({
        message: challenge.message,
      });

      const verifyResponse = await fetch("/admin/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          address,
          nonce: challenge.nonce,
          message: challenge.message,
          signature,
        }),
      });

      const result = await readJson(verifyResponse);

      if (!verifyResponse.ok) {
        throw new Error(getApiError(result, "管理员登录失败"));
      }

      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "管理员登录失败，请重试",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_38%,#ffffff_100%)] px-4 py-16 text-sky-950">
      <section className="mx-auto grid max-w-5xl overflow-hidden border border-sky-100 bg-white/85 shadow-xl shadow-sky-950/10 backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-[linear-gradient(135deg,#082f49_0%,#0369a1_58%,#38bdf8_100%)] p-8 text-white sm:p-10">
          <div className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-50">
            <ShieldCheck className="h-4 w-4" />
            Admin Access
          </div>
          <h1 className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl">
            使用超级管理员钱包登录
          </h1>
          <p className="mt-5 max-w-md leading-8 text-sky-50/80">
            后台权限由 D1 中登记的超级管理员钱包地址控制。连接钱包后签名登录，
            不会发起链上交易，也不会产生 gas。
          </p>
        </div>

        <div className="p-8 sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-700">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">后台登录</h2>
          <p className="mt-2 text-sm leading-6 text-sky-900/60">
            连接的钱包地址必须存在于 <code>admin_wallets</code> 表中，
            且状态为 active。
          </p>

          <div className="mt-8 grid gap-4">
            <ConnectButton />

            {address ? (
              <div className="border border-sky-100 bg-sky-50/70 p-3 text-sm text-sky-900">
                当前钱包：{shortAddress(address)}
              </div>
            ) : null}

            {error ? (
              <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button
              type="button"
              onClick={handleLogin}
              disabled={!isConnected || !address || pending}
              className="h-11"
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              签名登录后台
            </Button>

            <Button asChild variant="outline">
              <Link to="/">返回首页</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  return response.json().then((value) => value as T).catch(() => ({} as T));
}

function getApiError(value: unknown, fallback: string) {
  return value && typeof value === "object" && "error" in value
    ? String((value as { error?: unknown }).error || fallback)
    : fallback;
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
