import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { LoaderCircle, LogOut, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WalletConnectButtonProps = {
  connectLabel?: string;
  connectedTo?: string | null;
};

export default function WalletConnectButton({
  connectLabel = "Connect",
  connectedTo = "/assets",
}: WalletConnectButtonProps) {
  const { address, connector, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || isConnecting || isReconnecting) {
    return <WalletConnectButtonFallback />;
  }

  if (isConnected && address) {
    const content = (
      <>
        <Wallet className="w-4 h-4" />
        <span className="max-w-20">{formatAddress(address)}</span>
      </>
    );

    if (connectedTo) {
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

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 transition-all duration-200"
          >
            {content}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="text-xs text-muted-foreground">{connector?.name ?? "Wallet"}</div>
            <div className="mt-1 break-all text-sm font-medium text-foreground">{address}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => disconnect()}
            className="cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            断开连接
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          className="transition-all duration-200"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Connecting
            </>
          ) : (
            connectLabel
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>选择钱包</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {connectors.map((walletConnector) => (
          <DropdownMenuItem
            key={walletConnector.uid}
            disabled={isPending}
            onClick={() => connect({ connector: walletConnector })}
            className="cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>{getConnectorName(walletConnector)}</span>
            {isPending && variables?.connector === walletConnector && (
              <LoaderCircle className="ml-auto w-4 h-4 animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WalletConnectButtonFallback() {
  return (
    <div className="w-36 h-9 rounded-md bg-white border dark:bg-gray-700 flex items-center justify-center animate-pulse">
      <LoaderCircle className="w-4 h-4 text-gray-500 animate-spin" />
    </div>
  );
}

function formatAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getConnectorName(connector: { id: string; name: string }) {
  const nameById: Record<string, string> = {
    metaMask: "MetaMask",
    rabby: "Rabby Wallet",
    coinbaseWalletSDK: "Coinbase Wallet",
    injected: "Browser Wallet",
  };

  return nameById[connector.id] ?? connector.name;
}
