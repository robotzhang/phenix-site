import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { LoaderCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button"; // 你的 LoaderCircle 组件
import { Link } from "react-router";

type RainbowKitHooks = {
  useConnectModal: () => { openConnectModal?: () => void };
  useAccountModal: () => { openAccountModal?: () => void };
};

type WalletConnectButtonProps = {
  connectLabel?: string;
  connectedTo?: string | null;
};

export default function WalletConnectButton({
  connectLabel = "Connect",
  connectedTo = "/assets",
}: WalletConnectButtonProps) {
  const [rainbowKitHooks, setRainbowKitHooks] = useState<RainbowKitHooks | null>(null);

  useEffect(() => {
    let active = true;

    void import("@rainbow-me/rainbowkit").then((module) => {
      if (active) {
        setRainbowKitHooks({
          useConnectModal: module.useConnectModal,
          useAccountModal: module.useAccountModal,
        });
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!rainbowKitHooks) {
    return <WalletConnectButtonFallback />;
  }

  return (
    <WalletConnectButtonInner
      hooks={rainbowKitHooks}
      connectLabel={connectLabel}
      connectedTo={connectedTo}
    />
  );
}

function WalletConnectButtonFallback() {
  return (
    <div className="w-36 h-9 rounded-md bg-white border dark:bg-gray-700 flex items-center justify-center animate-pulse">
      <LoaderCircle className="w-4 h-4 text-gray-500 animate-spin" />
    </div>
  );
}

function WalletConnectButtonInner({
  hooks,
  connectLabel,
  connectedTo,
}: {
  hooks: RainbowKitHooks;
  connectLabel: string;
  connectedTo: string | null;
}) {
  const { address, isConnected, isReconnecting, isConnecting } = useAccount();
  const { openConnectModal } = hooks.useConnectModal();
  const { openAccountModal } = hooks.useAccountModal();
  const [mounted, setMounted] = useState(false);

  // SSR 安全挂载
  useEffect(() => setMounted(true), []);

  // 页面未挂载或正在恢复钱包连接，显示骨架 + LoaderCircle
  if (!mounted || isConnecting || isReconnecting) {
    return (
      <div className="w-36 h-9 rounded-md bg-white border dark:bg-gray-700 flex items-center justify-center animate-pulse">
        <LoaderCircle className="w-4 h-4 text-gray-500 animate-spin" />
      </div>
    );
  }

  // 已连接钱包显示地址 + Dicebear 头像
  if (isConnected && address) {
    const content = (
      <>
        <Wallet className="w-4 h-4" />
        <span className="max-w-20">{`${address.slice(0, 4)}...${address.slice(-4)}`}</span>
      </>
    );

    if (!connectedTo) {
      return (
        <Button
          type="button"
          variant="outline"
          onClick={openAccountModal}
          className="flex items-center gap-2 transition-all duration-200"
        >
          {content}
        </Button>
      );
    }

    return (
      <Button
        asChild
        variant="outline"
        className="flex items-center gap-2 transition-all duration-200"
      >
        <Link to={connectedTo}>{content}</Link>
      </Button>
    );
  }

  // 未连接钱包显示 Connect
  return (
    <Button
      onClick={openConnectModal}
      className="transition-all duration-200"
    >
      {connectLabel}
    </Button>
  );
}
