import { ArrowUp, LoaderCircle, Wallet } from 'lucide-react';
import { useMeme } from "@/hooks/useMeme";
import { Button } from "@/components/ui/button";
import { useUsdt } from '@/hooks/useUsdt';
import { toast } from 'sonner';
import { parseUnits } from 'viem';
import { MEME_DECIMALS } from '@/lib/constants';

export default function Buy() {
  const meme = useMeme();
  const usdt = useUsdt();
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
              inputMode="numeric"
              className="w-full font-semibold text-3xl outline-0"
              placeholder="0"
              value={meme.amount || ""}
              onChange={(e) => {
                const raw = e.target.value.trim();

                // 允许清空
                if (raw === "") {
                  meme.setAmount("");
                  return;
                }

                // 只允许正整数（不允许 0、不允许小数、不允许负数）
                if (!/^[1-9]\d*$/.test(raw)) return;

                // 不使用 Number，全程 bigint
                const amountWei = BigInt(raw) * 10n ** BigInt(MEME_DECIMALS);

                if (amountWei > meme.remaining) {
                  toast.error(`Exceeds max buyable memes: ${meme.remainingFormatted}`);
                  return;
                }

                meme.setAmount(raw);
              }}
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
          {meme.isLoading.minted ? <LoaderCircle className="w-4 h-4 animate-spin" /> : (
            <div>
              <span className='text-xs'>Mined:</span>
              <span>{meme.minedFormatted}</span>
              <span className='mx-2'>/</span>
              <span className='text-xs'>Left: </span>
              <span>{meme.remainingFormatted}</span>
            </div>
          )}
        </div>
      </div>

      <div className="top-1/2 bg-neutral-100 rounded-xl p-2 border-4 border-white absolute left-1/2 -mt-15 -ml-7">
        <ArrowUp className="h-7 w-7" />
      </div>

      <div className="bg-neutral-100 rounded-xl p-4 mt-1">
        <div className="text-muted-foreground mb-2">
          Send
        </div>
        <div className="flex items-center">
          <div className="text-3xl font-semibold flex-1">
            {meme.isLoading.price ? (
              <div className="h-9 flex items-center"><LoaderCircle className="w-5 h-5 animate-spin" /></div>
            ) : meme.cost}
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
          {usdt.balance}
        </div>
      </div>

      <Button className="w-full text-xl h-14 rounded-xl mt-4" size="lg" onClick={meme.buy}>
        Mint Now
      </Button>
    </>
  );
}
