import { Link } from "react-router";
import clsx from "clsx";
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
import { Menu, ShieldCheck, X } from "lucide-react";

const navItems = [
  { to: "/", label: "首页" },
  { to: "/asset", label: "资产库" },
  { to: "/membership", label: "会员体系" },
  { to: "/points-mall", label: "社区商城" },
  { to: "/custody", label: "托管与确权" },
  { to: "/liquidity", label: "变现机制" },
  { to: "/faq", label: "FAQ" },
];

export function Header({ scrolled = false }: { scrolled?: boolean }) {
  return (
    <div
      className={clsx(
        "mx-auto flex h-full w-full max-w-[1500px] items-center gap-8 transition-colors 2xl:px-4",
        scrolled ? "text-sky-950" : "text-white sm:text-white",
      )}
    >
      <Link to="/" className="shrink-0">
        <img
          src="/logo-porcelain.svg"
          className={clsx(
            "h-9 transition sm:h-10",
            scrolled ? "" : "brightness-0 invert",
          )}
          alt="PHENIX"
        />
      </Link>

      <ul className="ml-auto hidden items-center gap-x-5 text-sm lg:flex">
        {navItems.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className={clsx(
                "transition-colors",
                scrolled ? "hover:text-sky-700" : "text-white/[0.82] hover:text-white",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="ml-auto hidden lg:ml-0 lg:block">
        <ConnectButton />
      </div>

      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className={clsx(
              "ml-auto border text-sky-950 lg:hidden",
              scrolled ? "border-sky-200 bg-white/[0.88]" : "border-white/[0.35] bg-white/[0.16] text-white hover:bg-white/[0.24] hover:text-white",
            )}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </DrawerTrigger>

        <DrawerContent className="right-0 top-0 h-full w-[min(88vw,360px)] rounded-none border-l border-sky-100 bg-white">
          <DrawerHeader className="border-b border-sky-100 bg-[linear-gradient(180deg,#f8fbfd_0%,#eef7f5_100%)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DrawerTitle className="text-sky-950">PHENIX</DrawerTitle>
                <DrawerDescription className="mt-1 text-sky-900/[0.62]">
                  真实资产服务与流通协同
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="outline" size="icon" className="border-sky-200 bg-white text-sky-950" aria-label="Close navigation">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            <div className="mt-5">
              <ConnectButton />
            </div>
          </DrawerHeader>

          <div className="flex flex-col bg-white p-4">
            {navItems.map((item) => (
              <DrawerClose asChild key={item.to}>
                <Link to={item.to} className="w-full border-b border-sky-100 py-4 text-base font-medium text-sky-950">
                  {item.label}
                </Link>
              </DrawerClose>
            ))}
            <DrawerClose asChild>
              <Link to="/assets" className="w-full border-b border-sky-100 py-4 text-base font-medium text-sky-950">
                我的资产
              </Link>
            </DrawerClose>
            <div className="mt-5 border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                合规提示
              </div>
              <p className="mt-2 text-amber-950/[0.78]">
                PHENIX 不公开募资，不承诺收益。资产服务以真实资料、托管规则和合作机构能力为准。
              </p>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
