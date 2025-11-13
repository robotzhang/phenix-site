import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: avatar } = useEnsAvatar({ name: address });
  const { data: ensName } = useEnsName({ address });

  return { address, ensName, avatar, isConnected, disconnect };
}
