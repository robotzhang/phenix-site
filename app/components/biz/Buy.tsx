import { useState } from "react";
import { ArrowUp } from 'lucide-react';
import { toast } from "sonner";
import { useFnftPurchase } from "@/hooks/useFnftPurchase";
import { Button } from "@/components/ui/button";

export function Buy() {
  const [amount, setAmount] = useState(1);
  const fnftHooks = useFnftPurchase();
  console.log('fnftHooks', fnftHooks);

  const handleBuy = async () => {
    if (amount <= 0) {
      toast.error("Amount must be > 0");
      return;
    }
    try {
      return await fnftHooks.purchase();
    } catch (err: any) {
      toast.error(err?.shortMessage || err?.message);
    }
  };
  //
  return (
    <>
      <div className="border rounded-xl p-4">
        <div className="text-muted-foreground mb-2">
          Get
        </div>
        <div className="relative">
          <input
            className="w-full font-semibold text-3xl outline-0"
            placeholder="0"
            onChange={(e) => setAmount(Number(e.target.value))}
            value={amount || ''}
          />

          <div className="flex flex-col justify-center absolute top-0 bottom-0 right-0">
            <div className="flex items-center gap-2 pr-3 p-1 rounded-full border">
              <img src="/favicon.ico" className="h-8 rounded-full" />
              <div className="">FNFT</div>
            </div> 
          </div>
        </div>
      </div>

      <div className="top-1/2 bg-neutral-100 rounded-xl p-2 border-4 border-white absolute left-1/2 -mt-14 -ml-7">
        <ArrowUp className="h-7 w-7" />
      </div>

      <div className="bg-neutral-100 rounded-xl p-4">
        <div className="text-muted-foreground mb-2">
          Send
        </div>
        <div className="relative">
          <div className="text-3xl font-semibold">
            {/* {amount && price ? Number(price) * amount : '0'} */}
          </div>

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
    </>
  );
}
