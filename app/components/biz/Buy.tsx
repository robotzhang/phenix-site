import { useState } from "react";
import { ArrowDown } from 'lucide-react';
import { useFNFT } from "@/hooks/useFNFT";
import { Button } from "@/components/ui/button";

export function Buy() {
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
    <div className="p-6 relative shadow border rounded-2xl max-w-lg m-auto flex flex-col gap-1 bg-card text-card-foreground">
      <div className="border rounded-xl p-4">
        <div className="text-muted-foreground mb-2">
          Buy
        </div>
        <div className="relative">
          <input
            className="w-full font-semibold text-3xl outline-0"
            onChange={(e) => setAmount(Number(e.target.value))}
            value={0}
          />

          <div className="flex flex-col justify-center absolute top-0 bottom-0 right-0">
            <div className="flex items-center gap-2 pr-3 p-1 rounded-full border">
              <img src="/favicon.ico" className="h-8 rounded-full" />
              <div className="">NFT</div>
            </div> 
          </div>
        </div>
      </div>

      <div className="top-1/2 bg-neutral-100 rounded-xl p-2 border-4 border-white absolute left-1/2 -mt-14 -ml-7">
        <ArrowDown className="h-7 w-7" />
      </div>

      <div className="bg-neutral-100 rounded-xl p-4">
        <div className="text-muted-foreground mb-2">
          Pay
        </div>
        <div className="relative">
          <div className="text-3xl font-semibold">100</div>

          <div className="flex flex-col justify-center absolute top-0 bottom-0 right-0">
            <div className="flex items-center gap-2 pr-3 p-1 rounded-full border bg-white">
              <img src="/logos/usdt.png" className="h-8 rounded-full" />
              <div className="">USDT</div>
            </div> 
          </div>
        </div>
      </div>

      <Button className="w-full text-xl h-14 rounded-xl mt-4" size="lg" onClick={handleBuy}>
        Buy Now
      </Button>
    </div>
  );
}
