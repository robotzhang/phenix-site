import { useState } from 'react';
import { useFNFT } from '@/hooks/useFNFT';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function BuyPanel() {
  const [amount, setAmount] = useState(1);
  const { price, buy } = useFNFT();

  const handleBuy = async () => {
    if (amount <= 0) return alert('Amount must be > 0');
    await buy({ args: [amount] });
    alert('Purchase success');
  };

  return (
    <div className="p-4 border rounded-md flex flex-col gap-2">
      <div>Price per NFT: {price?.toString()} USDT</div>
      <Input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))}/>
      <Button onClick={handleBuy}>Buy F-NFT</Button>
    </div>
  );
}
