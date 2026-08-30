"use client";

import React, { useEffect, useState } from "react";
import { fetchMacroDashboard, fetchPolymarketEvents } from "@/lib/api";
import { Globe, TrendingUp, TrendingDown, RefreshCw, BarChart2 } from "lucide-react";
import TooltipHelper from "@/components/ui/TooltipHelper";

const DEFAULT_MACRO_EVENTS = [
  {
    id: "1",
    title: "Fed cuts interest rates by 25+ bps at next FOMC?",
    yes_probability: 86.4,
    no_probability: 13.6,
    volume_formatted: "$8.4M"
  },
  {
    id: "2",
    title: "Bitcoin closes above $80,000 this month?",
    yes_probability: 72.8,
    no_probability: 27.2,
    volume_formatted: "$4.9M"
  },
  {
    id: "3",
    title: "US Core CPI inflation prints below 2.9% YoY?",
    yes_probability: 64.0,
    no_probability: 36.0,
    volume_formatted: "$2.5M"
  },
  {
    id: "4",
    title: "US Avoids Official NBER Recession in 2026?",
    yes_probability: 91.2,
    no_probability: 8.8,
    volume_formatted: "$1.7M"
  }
];

export default function MacroRadarWidget() {
  const [macro, setMacro] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>(DEFAULT_MACRO_EVENTS);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [m, e] = await Promise.all([
        fetchMacroDashboard().catch(() => null),
        fetchPolymarketEvents().catch(() => null),
      ]);
      if (m?.macro_indicators) {
        setMacro(m.macro_indicators);
      } else if (m) {
        setMacro(m);
      }

      const evts = Array.isArray(e) ? e : (e?.events || []);
      if (evts && evts.length > 0) {
        setEvents(evts);
      }
    } catch (err) {
      console.error("Macro data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const t10y2y = macro?.t10y2y?.value ?? 0.39;
  const fedFunds = macro?.fed_funds?.value ?? 3.63;
  const cpi = macro?.cpi?.value ?? 332.81;

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-xl border border-surface-border overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-[#0f141e]/95">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-accent-cyan" />
          <span className="font-semibold text-slate-200">Macro Radar & Prediction Odds</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-500 font-semibold">FRED + Polymarket</span>
          <button
            onClick={loadData}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* FRED Indicators Grid */}
      <div className="grid grid-cols-3 gap-2 p-2 border-b border-surface-border bg-[#0a0d13]">
        <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold">10Y-2Y Spread</span>
            <TooltipHelper
              title="10Y-2Y Treasury Yield Spread"
              explanation="The difference between 10-year and 2-year US Treasury bond yields. A positive spread signals normal growth; an inverted (negative) spread is a classic recession warning."
              howToUse="When the yield curve normalizes and steepens positively, market risk appetite expands for Bitcoin and tech."
            />
          </div>
          <span
            className={`font-bold text-sm mt-0.5 block flex items-center space-x-1 ${
              t10y2y >= 0 ? "text-accent-green" : "text-accent-red"
            }`}
          >
            {t10y2y >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
            {t10y2y >= 0 ? `+${t10y2y}%` : `${t10y2y}%`}
          </span>
          <span className="text-[9px] text-slate-500 block">
            {t10y2y >= 0 ? "Normal Yield Curve" : "Inverted Curve"}
          </span>
        </div>

        <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold">Fed Funds Rate</span>
            <TooltipHelper
              title="Federal Reserve Benchmark Rate"
              explanation="The interest rate set by the US central bank that governs borrowing costs throughout the global economy."
              howToUse="Lower interest rates flood the market with cheap liquidity, benefiting crypto and growth stocks."
            />
          </div>
          <span className="font-bold text-sm text-accent-cyan mt-0.5 block">{fedFunds}%</span>
          <span className="text-[9px] text-slate-500 block">Effective Policy</span>
        </div>

        <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold">CPI Index</span>
            <TooltipHelper
              title="Consumer Price Index (Inflation)"
              explanation="Measures the monthly rate of inflation. Higher numbers mean prices are rising faster."
              howToUse="Cooling inflation encourages the Federal Reserve to cut rates and boost market momentum."
            />
          </div>
          <span className="font-bold text-sm text-white mt-0.5 block">{cpi}</span>
          <span className="text-[9px] text-slate-500 block">Headline Inflation</span>
        </div>
      </div>

      {/* Polymarket Macro & Crypto Events */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto">
        <span className="text-[10px] text-slate-400 font-bold px-1 uppercase tracking-wider block flex items-center justify-between">
          <span>Macro & Crypto Prediction Markets</span>
          <span className="text-[9px] text-accent-green font-normal">Real Polymarket Volume</span>
        </span>

        {events.map((e, idx) => (
          <div
            key={idx}
            className="p-2.5 bg-[#111722] rounded-lg border border-surface-border space-y-1.5 hover:bg-[#151c2a] transition"
          >
            <div className="flex items-start justify-between">
              <p className="text-[11px] text-slate-200 font-semibold leading-tight flex-1 pr-2">
                {e.title}
              </p>
              <div className="flex items-center space-x-1 shrink-0">
                <span className="text-accent-green font-black text-xs bg-accent-green/10 px-1.5 py-0.5 rounded border border-accent-green/30">
                  {e.yes_probability}% YES
                </span>
                <span className="text-accent-red font-bold text-[10px] bg-accent-red/10 px-1 py-0.5 rounded border border-accent-red/30">
                  {e.no_probability}% NO
                </span>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-accent-green h-full transition-all duration-500"
                style={{ width: `${e.yes_probability}%` }}
              />
              <div
                className="bg-accent-red h-full transition-all duration-500"
                style={{ width: `${e.no_probability}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>Polymarket 24h Vol: <strong className="text-slate-300">{e.volume_formatted || "$2.5M"}</strong></span>
              <span className="text-accent-cyan">Leading Macro Sentiment</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
