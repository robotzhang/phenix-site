import { Progress } from "@/components/ui/progress";
import MemeFaq from "./Meme/Faq";
import BuyMeme from "./Meme/Buy";

export default function Meme() {
  return (
    <div>
      <div className="py-10 sm:py-10 max-w-5xl m-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7">
            <h2 className="text-3xl font-semibold mb-2 sm:mb-6">Mint Phenix Meme</h2>
            <div className="bg-white p-4 rounded-2xl relative">
              <BuyMeme />
            </div>
          </div>

          <div className="col-span-5">
            <h2 className="text-3xl font-semibold mb-2 sm:mb-6">Mint Information</h2>
            <div>
              <div>
                <h3 className="text-muted-foreground mb-2 text-sm flex items-center justify-between">
                  <div>Minting Progress</div>
                  <div>1828.98/25000</div>
                </h3>
                <div>
                  <Progress value={10} className="w-full h-2.5" />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 mt-6">
                <div className="col-span-6">
                  <h3 className="text-muted-foreground text-sm mb-2">Current Price</h3>
                  <div className="text-3xl font-semibold">$0.0001</div>
                </div>
                <div className="col-span-6">
                  <h3 className="text-muted-foreground text-sm mb-2">Next Price</h3>
                  <div className="text-3xl font-semibold">$0.00033</div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="mb-2 text-muted-foreground">Exchange phenix meme?</div>
              <ul className="flex items-center">
                <li>
                  <a href="https://app.uniswap.org/" target="_blank" rel="noreferrer">
                    <img src="/logos/uniswap.png" className="h-7" alt="uniswap" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-10 sm:py-10 max-w-5xl m-auto border-t">
        <h2 className="text-3xl font-semibold mb-2 sm:mb-6">FQA</h2>
        <MemeFaq />
      </div>
    </div>
  );
}
