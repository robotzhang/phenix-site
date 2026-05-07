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
import { Menu } from "lucide-react";

const navItems = [
  { to: "/", label: "首页" },
  { to: "/rwa", label: "资产池" },
  { to: "/membership", label: "会员体系" },
  { to: "/custody", label: "托管与确权" },
  { to: "/liquidity", label: "变现机制" },
];

export function Header() {
  return (
    <div className="flex items-center h-full gap-8">
      <Link to="/">
        <img src="/logo.png" className="h-5 sm:h-6 -mt-1" alt="phenix" />
      </Link>

      <ul className="sm:flex hidden items-center gap-x-6 ml-auto text-sm">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="hover:text-black">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="ml-auto sm:ml-0 hidden sm:block">
        <ConnectButton />
      </div>

      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline" size="icon" className="ml-auto sm:hidden" aria-label="Open navigation">
            <Menu className="w-4 h-4" />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="right-0 top-0 h-full w-[320px] rounded-none">
          <DrawerHeader className="border-b">
            <DrawerTitle>PHENIX</DrawerTitle>
            <DrawerDescription>
              <ConnectButton />
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col p-4 space-y-3">
            {navItems.map((item) => (
              <DrawerClose asChild key={item.to}>
                <Link to={item.to} className="w-full justify-start border-b border-neutral-100 py-3">
                  {item.label}
                </Link>
              </DrawerClose>
            ))}
            <DrawerClose asChild>
              <Link to="/assets" className="w-full justify-start border-b border-neutral-100 py-3">
                我的资产
              </Link>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
