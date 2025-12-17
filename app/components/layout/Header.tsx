import { Link } from "react-router";
import ConnectButton from "@/components/wallet/ConnectButton";

export function Header() {
  return (
    <div className="flex items-center h-full gap-8">
      <Link to="/">
        <img src="/logo.png" className="h-5 sm:h-6 -mt-1" alt="phenix" />
      </Link>

      <ul className="flex items-center gap-x-6">
        <li>
          <Link to="/" className="hover:text-black">Home</Link>
        </li>
        <li>
          <Link to="/f-nft" className="hover:text-black">RWA</Link>
        </li>
        <li>
          <Link to="/f-nft" className="hover:text-black">FNFT</Link>
        </li>
        <li>
          <Link to="/f-nft" className="hover:text-black">MEME</Link>
        </li>
      </ul>

      <div className="ml-auto">
        <ConnectButton />
      </div>
    </div>
  );
}