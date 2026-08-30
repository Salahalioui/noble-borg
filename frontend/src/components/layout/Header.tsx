"use client";

import React, { useState } from "react";
import { useTradingStore, LayoutPreset } from "@/store/useTradingStore";
import { 
  Terminal, 
  Wifi, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  Calculator,
  ChevronDown
} from "lucide-react";

export default function Header() {
  const [mobilePresetOpen, setMobilePresetOpen] = useState(false);
  const { 
    activeSymbol, 
    currentPrice, 
    change24h, 
    watchlist,
    setActiveSymbol,
    activePreset,
    setActivePreset,
    setDiagnosticsOpen,
    setCompoundModalOpen,
    backendConnected
  } = useTradingStore();

  const presets: { id: LayoutPreset; label: string }[] = [
    { id: "zen", label: "🧘 Zen" },
    { id: "standard", label: "Standard" },
    { id: "discovery", label: "🔍 Discovery" },
    { id: "scalper", label: "Scalper" },
    { id: "ai_focus", label: "AI Analyst" },
    { id: "macro", label: "Macro" },
  ];

  const currentPresetLabel = presets.find((p) => p.id === activePreset)?.label || "Standard";

  return (
    <header className="h-14 border-b border-surface-border bg-[#0a0d14]/95 backdrop-blur px-2.5 sm:px-4 flex items-center justify-between text-xs font-mono select-none sticky top-0 z-40 w-full">
      {/* Left: Brand & Live Price */}
      <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-accent-purple to-accent-cyan flex items-center justify-center shadow-md shadow-accent-cyan/20">
            <Terminal className="w-4 h-4 text-black font-bold" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white tracking-wider text-xs sm:text-sm flex items-center space-x-0.5">
              <span>NOBLE</span>
              <span className="text-accent-cyan">BORG</span>
            </span>
          </div>
        </div>

        {/* Live Active Symbol & Price Ticker */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 pl-2 border-l border-surface-border">
          <span className="text-white font-bold text-xs">{activeSymbol}</span>
          <span className="text-slate-300 text-xs font-semibold">
            ${currentPrice ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "65,420.00"}
          </span>

          <div
            className={`hidden md:flex items-center space-x-0.5 px-1.5 py-0.5 rounded font-bold text-[10px] ${
              change24h >= 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
            }`}
          >
            {change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{change24h > 0 ? `+${change24h}%` : `${change24h}%`}</span>
          </div>
        </div>
      </div>

      {/* Center: Quick Watchlist Asset Switcher (Desktop) */}
      <div className="hidden xl:flex items-center space-x-1 bg-[#080b10] p-1 rounded-lg border border-surface-border shrink-0">
        {watchlist.slice(0, 5).map((item) => (
          <button
            key={item.symbol}
            onClick={() => setActiveSymbol(item.symbol, item.isCrypto)}
            className={`px-2 py-0.5 rounded transition text-[11px] flex items-center space-x-1 ${
              activeSymbol === item.symbol
                ? "bg-[#161f30] text-accent-cyan font-bold border border-accent-cyan/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>{item.symbol}</span>
          </button>
        ))}
      </div>

      {/* Right: Layout Preset Selector & Launcher Buttons */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Desktop Preset Selector */}
        <div className="hidden lg:flex items-center bg-[#080b10] p-0.5 rounded-lg border border-surface-border space-x-0.5">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className={`px-2 py-1 text-[11px] rounded transition ${
                activePreset === p.id
                  ? p.id === "zen"
                    ? "bg-gradient-to-r from-accent-cyan to-accent-green text-black font-extrabold shadow-sm"
                    : "bg-accent-purple text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Mobile/Tablet Preset Dropdown */}
        <div className="relative lg:hidden">
          <button
            onClick={() => setMobilePresetOpen(!mobilePresetOpen)}
            className="flex items-center space-x-1 px-2 py-1 bg-[#080b10] border border-surface-border rounded-lg text-[11px] font-bold text-white"
          >
            <span>{currentPresetLabel}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {mobilePresetOpen && (
            <div className="absolute right-0 top-8 z-50 bg-[#0d131f] border border-surface-border rounded-xl p-1.5 shadow-2xl space-y-1 w-36 animate-in fade-in">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePreset(p.id);
                    setMobilePresetOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    activePreset === p.id
                      ? "bg-accent-cyan text-black"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compound Calculator Launcher Button */}
        <button
          onClick={() => setCompoundModalOpen(true)}
          className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 bg-accent-green/10 hover:bg-accent-green/20 border border-accent-green/40 text-accent-green rounded-lg text-[11px] sm:text-xs font-bold transition shadow-sm"
          title="Open Micro-Account Compound Growth Simulator"
        >
          <Calculator className="w-3.5 h-3.5 text-accent-green" />
          <span className="hidden md:inline">Compound $</span>
        </button>

        {/* Diagnostics & API Radar Modal Launcher Button */}
        <button
          onClick={() => setDiagnosticsOpen(true)}
          className="flex items-center space-x-1 px-2 sm:px-2.5 py-1 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan rounded-lg text-[11px] sm:text-xs font-bold transition shadow-sm"
          title="Open Live API Latency & Health Diagnostics"
        >
          <Activity className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
          <span className="hidden md:inline">Diagnostics</span>
        </button>

        {/* Connection Status Badge */}
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-[10px] font-bold ${
            backendConnected
              ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
              : "bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow"
          }`}
          title={backendConnected ? "Live WebSocket Hub Connected" : "Connecting to Market Stream..."}
        >
          {backendConnected ? <Wifi className="w-3 h-3" /> : <Activity className="w-3 h-3 animate-spin" />}
          <span className="hidden sm:inline">{backendConnected ? "LIVE" : "SYNCING"}</span>
        </div>
      </div>
    </header>
  );
}
