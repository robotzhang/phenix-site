import { Link } from "react-router";
import ConnectButton from "@/components/wallet/ConnectButton";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { TextAlignJustify } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center h-full gap-8">
      <Link to="/">
        <img src="/logo.png" className="h-5 sm:h-6 -mt-1" alt="phenix" />
      </Link>

      <ul className="sm:flex hidden items-center gap-x-6 ml-auto">
        {/* <li>
          <Link to="/" className="hover:text-black">HOME</Link>
        </li> */}
        <li>
          <Link to="/rwa" className="hover:text-black">RWA</Link>
        </li>
        <li>
          <Link to="/nft" className="hover:text-black">FNFT</Link>
        </li>
        {/* <li>
          <Link to="/meme" className="hover:text-black">MEME</Link>
        </li> */}
      </ul>

      <div className="ml-auto sm:ml-0 hidden sm:block">
        <ConnectButton />
      </div>

      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline" className="ml-auto sm:hidden">
            <TextAlignJustify className="w-4 h-4" />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="right-0 top-0 h-full w-[320px] rounded-none">
          <DrawerHeader className="border-b">
            <DrawerTitle>Phoenix</DrawerTitle>
            <DrawerDescription>
              <ConnectButton />
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col p-4 space-y-3">
            <DrawerClose asChild>
              <Link to="/assets" className="w-full justify-start">
                Assets
              </Link>
            </DrawerClose>
            <DrawerClose asChild>
              <Link to="/rwa" className="w-full justify-start">
                Rwa
              </Link>
            </DrawerClose>
            <DrawerClose asChild>
              <Link to="/nft" className="w-full justify-start">
                FNFT
              </Link>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}