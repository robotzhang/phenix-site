import MemeFaq from "./Meme/Faq";
import BuyMeme from "./Meme/Buy";
import MemeInformation from "./Meme/Info";

export default function Meme() {
  //
  return (
    <div className="sm:px-6">
      <div className="py-10 sm:py-10 max-w-5xl m-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-7">
            <h2 className="text-3xl font-semibold mb-2 sm:mb-6">Mint Phenix Meme</h2>
            <div className="bg-white p-4 rounded-2xl relative">
              <BuyMeme />
            </div>
          </div>

          <div className="col-span-12 sm:col-span-5">
            <h2 className="text-3xl font-semibold mb-2 sm:mb-6">Mint Information</h2>
            <MemeInformation />

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
