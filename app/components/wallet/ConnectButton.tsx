import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

export default function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openAccountModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div>
            {connected ? (
              <Button
                variant="outline"
                onClick={openAccountModal}
                className="flex items-center gap-2"
              >
                <img
                  src={`https://api.dicebear.com/7.x/identicon/svg?seed=${account.address}`}
                  className="w-5 h-5 rounded-full border"
                />
                {account.displayName}
              </Button>
            ) : (
              <Button onClick={openConnectModal}>
                Connect
              </Button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
