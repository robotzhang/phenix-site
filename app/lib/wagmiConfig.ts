import { createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { InjectedConnector } from "wagmi/connectors/injected";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector(),
    new WalletConnectConnector({
      projectId: "YOUR_WALLETCONNECT_ID",
      chains: [base],
    }),
  ],
  publicClient: base.rpcUrls.default.http[0],
});
