"use client";

import React, { useEffect, useState } from "react";
import { fetchDEXTrending, fetchDeFiProtocols } from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { Radar, Flame, Landmark } from "lucide-react";
import TooltipHelper from "@/components/ui/TooltipHelper";

const DEFAULT_PAIRS = [
  {
    chainId: "solana",
    dexId: "raydium",
    baseToken: { symbol: "SOL" },
    quoteToken: { symbol: "USDC" },
    priceUsd: 154.20,
    priceChange24h: 5.12,
    volume24h: 182000000,
    liquidityUsd: 45000000
  },
  {
    chainId: "solana",
    dexId: "raydium",
    baseToken: { symbol: "WIF" },
    quoteToken: { symbol: "SOL" },
    priceUsd: 1.85,
    priceChange24h: 8.40,
    volume24h: 42000000,
    liquidityUsd: 18000000
  },
  {
    chainId: "base",
    dexId: "aerodrome",
    baseToken: { symbol: "BRETT" },
    quoteToken: { symbol: "WETH" },
    priceUsd: 0.082,
    priceChange24h: -2.15,
    volume24h: 12500000,
    liquidityUsd: 8200000
  },
  {
    chainId: "ethereum",
    dexId: "uniswap",
    baseToken: { symbol: "PEPE" },
    quoteToken: { symbol: "WETH" },
    priceUsd: 0.0000092,
    priceChange24h: 3.80,
    volume24h: 89000000,
    liquidityUsd: 31000000
  }
];

const DEFAULT_PROTOCOLS = [
  { name: "Lido", category: "Liquid Staking", chains: ["Ethereum"], tvl: 26500000000, change_1d: 1.2 },
  { name: "AAVE V3", category: "Lending", chains: ["Multi-Chain"], tvl: 12400000000, change_1d: 2.1 },
  { name: "EigenLayer", category: "Restaking", chains: ["Ethereum"], tvl: 11800000000, change_1d: -0.4 },
  { name: "Uniswap", category: "DEX", chains: ["Multi-Chain"], tvl: 5400000000, change_1d: 1.8 }
];

export default function WhaleRadarWidget() {
  const { setActiveSymbol } = useTradingStore();
  const [pairs, setPairs] = useState<any[]>(DEFAULT_PAIRS);
  const [protocols, setProtocols] = useState<any[]>(DEFAULT_PROTOCOLS);
  const [tab, setTab] = useState<"dex" | "defi">("dex");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [dexData, defiData] = await Promise.all([
          fetchDEXTrending("SOL").catch(() => null),
          fetchDeFiProtocols().catch(() => null),
        ]);
        if (isMounted) {
          if (dexData?.pairs && dexData.pairs.length > 0) {
            setPairs(dexData.pairs);
          }
          if (defiData?.protocols && defiData.protocols.length > 0) {
            setProtocols(defiData.protocols);
          }
        }
      } catch (err) {
        console.error("Error loading whale data:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-xl border border-surface-border overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-[#0f141e]/95">
        <div className="flex items-center space-x-2">
          <Radar className="w-4 h-4 text-accent-yellow" />
          <span className="font-semibold text-slate-200">On-Chain & Whale Radar</span>
          <TooltipHelper
            title="On-Chain DEX & Whale Tracking"
            explanation="Monitors real-time decentralized exchange (DEX) liquidity pool inflows and protocol Total Value Locked (TVL)."
            howToUse="Look for high-volume spikes with deep liquidity ($1M+) to find momentum rotations before they reach centralized exchanges."
          />
        </div>
        <span className="text-[10px] text-slate-500">DEXScreener + DefiLlama</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border bg-[#0a0d13]">
        <button
          onClick={() => setTab("dex")}
          className={`flex-1 py-1.5 text-center text-xs font-semibold transition ${
            tab === "dex" ? "text-accent-yellow border-b-2 border-accent-yellow bg-surface/30" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Flame className="w-3 h-3 inline mr-1" />
          DEX Trending Pairs
        </button>
        <button
          onClick={() => setTab("defi")}
          className={`flex-1 py-1.5 text-center text-xs font-semibold transition ${
            tab === "defi" ? "text-accent-cyan border-b-2 border-accent-cyan bg-surface/30" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Landmark className="w-3 h-3 inline mr-1" />
          DeFi TVL Rankings
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {tab === "dex" ? (
          pairs.map((p, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-[#111722] hover:bg-[#161e2c] border border-surface-border transition"
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white text-xs">
                    {p.baseToken?.symbol || "TOKEN"}/{p.quoteToken?.symbol || "USD"}
                  </span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                    {p.chainId || "DEX"}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Vol: ${(p.volume24h / 1000).toFixed(0)}k • Liq: ${(p.liquidityUsd / 1000).toFixed(0)}k
                </span>
              </div>

              <div className="text-right">
                <span className="text-white font-bold block text-xs">
                  ${p.priceUsd < 0.01 ? p.priceUsd?.toExponential(2) : p.priceUsd?.toFixed(3)}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    p.priceChange24h >= 0 ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {p.priceChange24h > 0 ? `+${p.priceChange24h.toFixed(1)}%` : `${p.priceChange24h?.toFixed(1)}%`}
                </span>
              </div>
            </div>
          ))
        ) : (
          protocols.map((proto, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-[#111722] hover:bg-[#161e2c] border border-surface-border transition"
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white text-xs">{proto.name}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-accent-cyan/10 text-accent-cyan">
                    {proto.category}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Chains: {proto.chains?.join(", ")}
                </span>
              </div>

              <div className="text-right">
                <span className="text-accent-cyan font-bold block text-xs">
                  ${(proto.tvl / 1000000000).toFixed(2)}B TVL
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    proto.change_1d >= 0 ? "text-accent-green" : "text-accent-red"
                  }`}
                >
                  {proto.change_1d > 0 ? `+${proto.change_1d.toFixed(1)}%` : `${proto.change_1d?.toFixed(1)}%`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
