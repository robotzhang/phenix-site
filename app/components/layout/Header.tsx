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
  { to: "/rwa", label: "资产库" },
  { to: "/membership", label: "会员体系" },
  { to: "/custody", label: "托管与确权" },
  { to: "/liquidity", label: "变现机制" },
];

export function Header() {
  return (
    <div className="flex items-center h-full gap-8 text-sky-950">
      <Link to="/">
        <img src="/logo-porcelain.svg" className="h-9 sm:h-10" alt="PHENIX" />
      </Link>

      <ul className="sm:flex hidden items-center gap-x-6 ml-auto text-sm">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="hover:text-sky-700 transition-colors">
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
          <Button variant="outline" size="icon" className="ml-auto sm:hidden border-sky-200 bg-white/80 text-sky-950" aria-label="Open navigation">
            <Menu className="w-4 h-4" />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="right-0 top-0 h-full w-[320px] rounded-none">
          <DrawerHeader className="border-b border-sky-100 bg-sky-50/80">
            <DrawerTitle>PHENIX</DrawerTitle>
            <DrawerDescription>
              <ConnectButton />
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex flex-col p-4 space-y-3 bg-white">
            {navItems.map((item) => (
              <DrawerClose asChild key={item.to}>
                <Link to={item.to} className="w-full justify-start border-b border-sky-100 py-3 text-sky-950">
                  {item.label}
                </Link>
              </DrawerClose>
            ))}
            <DrawerClose asChild>
              <Link to="/assets" className="w-full justify-start border-b border-sky-100 py-3 text-sky-950">
                我的资产
              </Link>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
