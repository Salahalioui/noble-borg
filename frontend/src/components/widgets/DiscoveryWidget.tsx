"use client";

import React, { useEffect, useState } from "react";
import { fetchDiscoveryCategories } from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  DollarSign, 
  Layers, 
  RefreshCw, 
  Info,
  ArrowRight
} from "lucide-react";
import TooltipHelper from "@/components/ui/TooltipHelper";

export default function DiscoveryWidget() {
  const { setActiveSymbol } = useTradingStore();
  const [data, setData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"micro_gems" | "blue_chips" | "micro_stocks" | "dex_trending">("micro_gems");
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const res = await fetchDiscoveryCategories().catch(() => null);
      if (res) setData(res);
    } catch (e) {
      console.error("Discovery error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAsset = (sym: string, isCrypto: boolean) => {
    setActiveSymbol(sym, isCrypto);
  };

  const getActiveList = () => {
    if (!data) return [];
    return data[activeTab] || [];
  };

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-xl border border-surface-border overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-[#0f141e]/95">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-accent-cyan" />
          <span className="font-semibold text-slate-200">Asset Discovery & Screener</span>
          <TooltipHelper
            title="Small Capital Asset Discovery"
            explanation="Different wallet sizes need different asset classes. For a $10-$50 account, micro gems and affordable stocks yield meaningful percentage swings while strictly capping risk."
            howToUse="Click any coin or stock to load its live chart and generate an AI signal with 2% safe risk sizing."
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-accent-green font-bold">$10-$100 Ready</span>
          <button onClick={loadData} className="text-slate-400 hover:text-white">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 border-b border-surface-border bg-[#0a0d13] text-[10px]">
        <button
          onClick={() => setActiveTab("micro_gems")}
          className={`py-1.5 text-center font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === "micro_gems"
              ? "text-accent-cyan border-b-2 border-accent-cyan bg-surface/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>Micro Gems</span>
        </button>

        <button
          onClick={() => setActiveTab("blue_chips")}
          className={`py-1.5 text-center font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === "blue_chips"
              ? "text-accent-yellow border-b-2 border-accent-yellow bg-surface/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Blue Chips</span>
        </button>

        <button
          onClick={() => setActiveTab("micro_stocks")}
          className={`py-1.5 text-center font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === "micro_stocks"
              ? "text-accent-green border-b-2 border-accent-green bg-surface/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <DollarSign className="w-3 h-3" />
          <span>Stocks &lt;$50</span>
        </button>

        <button
          onClick={() => setActiveTab("dex_trending")}
          className={`py-1.5 text-center font-bold transition flex items-center justify-center space-x-1 ${
            activeTab === "dex_trending"
              ? "text-accent-purple border-b-2 border-accent-purple bg-surface/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>DEX Pairs</span>
        </button>
      </div>

      {/* Small Wallet Explainer Banner */}
      {activeTab === "micro_gems" && (
        <div className="p-2 bg-accent-cyan/5 border-b border-accent-cyan/20 text-[10px] text-slate-300 flex items-center justify-between">
          <span>⚡ High-beta coins with low unit price for rapid percentage growth on small wallets.</span>
        </div>
      )}
      {activeTab === "micro_stocks" && (
        <div className="p-2 bg-accent-green/5 border-b border-accent-green/20 text-[10px] text-slate-300 flex items-center justify-between">
          <span>📈 High-momentum US growth stocks priced under $50 per share.</span>
        </div>
      )}

      {/* Asset Cards List */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {getActiveList().map((item: any, idx: number) => {
          const isCrypto = item.is_crypto !== false;
          const cleanSym = item.symbol.replace("USDT", "");
          const isPositive = (item.change_24h ?? 0) >= 0;

          return (
            <div
              key={idx}
              onClick={() => handleSelectAsset(item.symbol, isCrypto)}
              className="p-2.5 rounded-lg bg-[#111722] hover:bg-[#161f2e] border border-surface-border hover:border-accent-cyan/50 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#080b10] border border-surface-border flex items-center justify-center font-black text-xs text-white group-hover:border-accent-cyan/40">
                  {cleanSym.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white group-hover:text-accent-cyan transition text-xs">
                      {item.symbol}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                      {item.category || item.chain}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{item.name}</span>
                </div>
              </div>

              <div className="text-right flex items-center space-x-3">
                <div>
                  <span className="font-black text-white text-xs block">
                    ${item.current_price < 0.01 ? item.current_price.toFixed(6) : item.current_price.toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] font-bold flex items-center justify-end space-x-0.5 ${
                      isPositive ? "text-accent-green" : "text-accent-red"
                    }`}
                  >
                    {isPositive ? <TrendingUp className="w-2.5 h-2.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 inline" />}
                    <span>{isPositive ? `+${item.change_24h}%` : `${item.change_24h}%`}</span>
                  </span>
                </div>

                <div className="hidden sm:flex p-1 rounded bg-[#080b10] text-slate-500 group-hover:text-accent-cyan transition">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
