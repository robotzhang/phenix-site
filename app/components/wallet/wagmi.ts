import { createConfig, http } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import type { EIP1193Provider } from 'viem';

const ALCHEMY_KEY = 'tHUSSiHRPRvWVlhjE7SML';
const appName = 'Phenix';

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
    injected({
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
    }),
    injected({
      target: () => {
        const provider = getRabbyProvider();

        return provider
          ? {
              id: "rabby",
              name: "Rabby Wallet",
              provider,
            }
          : undefined;
      },
    }),
    coinbaseWallet({ appName }),
    injected(),
  ],
  transports,
  ssr: true,
});

function getMetaMaskProvider(): InjectedProvider | undefined {
  if (typeof window === "undefined") return undefined;

  const ethereum = (window as { ethereum?: InjectedProvider }).ethereum;
  const providers = ethereum?.providers;

  if (providers?.length) {
    return providers.find((provider) => isMetaMaskProvider(provider));
  }

  return ethereum && isMetaMaskProvider(ethereum) ? ethereum : undefined;
}

function getRabbyProvider(): InjectedProvider | undefined {
  if (typeof window === "undefined") return undefined;

  const ethereum = (window as { ethereum?: InjectedProvider }).ethereum;
  const providers = ethereum?.providers;

  if (providers?.length) {
    return providers.find((provider) => provider.isRabby);
  }

  return ethereum?.isRabby ? ethereum : undefined;
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
