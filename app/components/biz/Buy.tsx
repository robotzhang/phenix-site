import { useState } from "react";
import { useFNFT } from "@/hooks/useFNFT";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BuyPanel() {
  const [amount, setAmount] = useState(1);
  const { price, buy } = useFNFT();

  const handleBuy = async () => {
    if (amount <= 0) {
      alert("Amount must be > 0");
      return;
    }

    try {
      // ✅ 确保传入 bigint 类型
      const tx = await buy([BigInt(amount)]);
      alert(`✅ Purchase success! TX hash: ${tx}`);
    } catch (err: any) {
      console.error(err);
      alert(`❌ Purchase failed: ${err?.shortMessage || err?.message}`);
    }
  };

  return (
    <div className="p-4 border rounded-md flex flex-col gap-3 bg-card text-card-foreground">
      <div className="text-sm">
        💰 Price per NFT:{" "}
        <span className="font-semibold">{price ? price.toString() : "Loading..."}</span> USDT
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-24"
        />
        <Button onClick={handleBuy}>Buy F-NFT</Button>
      </div>
    </div>
  );
}
