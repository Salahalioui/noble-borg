"use client";

import React, { useEffect, useState } from "react";
import { 
  fetchPaperPortfolio, 
  executePaperOrder, 
  resetPaperBalance,
  closePaperPosition,
  scalePaperPosition,
  lockBreakeven
} from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { 
  Wallet, 
  RefreshCw, 
  Zap, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  XSquare, 
  Scissors, 
  CheckCircle2,
  LineChart,
  History,
  Clock
} from "lucide-react";
import TooltipHelper from "@/components/ui/TooltipHelper";

export default function PaperPortfolioWidget() {
  const { activeSymbol, currentPrice, aiDebateResult } = useTradingStore();
  const [portfolio, setPortfolio] = useState<any | null>({
    initial_balance: 50,
    total_equity: 50,
    cash_balance: 50,
    total_pnl: 0,
    win_rate_pct: 0,
    total_trades: 0,
    active_positions: [],
    equity_curve: [],
    trade_history: []
  });
  const [viewTab, setViewTab] = useState<"positions" | "history">("positions");
  const [orderQty, setOrderQty] = useState<number>(0.001);
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [stopLossInput, setStopLossInput] = useState<string>("");
  const [takeProfitInput, setTakeProfitInput] = useState<string>("");
  const [executing, setExecuting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResetMenu, setShowResetMenu] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadPortfolio = async () => {
    try {
      const data = await fetchPaperPortfolio().catch(() => null);
      if (data) {
        setPortfolio(data);
      }
    } catch (err) {
      console.error("Error loading portfolio:", err);
    }
  };

  useEffect(() => {
    loadPortfolio();
    const interval = setInterval(loadPortfolio, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMsg(null);
    try {
      await executePaperOrder({
        symbol: activeSymbol,
        side: orderSide,
        quantity: Number(orderQty),
        current_price: currentPrice || 65420,
        stop_loss: stopLossInput ? parseFloat(stopLossInput) : undefined,
        take_profit: takeProfitInput ? parseFloat(takeProfitInput) : undefined,
      });
      await loadPortfolio();
    } catch (err: any) {
      setErrorMsg(err.message || "Order failed");
    } finally {
      setExecuting(false);
    }
  };

  const handleCalculateMicroATR = () => {
    const p = currentPrice || 65420;
    const equity = portfolio?.cash_balance || 50;
    const dollarRisk = equity * 0.02; // Safe 2% risk
    const stopDistance = p * 0.015;
    const recommendedQty = parseFloat((dollarRisk / stopDistance).toFixed(5));
    setOrderQty(Math.max(recommendedQty, 0.0001));
  };

  const handleLoadAISetup = () => {
    if (!aiDebateResult?.signal) return;
    const sig = aiDebateResult.signal;
    if (sig.action === "SELL") {
      setOrderSide("SELL");
    } else {
      setOrderSide("BUY");
    }
    if (sig.stop_loss) setStopLossInput(sig.stop_loss.toString());
    if (sig.take_profit_1) setTakeProfitInput(sig.take_profit_1.toString());
    handleCalculateMicroATR();
  };

  const handleResetCapital = async (amount: number) => {
    try {
      await resetPaperBalance(amount);
      setShowResetMenu(false);
      await loadPortfolio();
    } catch (e) {
      console.error("Reset error:", e);
    }
  };

  const handleClosePosition = async (sym: string) => {
    try {
      const res = await closePaperPosition(sym, currentPrice || 65000);
      if (res.success) {
        setActionSuccess(`Closed ${sym} (P&L: $${res.realized_pnl})`);
        setTimeout(() => setActionSuccess(null), 3000);
        await loadPortfolio();
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleScalePosition = async (sym: string) => {
    try {
      const res = await scalePaperPosition(sym, 0.5, currentPrice || 65000);
      if (res.success) {
        setActionSuccess(`Scaled 50% out of ${sym} (Locked P&L: +$${res.realized_pnl})`);
        setTimeout(() => setActionSuccess(null), 3000);
        await loadPortfolio();
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleLockBreakeven = async (sym: string) => {
    try {
      const res = await lockBreakeven(sym);
      if (res.success) {
        setActionSuccess(`Stop Loss moved to Entry ($0 Risk) for ${sym}`);
        setTimeout(() => setActionSuccess(null), 3000);
        await loadPortfolio();
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const totalPnl = portfolio?.total_pnl ?? 0;
  const totalEquity = portfolio?.total_equity ?? 50;
  const winRate = portfolio?.win_rate_pct ?? 0;
  const totalTrades = portfolio?.total_trades ?? 0;
  const tradeValue = (orderQty * (currentPrice || 65420)).toFixed(2);
  const equityPoints = portfolio?.equity_curve || [];

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-xl border border-surface-border overflow-hidden text-xs font-mono">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-[#0f141e]/95">
        <div className="flex items-center space-x-2">
          <Wallet className="w-4 h-4 text-accent-green" />
          <span className="font-semibold text-slate-200">Paper Trading Sandbox</span>
          <TooltipHelper
            title="Simulated Paper Portfolio"
            explanation="Test AI trade setups in a zero-risk sandbox with identical live market execution, wick tracking, and auto-breakeven trailing stops."
            howToUse="Execute simulated trades to build confidence before risking real money on Binance or Bybit."
          />
        </div>
        <div className="flex items-center space-x-1.5">
          {/* Reset Capital Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowResetMenu(!showResetMenu)}
              className="flex items-center space-x-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition"
              title="Reset simulation balance"
            >
              <RotateCcw className="w-3 h-3 text-accent-yellow" />
              <span>Reset ($)</span>
            </button>

            {showResetMenu && (
              <div className="absolute right-0 top-6 z-20 bg-[#111722] border border-surface-border rounded-xl p-2.5 shadow-2xl space-y-1.5 w-36 animate-in fade-in">
                <span className="text-[10px] text-slate-400 block font-bold">Select Starting Capital:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[10, 25, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleResetCapital(amt)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#080b10] hover:bg-accent-green hover:text-black text-slate-200 transition"
                    >
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={loadPortfolio} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Account Balance Summary & Equity Mini-Sparkline */}
      <div className="grid grid-cols-3 gap-2 p-2 border-b border-surface-border bg-[#0a0d13]">
        <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
          <span className="text-[10px] text-slate-500 block font-semibold">TOTAL EQUITY</span>
          <span className="text-white font-bold text-sm block">
            ${Number(totalEquity).toFixed(2)}
          </span>
        </div>

        <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
          <span className="text-[10px] text-slate-500 block font-semibold">TOTAL P&L</span>
          <span
            className={`font-bold text-sm block flex items-center space-x-1 ${
              totalPnl >= 0 ? "text-accent-green" : "text-accent-red"
            }`}
          >
            {totalPnl >= 0 ? <TrendingUp className="w-3 h-3 inline mr-0.5" /> : <TrendingDown className="w-3 h-3 inline mr-0.5" />}
            <span>{totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`}</span>
          </span>
        </div>

        <div className="p-2 bg-[#111722] rounded-lg border border-surface-border">
          <span className="text-[10px] text-slate-500 block font-semibold">WIN RATE</span>
          <span className="text-accent-cyan font-bold text-sm block">
            {winRate}% ({totalTrades} trades)
          </span>
        </div>
      </div>

      {/* Quick Trade Execution Form */}
      <div className="p-2.5 border-b border-surface-border bg-[#0c1017] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white text-xs">Order: {activeSymbol}</span>
          {aiDebateResult?.signal && (
            <button
              onClick={handleLoadAISetup}
              className="px-2 py-0.5 bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 border border-accent-purple/40 rounded-lg text-[10px] font-bold flex items-center space-x-1 transition"
            >
              <Zap className="w-3 h-3" />
              <span>⚡ Load AI Setup</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderSide("BUY")}
            className={`py-1 rounded-lg font-bold transition text-xs ${
              orderSide === "BUY"
                ? "bg-accent-green text-black shadow-sm"
                : "bg-[#111722] text-slate-400 hover:text-white border border-surface-border"
            }`}
          >
            LONG (BUY)
          </button>
          <button
            onClick={() => setOrderSide("SELL")}
            className={`py-1 rounded-lg font-bold transition text-xs ${
              orderSide === "SELL"
                ? "bg-accent-red text-white shadow-sm"
                : "bg-[#111722] text-slate-400 hover:text-white border border-surface-border"
            }`}
          >
            SHORT (SELL)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex-1 flex flex-col">
            <input
              type="number"
              step="0.0001"
              value={orderQty}
              onChange={(e) => setOrderQty(parseFloat(e.target.value) || 0)}
              className="bg-[#080b10] border border-surface-border rounded-lg px-2.5 py-1 text-xs text-white"
              placeholder="Qty"
            />
            <span className="text-[9px] text-slate-500 mt-0.5">≈ ${tradeValue}</span>
          </div>
          <button
            onClick={handleCalculateMicroATR}
            className="px-2.5 py-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan rounded-lg border border-accent-cyan/30 text-[10px] font-bold"
            title="Auto-calculate 2% risk position size"
          >
            2% Micro Risk
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={stopLossInput}
            onChange={(e) => setStopLossInput(e.target.value)}
            placeholder="Stop Loss ($)"
            className="bg-[#080b10] border border-surface-border rounded px-2 py-1 text-[11px] text-accent-red"
          />
          <input
            type="number"
            value={takeProfitInput}
            onChange={(e) => setTakeProfitInput(e.target.value)}
            placeholder="Take Profit ($)"
            className="bg-[#080b10] border border-surface-border rounded px-2 py-1 text-[11px] text-accent-green"
          />
        </div>

        {errorMsg && (
          <p className="text-accent-red text-[10px] bg-accent-red/10 p-1.5 rounded border border-accent-red/30">
            {errorMsg}
          </p>
        )}
        {actionSuccess && (
          <p className="text-accent-green text-[10px] bg-accent-green/10 p-1.5 rounded border border-accent-green/30 font-bold animate-in fade-in">
            {actionSuccess}
          </p>
        )}

        <button
          onClick={handleExecute}
          disabled={executing}
          className={`w-full py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition ${
            orderSide === "BUY"
              ? "bg-accent-green hover:bg-accent-green/90 text-black"
              : "bg-accent-red hover:bg-accent-red/90 text-white"
          }`}
        >
          {executing ? "Executing..." : `Execute ${orderSide} Market Order`}
        </button>
      </div>

      {/* Tab Navigation: Positions vs Trade History */}
      <div className="flex border-b border-surface-border bg-[#0a0d13]">
        <button
          onClick={() => setViewTab("positions")}
          className={`flex-1 py-1.5 text-center text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            viewTab === "positions"
              ? "text-accent-cyan border-b-2 border-accent-cyan bg-surface/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Wallet className="w-3 h-3" />
          <span>Open Positions ({portfolio?.active_positions?.length ?? 0})</span>
        </button>
        <button
          onClick={() => setViewTab("history")}
          className={`flex-1 py-1.5 text-center text-xs font-bold transition flex items-center justify-center space-x-1.5 ${
            viewTab === "history"
              ? "text-accent-purple border-b-2 border-accent-purple bg-surface/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <History className="w-3 h-3" />
          <span>Trade History ({portfolio?.trade_history?.length ?? 0})</span>
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
        {viewTab === "positions" ? (
          <>
            {portfolio?.active_positions?.length === 0 ? (
              <p className="text-center text-slate-600 py-4 text-[11px]">No active open positions.</p>
            ) : (
              portfolio?.active_positions?.map((pos: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-[#111722] border border-surface-border space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-white">{pos.symbol}</span>
                      <span
                        className={`text-[9px] px-1 rounded font-bold ${
                          pos.side === "LONG" ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"
                        }`}
                      >
                        {pos.side}
                      </span>
                      {pos.is_breakeven_locked && (
                        <span className="text-[9px] px-1 rounded bg-accent-green text-black font-black flex items-center space-x-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>BREAKEVEN</span>
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold block text-xs ${
                          pos.unrealized_pnl >= 0 ? "text-accent-green" : "text-accent-red"
                        }`}
                      >
                        {pos.unrealized_pnl >= 0 ? `+$${pos.unrealized_pnl}` : `-$${Math.abs(pos.unrealized_pnl)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Entry: ${pos.entry_price}</span>
                    <span>TP: ${pos.take_profit || "—"}</span>
                    <span>SL: ${pos.stop_loss || "—"}</span>
                  </div>

                  {pos.take_profit && (
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-accent-green h-full transition-all duration-500"
                        style={{ width: `${pos.progress_to_tp_pct ?? 0}%` }}
                      />
                    </div>
                  )}

                  {/* Position Action Buttons */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-surface-border/50 text-[9px]">
                    <button
                      onClick={() => handleClosePosition(pos.symbol)}
                      className="py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded flex items-center justify-center space-x-0.5 transition"
                      title="Close entire position at market price"
                    >
                      <XSquare className="w-2.5 h-2.5" />
                      <span>Close</span>
                    </button>

                    <button
                      onClick={() => handleScalePosition(pos.symbol)}
                      className="py-1 bg-accent-yellow/10 hover:bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30 rounded flex items-center justify-center space-x-0.5 transition"
                      title="Take partial profit on 50% of position"
                    >
                      <Scissors className="w-2.5 h-2.5" />
                      <span>50% Out</span>
                    </button>

                    <button
                      onClick={() => handleLockBreakeven(pos.symbol)}
                      disabled={pos.is_breakeven_locked}
                      className={`py-1 rounded flex items-center justify-center space-x-0.5 transition ${
                        pos.is_breakeven_locked
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                          : "bg-accent-green/10 hover:bg-accent-green/20 text-accent-green border border-accent-green/30"
                      }`}
                      title="Move Stop Loss to Entry price ($0 risk)"
                    >
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>Breakeven</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          /* Persistent Closed Trade History View */
          <>
            {portfolio?.trade_history?.length === 0 ? (
              <p className="text-center text-slate-600 py-4 text-[11px]">No closed trades in history yet.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 text-[9px] text-slate-500 font-bold uppercase">
                  <span>Symbol & Type</span>
                  <span>Exit / P&L</span>
                </div>
                {portfolio?.trade_history?.map((t: any, idx: number) => {
                  const pnl = Number(t.realized_pnl ?? 0);
                  const pnlPct = Number(t.pnl_pct ?? 0);
                  const isProfit = pnl >= 0;
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#111722] border border-surface-border space-y-1 hover:bg-[#151c2a] transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-white text-xs">{t.symbol}</span>
                          <span
                            className={`text-[9px] px-1 rounded font-bold ${
                              t.side === "LONG" ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"
                            }`}
                          >
                            {t.side}
                          </span>
                          <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400">
                            {t.exit_reason || "CLOSED"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-black text-xs block ${
                              isProfit ? "text-accent-green" : "text-accent-red"
                            }`}
                          >
                            {isProfit ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}
                            <span className="text-[10px] font-normal ml-1">
                              ({isProfit ? `+${pnlPct.toFixed(1)}%` : `${pnlPct.toFixed(1)}%`})
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Entry: ${Number(t.entry_price).toFixed(2)} ➔ Exit: ${Number(t.exit_price).toFixed(2)}</span>
                        <span className="text-[9px] text-slate-500 flex items-center space-x-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{t.closed_at ? new Date(t.closed_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently"}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Persistent Storage Badge */}
      <div className="px-3 py-1 bg-[#090d14] border-t border-surface-border text-[9px] text-slate-500 flex items-center justify-between font-mono">
        <span>💾 Local & Cloud Persistent Database</span>
        <span className="text-accent-cyan">Auto-Synced</span>
      </div>
    </div>
  );
}
