import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, base, baseSepolia } from 'wagmi/chains';

const ALCHEMY_KEY = 'tHUSSiHRPRvWVlhjE7SML';

export const config = getDefaultConfig({
  appName: 'Phenix',
  projectId: '3893e093df3f96ab4f13228a34c8e962',
  chains: [mainnet, base, baseSepolia],

  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      batch: true,
    }),
    [base.id]: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      batch: true,
    }),
    [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`, {
      batch: true,
    }),
  },

  ssr: true,
});
