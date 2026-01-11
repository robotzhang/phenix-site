"use client";

import { useEffect, useState } from "react";
import {
  useAccount,
  useSwitchChain,
  useWalletClient,
  usePublicClient,
} from "wagmi";
import {
  RainbowKitProvider,
  ConnectButton,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { ethers } from "ethers";
import { QueryClient } from "@tanstack/react-query";
import { mainnet, base } from "wagmi/chains";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* --------------------------- 合约地址配置 --------------------------- */
const BRIDGE_CONTRACT_ADDRESS = "BRIDGE"; // 桥合约地址
const PHENIX_MAINNET = "0x18574BDCd95Ac108cAB8e4E6CB536cEF9738c848"; // 主网 PHENIX
const PHENIX_BASE = "0xf9A7E7D1EA36F2Bbf9e6AD3988177DC001d0f8c0"; // Base L2 PHENIX

/* ----------------------------- ABI ----------------------------- */
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

const BRIDGE_ABI = ["function deposit(uint256 amount) public"];

/* --------------------------- 跨链桥组件 --------------------------- */
function BridgePage() {
  const { address, isConnected, chain } = useAccount();
  const switchChain = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [balanceMain, setBalanceMain] = useState("0");
  const [balanceBase, setBalanceBase] = useState("0");

  /* 查询主网 & Base L2 余额 */
  const fetchBalances = async () => {
    if (!address || !publicClient) return;

    try {
      const provider = new ethers.BrowserProvider(publicClient.transport);

      const tokenMain = new ethers.Contract(PHENIX_MAINNET, ERC20_ABI, provider);
      const mainBal = await tokenMain.balanceOf(address);
      setBalanceMain(ethers.formatUnits(mainBal, 18));

      const tokenBase = new ethers.Contract(PHENIX_BASE, ERC20_ABI, provider);
      const baseBal = await tokenBase.balanceOf(address);
      setBalanceBase(ethers.formatUnits(baseBal, 18));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isConnected) fetchBalances();
  }, [address, publicClient]);

  /* 桥接函数 */
  const handleBridge = async () => {
    if (!walletClient) {
      setStatus("please connect wallet");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setStatus("invalid amount");
      return;
    }

    // 如果不是主网，切换
    if (chain?.id !== mainnet.id) {
      setStatus("please switch to Ethereum mainnet");
      try {
        await switchChain?.switchChainAsync({ chainId: mainnet.id });
      } catch (err: any) {
        console.error(err);
        setStatus("switch network error: " + err?.message || err);
        return;
      }
      return;
    }

    try {
      setStatus("in preparation...");
      const parsed = ethers.parseUnits(amount, 18);

      const signer = await new ethers.BrowserProvider(walletClient.transport, {
        chainId: walletClient.chain.id,
      }).getSigner();

      // 1. Approve
      setStatus("approving...");
      const tokenContract = new ethers.Contract(PHENIX_MAINNET, ERC20_ABI, signer);
      const approveTx = await tokenContract.approve(BRIDGE_CONTRACT_ADDRESS, parsed);
      await approveTx.wait();

      // 2. Deposit
      setStatus("send bridge tx...");
      const bridge = new ethers.Contract(BRIDGE_CONTRACT_ADDRESS, BRIDGE_ABI, signer);
      const depositTx = await bridge.deposit(parsed);
      await depositTx.wait();

      setStatus("completed！");
      fetchBalances();
    } catch (err: any) {
      console.error(err);
      setStatus("fail: " + err.message);
    }
  };

  return (
    <Card className="max-w-xl sm:mx-auto p-6 border rounded-xl my-8">
      <div className="flex items-center justify-between border-b -mx-6 px-6 pb-4">
        <div>
          <h2 className="text-2xl font-semibold">Bridge</h2>
        </div>
        <div>
          <ConnectButton showBalance={false} accountStatus="avatar" />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-1">
        <div className="w-full sm:w-1/2 bg-neutral-100 rounded-xl py-3 px-4">
          <div className="text-sm text-muted-foreground">
            <span className="mr-1">从</span>
            {`${PHENIX_MAINNET.slice(0, 4)}...${PHENIX_MAINNET.slice(-4)}`}
          </div>
          <div className="text-xl font-semibold">Ethereum</div>
          <div className="text-sm text-muted-foreground wrap-break-word">
            wallet balance:
            <span className="text-black ml-1">{balanceMain}</span>
          </div>
        </div>
        <div className="w-full sm:w-1/2 bg-neutral-100 rounded-xl py-3 px-4">
          <div className="text-sm text-muted-foreground">
            <span className="mr-1">到</span>
            {`${PHENIX_BASE.slice(0, 4)}...${PHENIX_BASE.slice(-4)}`}
          </div>
          <div className="text-xl font-semibold">Base</div>
          <div className="text-sm text-muted-foreground wrap-break-word">
            wallet balance:
            <span className="text-black ml-1">{balanceBase}</span>
          </div>
        </div>
      </div>

      <Input
        type="number"
        placeholder="bridge phenix amount"
        className="w-full text-xl! outline-0! py-6!"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <Button
        onClick={handleBridge}
        size="lg"
        className="w-full text-base py-6!"
      >
        Bridge To Base Now
      </Button>

      {status && (
        <div className="mt-2 text-sm bg-red-50 text-red-600 p-3 rounded-xl">{status}</div>
      )}
    </Card>
  );
}

/* --------------------------- App 主组件 --------------------------- */
export default function App() {
  return (
    <BridgePage />
  );
}
