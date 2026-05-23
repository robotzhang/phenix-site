import { createConfig, http, type Config } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const ALCHEMY_KEY = 'tHUSSiHRPRvWVlhjE7SML';
const WALLET_CONNECT_PROJECT_ID = '3893e093df3f96ab4f13228a34c8e962';
const appName = 'Phenix';

export const chains = [mainnet, base, baseSepolia] as const;
export const transports = {
  [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
    batch: true,
  }),
  [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
    batch: true,
  }),
  [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
    batch: true,
  }),
};

export const config = createConfig({
  chains,
  connectors: [
    injected(),
  ],
  transports,
  ssr: true,
});

export async function createClientWalletConfig(): Promise<Config> {
  const { getDefaultConfig } = await import("@rainbow-me/rainbowkit");
  const {
    coinbaseWallet,
    metaMaskWallet,
    rabbyWallet,
    rainbowWallet,
    walletConnectWallet,
  } = await import("@rainbow-me/rainbowkit/wallets");

  return getDefaultConfig({
    appName,
    projectId: WALLET_CONNECT_PROJECT_ID,
    chains,
    transports,
    wallets: [
      {
        groupName: "推荐钱包",
        wallets: [
          rabbyWallet,
          metaMaskWallet,
          walletConnectWallet,
        ],
      },
      {
        groupName: "更多钱包",
        wallets: [
          rainbowWallet,
          coinbaseWallet,
        ],
      },
    ],
    ssr: true,
  });
}
