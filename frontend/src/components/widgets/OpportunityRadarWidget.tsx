"use client";

import React, { useEffect, useState } from "react";
import { fetchMarketOpportunities } from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { Radar, Sparkles, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";

export default function OpportunityRadarWidget() {
  const { setActiveSymbol } = useTradingStore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const res = await fetchMarketOpportunities().catch(() => null);
      if (res) setData(res);
    } catch (e) {
      console.error("Opportunity radar error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s scan refresh
    return () => clearInterval(interval);
  }, []);

  const handleSelectAsset = (sym: string, isCrypto: boolean) => {
    setActiveSymbol(sym, isCrypto);
  };

  const topPick = data?.top_pick;

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-xl border border-surface-border p-3 font-mono text-xs justify-between space-y-2.5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-border">
        <div className="flex items-center space-x-1.5">
          <Radar className="w-4 h-4 text-accent-cyan" />
          <span className="font-bold text-white text-xs">Opportunity Radar</span>
        </div>
        <button
          onClick={loadData}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* #1 Top Pick Highlight Box */}
      {topPick ? (
        <div className="p-3 bg-gradient-to-r from-accent-purple/15 to-accent-cyan/15 rounded-xl border border-accent-cyan/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] px-2 py-0.5 rounded font-black bg-accent-cyan text-black tracking-wide flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>TOP SETUP OF THE HOUR</span>
            </span>
            <span className="text-accent-green font-extrabold text-xs">
              Score: {topPick.opportunity_score}/100
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-white text-sm">{topPick.symbol}</span>
                <span className="text-[10px] text-slate-400">({topPick.name})</span>
              </div>
              <span className="text-[10px] text-slate-300 block">{topPick.key_catalyst}</span>
            </div>

            <button
              onClick={() => handleSelectAsset(topPick.symbol, topPick.is_crypto)}
              className="px-2.5 py-1.5 bg-accent-cyan hover:bg-accent-cyan/90 text-black font-black rounded-lg text-[10px] transition flex items-center space-x-1 shadow-sm"
            >
              <span>Load Setup</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Scanned Assets List */}
      <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[220px]">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
          Multi-Asset Radar ({data?.scanned_assets?.length ?? 0} scanned)
        </span>

        <div className="space-y-1">
          {data?.scanned_assets?.map((asset: any) => (
            <div
              key={asset.symbol}
              onClick={() => handleSelectAsset(asset.symbol, asset.is_crypto)}
              className="p-2 rounded-lg bg-[#111722] hover:bg-[#161e2c] border border-surface-border flex items-center justify-between cursor-pointer transition"
            >
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white">{asset.symbol}</span>
                  <span className="text-[10px] text-slate-500">${asset.current_price?.toFixed(2)}</span>
                </div>
                <span className="text-[9px] text-slate-400 block">{asset.key_catalyst}</span>
              </div>

              <div className="text-right">
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold block ${
                    asset.badge_color === "green"
                      ? "bg-accent-green/20 text-accent-green"
                      : asset.badge_color === "cyan"
                      ? "bg-accent-cyan/20 text-accent-cyan"
                      : asset.badge_color === "purple"
                      ? "bg-accent-purple/20 text-accent-purple"
                      : asset.badge_color === "yellow"
                      ? "bg-accent-yellow/20 text-accent-yellow"
                      : asset.badge_color === "red"
                      ? "bg-accent-red/20 text-accent-red"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {asset.badge}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Breadth Summary */}
      {data?.market_breadth && (
        <div className="p-2 bg-[#0a0d13] rounded-lg border border-surface-border text-[10px] flex items-center justify-between text-slate-400">
          <span>
            Breadth: <strong className="text-accent-green">{data.market_breadth.bullish} 🟢</strong>{" "}
            <strong className="text-accent-red">{data.market_breadth.bearish} 🔴</strong>{" "}
            <strong className="text-slate-400">{data.market_breadth.choppy} 💤</strong>
          </span>
          <span className="text-accent-cyan font-bold">{data.market_breadth.market_sentiment}</span>
        </div>
      )}
    </div>
  );
}
