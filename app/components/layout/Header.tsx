import { Link } from "react-router";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <div className="flex items-center h-full gap-8">
      <div>
        <img src="/logo.png" className="h-6 -mt-1" alt="phenix" />
      </div>

      <ul className="flex items-center gap-x-6">
        <li>
          <Link to="/" className="hover:text-black">Home</Link>
        </li>
        <li>
          <Link to="/buy" className="hover:text-black">Buy</Link>
        </li>
      </ul>

      <div className="ml-auto">
        <ConnectButton />
      </div>
    </div>
  );
}