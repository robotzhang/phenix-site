import { ArrowUp, LoaderCircle, Wallet } from 'lucide-react';
import { useFnftPurchase } from "@/hooks/useFnftPurchase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Buy() {
  const buy = useFnftPurchase();
  //
  const handleBuy = async () => {
    if (buy.amount <= 0) {
      toast.error("Amount must be >= 1");
      return;
    }
    try {
      return await buy.purchase();
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
        <div className="flex items-center">
          <div className="flex-1">
            <input
              type="text"
              className="w-full font-semibold text-3xl outline-0"
              placeholder="0"
              onChange={(e) => {
                const amount = Number(e.target.value) || 0;
                buy.setAmount(amount);
              }}
              value={buy.amount || ''}
            />
          </div>

          <div className="flex flex-col justify-center ">
            <div className="flex items-center gap-2 pr-3 p-1 rounded-full border">
              <img src="/favicon.ico" className="h-8 rounded-full" />
              <div className="">Meme</div>
            </div> 
          </div>
        </div>

        <div className="text-sm text-muted-foreground mt-2 flex gap-2 items-center">
          {buy.isTotalMintedLoading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : `${buy.totalMinted} / ${buy.maxSupply}`}
        </div>
      </div>

      <div className="top-1/2 bg-neutral-100 rounded-xl p-2 border-4 border-white absolute left-1/2 -mt-16 -ml-7">
        <ArrowUp className="h-7 w-7" />
      </div>

      <div className="bg-neutral-100 rounded-xl p-4 mt-1">
        <div className="text-muted-foreground mb-2">
          Send
        </div>
        <div className="flex items-center">
          <div className="text-3xl font-semibold flex-1">
            {buy.isPriceLoading ? (
              <div className="h-9 flex items-center"><LoaderCircle className="w-5 h-5 animate-spin" /></div>
            ) : buy.totalCos}
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 pr-3 p-1 rounded-full border bg-white">
              <img src="/logos/usdt.png" className="h-8 rounded-full" />
              <div className="">USDT</div>
            </div> 
          </div>
        </div>

        <div className="text-sm text-muted-foreground mt-2 flex gap-2 items-center">
          <Wallet className="w-4 h-4" />
          ${buy.usdtBalance}
        </div>
      </div>

      <Button className="w-full text-xl h-14 rounded-xl mt-4" size="lg" onClick={handleBuy}>
        Buy Now
      </Button>
    </>
  );
}
