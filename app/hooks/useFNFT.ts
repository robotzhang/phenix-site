import { useContractRead, useContractWrite } from 'wagmi';
import fnftAbi from '@/abi/fnft.json';
import { FNFT_ADDRESS } from '@/lib/constants';

export function useFNFT() {
  const { data: price } = useContractRead({ address: FNFT_ADDRESS, abi: fnftAbi, functionName: 'price' });
  const { data: totalMinted } = useContractRead({ address: FNFT_ADDRESS, abi: fnftAbi, functionName: 'totalMinted' });
  const { writeAsync: buy } = useContractWrite({ address: FNFT_ADDRESS, abi: fnftAbi, functionName: 'buy' });
  const { writeAsync: redeem } = useContractWrite({ address: FNFT_ADDRESS, abi: fnftAbi, functionName: 'redeem' });

  return { price, totalMinted, buy, redeem };
}
