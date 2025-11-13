import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { LoaderCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button"; // 你的 LoaderCircle 组件

export default function WalletConnectButton() {
  const { address, isConnected, isReconnecting, isConnecting } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
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
    return (
      <Button
        variant="outline"
        onClick={openAccountModal}
        className="flex items-center gap-2 transition-all duration-200"
      >
        <Wallet className="w-4 h-4" />
        <span className="max-w-20">{`${address.slice(0, 4)}...${address.slice(-4)}`}</span>
      </Button>
    );
  }

  // 未连接钱包显示 Connect
  return (
    <Button
      onClick={openConnectModal}
      className="transition-all duration-200"
    >
      Connect
    </Button>
  );
}
