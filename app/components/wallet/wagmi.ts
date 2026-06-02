import { createConfig, http, type Config, createConnector } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import type { EIP1193Provider } from 'viem';
import type { Wallet, WalletDetailsParams } from '@rainbow-me/rainbowkit';

const ALCHEMY_KEY = 'tHUSSiHRPRvWVlhjE7SML';
const WALLET_CONNECT_PROJECT_ID = '3893e093df3f96ab4f13228a34c8e962';
const appName = 'Phenix';

type MetaMaskWalletFactory = typeof import("@rainbow-me/rainbowkit/wallets").metaMaskWallet;
type InjectedProvider = EIP1193Provider & {
  isMetaMask?: true;
  isRabby?: true;
  isBraveWallet?: true;
  isCoinbaseWallet?: true;
  isOkxWallet?: true;
  isOKExWallet?: true;
  isTrust?: true;
  isTrustWallet?: true;
  providers?: InjectedProvider[];
};

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
  const strictMetaMaskWallet = createStrictMetaMaskWallet(metaMaskWallet);

  return getDefaultConfig({
    appName,
    projectId: WALLET_CONNECT_PROJECT_ID,
    chains,
    transports,
    wallets: [
      {
        groupName: "推荐钱包",
        wallets: [
          strictMetaMaskWallet,
          rabbyWallet,
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

function createStrictMetaMaskWallet(baseMetaMaskWallet: MetaMaskWalletFactory): MetaMaskWalletFactory {
  return (options) => {
    const wallet = baseMetaMaskWallet(options);
    const installed = typeof window !== "undefined" && Boolean(getMetaMaskProvider());

    return {
      ...wallet,
      installed: installed || undefined,
      mobile: installed ? wallet.mobile : undefined,
      qrCode: undefined,
      createConnector: createStrictMetaMaskConnector,
    };
  };
}

function createStrictMetaMaskConnector(walletDetails: WalletDetailsParams) {
  return createConnector((config) => ({
    ...injected({
      target: () => {
        const provider = getMetaMaskProvider();

        return provider
          ? {
              id: "metaMask",
              name: "MetaMask",
              provider,
            }
          : undefined;
      },
    })(config),
    ...walletDetails,
  }));
}

function getMetaMaskProvider(): InjectedProvider | undefined {
  if (typeof window === "undefined") return undefined;

  const ethereum = (window as { ethereum?: InjectedProvider }).ethereum;
  const providers = ethereum?.providers;

  if (providers?.length) {
    return providers.find((provider) => isMetaMaskProvider(provider));
  }

  return ethereum && isMetaMaskProvider(ethereum) ? ethereum : undefined;
}

function isMetaMaskProvider(provider: InjectedProvider) {
  return Boolean(
    provider.isMetaMask &&
      !provider.isRabby &&
      !provider.isBraveWallet &&
      !provider.isCoinbaseWallet &&
      !provider.isOkxWallet &&
      !provider.isOKExWallet &&
      !provider.isTrust &&
      !provider.isTrustWallet,
  );
}
