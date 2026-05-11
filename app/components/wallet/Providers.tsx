import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, type Config } from 'wagmi';

import { config, createClientWalletConfig } from './wagmi';

const queryClient = new QueryClient();

function ClientRainbowKitProvider({ children }: { children: ReactNode }) {
  const [RainbowKitProvider, setRainbowKitProvider] =
    useState<any>(null);

  useEffect(() => {
    let active = true;

    void import("@rainbow-me/rainbowkit").then((module) => {
      if (active) {
        setRainbowKitProvider(() => module.RainbowKitProvider);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!RainbowKitProvider) return <>{children}</>;

  return (
    <RainbowKitProvider locale="en-US" initialChain={config.chains[1]}>
      {children}
    </RainbowKitProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [walletConfig, setWalletConfig] = useState<Config>(config);

  useEffect(() => {
    let active = true;

    void createClientWalletConfig().then((nextConfig) => {
      if (active) {
        setWalletConfig(nextConfig);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <WagmiProvider config={walletConfig}>
      <QueryClientProvider client={queryClient}>
        <ClientRainbowKitProvider>
          {children}
        </ClientRainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
