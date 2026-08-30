"use client";

import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  ShieldCheck, 
  Smartphone, 
  ExternalLink, 
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface BinanceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: any;
  symbol: string;
  currentPrice: number;
  userCapital: number;
}

export default function BinanceOrderModal({
  isOpen,
  onClose,
  signal,
  symbol,
  currentPrice,
  userCapital,
}: BinanceOrderModalProps) {
  const [copied, setCopied] = useState(false);
  const [platform, setPlatform] = useState<"binance" | "bybit">("binance");
  const [tradeMode, setTradeMode] = useState<"spot" | "margin">("spot");

  if (!isOpen) return null;

  const action = signal?.action || "BUY";
  const entryPrice = signal?.current_price || currentPrice || 65000;
  const sl = signal?.stop_loss || entryPrice * 0.985;
  const tp1 = signal?.take_profit_1 || entryPrice * 1.025;
  const tp2 = signal?.take_profit_2 || entryPrice * 1.045;
  
  // Safe micro dollar allocation (e.g. 50% of capital for spot, or exact 2% risk sizing)
  const dollarAllocation = (userCapital * 0.5).toFixed(2);
  const cryptoAmount = (parseFloat(dollarAllocation) / entryPrice).toFixed(6);

  const formattedCopyText = `🎯 [${platform.toUpperCase()} ORDER SETUP]
Pair: ${symbol}
Side: ${action === "BUY" ? "BUY (LONG)" : "SELL (SHORT)"}
Order Type: LIMIT ORDER
Limit Entry Price: $${entryPrice}
Quantity / Total: $${dollarAllocation} USDT (≈ ${cryptoAmount} ${symbol.replace("USDT", "")})
Take Profit (TP): $${tp1}
Stop Loss (SL): $${sl}
Target Hold Time: ${signal?.hold_time || "Day Trade (2-6h)"}
Trade Mode: ${tradeMode === "spot" ? "Spot (1x Safe)" : "Isolated Margin (Max 2x)"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedCopyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-[#0c1017] border border-surface-border w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 font-mono shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-accent-yellow/15 text-accent-yellow rounded-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide flex items-center space-x-2">
                <span>Binance & Bybit Live Order Assistant</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-accent-green/20 text-accent-green font-bold">
                  1-Click Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Exact parameters to copy directly into your exchange mobile or web app.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform & Mode Selectors */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111722] p-1 rounded-xl border border-surface-border flex">
            <button
              onClick={() => setPlatform("binance")}
              className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition ${
                platform === "binance"
                  ? "bg-accent-yellow text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🟡 Binance App
            </button>
            <button
              onClick={() => setPlatform("bybit")}
              className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition ${
                platform === "bybit"
                  ? "bg-accent-cyan text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔵 Bybit App
            </button>
          </div>

          <div className="bg-[#111722] p-1 rounded-xl border border-surface-border flex">
            <button
              onClick={() => setTradeMode("spot")}
              className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition ${
                tradeMode === "spot"
                  ? "bg-accent-green text-black shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🛡️ Spot (1x Safe)
            </button>
            <button
              onClick={() => setTradeMode("margin")}
              className={`flex-1 py-1 text-center text-xs font-bold rounded-lg transition ${
                tradeMode === "margin"
                  ? "bg-accent-purple text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Max 2x Margin
            </button>
          </div>
        </div>

        {/* Formatted Order Card (Exact match to Binance UI) */}
        <div className="p-4 rounded-xl bg-[#090d14] border border-surface-border/80 space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border/50 pb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span>{symbol} ({action})</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Order Type: <strong className="text-accent-cyan">LIMIT ORDER</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
              <span className="text-[10px] text-slate-400 block font-semibold">Limit Price</span>
              <span className="text-white font-black text-sm block mt-0.5">${entryPrice}</span>
              <span className="text-[9px] text-slate-500 block">Entry level</span>
            </div>

            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
              <span className="text-[10px] text-slate-400 block font-semibold">Total USDT</span>
              <span className="text-accent-cyan font-black text-sm block mt-0.5">${dollarAllocation}</span>
              <span className="text-[9px] text-slate-500 block">≈ {cryptoAmount}</span>
            </div>

            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
              <span className="text-[10px] text-slate-400 block font-semibold">Take Profit (TP)</span>
              <span className="text-accent-green font-black text-sm block mt-0.5">${tp1}</span>
              <span className="text-[9px] text-slate-500 block">Target 1</span>
            </div>

            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
              <span className="text-[10px] text-slate-400 block font-semibold">Stop Loss (SL)</span>
              <span className="text-accent-red font-black text-sm block mt-0.5">${sl}</span>
              <span className="text-[9px] text-slate-500 block">Hard exit</span>
            </div>
          </div>

          {/* Quick Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
              copied
                ? "bg-accent-green text-black shadow-lg"
                : "bg-gradient-to-r from-accent-yellow to-accent-cyan text-black hover:opacity-90 shadow-md"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied to Clipboard! Ready to Paste</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 Copy Order Values for {platform.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {/* Step-by-Step Mobile Instructions */}
        <div className="p-3 bg-[#111722] rounded-xl border border-surface-border space-y-2 text-xs">
          <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-wider block">
            📱 How to execute on {platform === "binance" ? "Binance" : "Bybit"} (30 Seconds):
          </span>
          <ol className="space-y-1.5 text-slate-300 text-[11px] list-decimal list-inside leading-relaxed">
            <li>Open the <strong>{platform === "binance" ? "Binance" : "Bybit"} app</strong> and search for <strong>{symbol}</strong>.</li>
            <li>Select <strong>Limit Order</strong> and type <strong>${entryPrice}</strong> in the Price box.</li>
            <li>Enter <strong>${dollarAllocation} USDT</strong> in the amount slider.</li>
            <li>Tick the <strong>[TP / SL]</strong> checkbox and set TP = <strong>${tp1}</strong>, SL = <strong>${sl}</strong>.</li>
            <li>Tap <strong>{action === "BUY" ? "Buy / Long" : "Sell / Short"}</strong>. Your order is safely protected!</li>
          </ol>
        </div>

        {/* Local P2P Funding Notice (Algeria / MENA Context) */}
        <div className="p-3 bg-accent-green/5 rounded-xl border border-accent-green/20 text-slate-400 text-[11px] space-y-1">
          <div className="flex items-center space-x-1 text-accent-green font-bold text-[10px] uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>P2P Funding Guide (BaridiMob / CCP)</span>
          </div>
          <p className="leading-relaxed">
            To fund your wallet with $10–$50: Open <strong>Binance P2P</strong> $\rightarrow$ Select <strong>DZD currency</strong> $\rightarrow$ Buy USDT with <strong>BaridiMob or CCP</strong> $\rightarrow$ Transfer from Funding to Spot wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
