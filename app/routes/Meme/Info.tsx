import { Progress } from "@/components/ui/progress";
import { useMeme } from "@/hooks/useMeme";

export default function MemeInformation() {
  const meme = useMeme();
  //
  return (
    <div>
      <div>
        <h3 className="text-muted-foreground mb-2 text-sm flex items-center justify-between">
          <div>Minting Progress</div>
          <div>{meme?.mined || 0}/{meme?.cap || ''}</div>
        </h3>
        <div>
          <Progress value={10} className="w-full h-2.5" />
        </div>
      </div>
      <div className="grid grid-cols-12 gap-4 mt-6">
        <div className="col-span-6">
          <h3 className="text-muted-foreground text-sm mb-2">Current Price</h3>
          <div className="text-3xl font-semibold">${Number(meme.price || 0).toFixed(4)}</div>
        </div>
        <div className="col-span-6">
          <h3 className="text-muted-foreground text-sm mb-2">Next Price</h3>
          <div className="text-3xl font-semibold">${Number(meme.nextPrice || 0).toFixed(4)}</div>
        </div>
      </div>
    </div>
  );
}
