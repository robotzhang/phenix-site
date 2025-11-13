import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { arbitrum, base, mainnet, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Phenix',
  projectId: '3893e093df3f96ab4f13228a34c8e962',
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});

