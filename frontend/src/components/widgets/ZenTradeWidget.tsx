"use client";

import React, { useEffect, useState } from "react";
import { useTradingStore } from "@/store/useTradingStore";
import { 
  runAICouncilDebate, 
  executePaperOrder, 
  fetchPaperPortfolio, 
  fetchAIAccuracyScorecard, 
  resetPaperBalance,
  resetAITrackRecord 
} from "@/lib/api";
import { 
  Sparkles, 
  Bot, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  HelpCircle, 
  Award, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Filter, 
  Zap, 
  CheckCircle2, 
  ShieldAlert, 
  Lock,
  Smartphone
} from "lucide-react";
import BinanceOrderModal from "@/components/modals/BinanceOrderModal";
import TooltipHelper from "@/components/ui/TooltipHelper";

export default function ZenTradeWidget() {
  const { activeSymbol, isCrypto, currentPrice, change24h, aiDebateResult, setAIDebateResult, isDebatingAI, setIsDebatingAI } = useTradingStore();
  
  const [portfolio, setPortfolio] = useState<any | null>(null);
  const [accuracy, setAccuracy] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"assistant" | "scorecard">("assistant");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("ALL");
  const [startingCapital, setStartingCapital] = useState<number>(50); // Default to $50 micro account
  const [customCapitalInput, setCustomCapitalInput] = useState<string>("");
  const [isEditingCapital, setIsEditingCapital] = useState<boolean>(false);
  const [orderQty, setOrderQty] = useState<number>(0.001); // Micro size default
  const [executing, setExecuting] = useState<boolean>(false);
  const [execSuccess, setExecSuccess] = useState<string | null>(null);
  const [resettingRecord, setResettingRecord] = useState<boolean>(false);
  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState<boolean>(false);

  const signal = aiDebateResult?.signal;
  const guide = aiDebateResult?.beginner_guide;

  const loadData = async () => {
    try {
      const [port, acc] = await Promise.all([
        fetchPaperPortfolio().catch(() => null),
        fetchAIAccuracyScorecard(timeframeFilter).catch(() => null),
      ]);
      if (port) {
        setPortfolio(port);
        setStartingCapital(port.initial_balance || 50);
      }
      if (acc) setAccuracy(acc);
    } catch (e) {
      console.error("Error loading data:", e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [timeframeFilter]);

  const handleDebate = async () => {
    setIsDebatingAI(true);
    try {
      const res = await runAICouncilDebate(activeSymbol, isCrypto, undefined, startingCapital);
      setAIDebateResult(res);
      await loadData();
    } catch (e) {
      console.error("Debate error:", e);
    } finally {
      setIsDebatingAI(false);
    }
  };

  // 1-Click Semi-Automatic AI Setup Execution
  const handleExecuteAISetup = async () => {
    if (!signal || signal.action === "HOLD") return;
    setExecuting(true);
    setExecSuccess(null);

    try {
      const p = currentPrice || signal.current_price || 65420;
      const equity = portfolio?.cash_balance || startingCapital || 50;
      const dollarRisk = equity * 0.02; // Safe 2% risk ($1.00 on $50)
      const stopDistance = Math.abs(p - (signal.stop_loss || (p * 0.985)));
      const autoQty = parseFloat((dollarRisk / (stopDistance || (p * 0.015))).toFixed(5));

      await executePaperOrder({
        symbol: activeSymbol,
        side: signal.action === "SELL" ? "SELL" : "BUY",
        quantity: Math.max(autoQty, 0.0001),
        current_price: p,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit_1,
      });

      setExecSuccess(`🚀 1-Click Execution complete! AI Setup active with auto-breakeven shield.`);
      await loadData();
      setTimeout(() => setExecSuccess(null), 6000);
    } catch (err: any) {
      alert(err.message || "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const handleManualTrade = async (side: "BUY" | "SELL") => {
    setExecuting(true);
    setExecSuccess(null);
    try {
      await executePaperOrder({
        symbol: activeSymbol,
        side,
        quantity: Number(orderQty),
        current_price: currentPrice || 65420,
        stop_loss: signal?.stop_loss,
        take_profit: signal?.take_profit_1,
      });
      setExecSuccess(`Order executed and tracked.`);
      await loadData();
      setTimeout(() => setExecSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const handleApplyMicroRisk = async () => {
    try {
      const p = currentPrice || 65420;
      const equity = portfolio?.cash_balance || startingCapital || 50;
      const dollarRisk = equity * 0.02;
      const stopDistance = p * 0.015;
      const recommendedQty = parseFloat((dollarRisk / stopDistance).toFixed(5));
      setOrderQty(Math.max(recommendedQty, 0.0001));
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetCapital = async (amount: number) => {
    if (amount <= 0) return;
    try {
      const updatedPort = await resetPaperBalance(amount);
      setStartingCapital(amount);
      setPortfolio(updatedPort);
      setIsEditingCapital(false);
      await loadData();
    } catch (e) {
      console.error("Reset capital error:", e);
    }
  };

  const handleResetTrackRecord = async () => {
    if (!confirm("Are you sure you want to reset the AI accuracy track record to start a clean test?")) return;
    setResettingRecord(true);
    try {
      await resetAITrackRecord();
      await loadData();
    } catch (e) {
      console.error("Reset record error:", e);
    } finally {
      setResettingRecord(false);
    }
  };

  const totalEquity = portfolio?.total_equity ?? startingCapital ?? 50;
  const max2PctRiskDollars = (totalEquity * 0.02).toFixed(2);
  const tradeValue = (orderQty * (currentPrice || 65420)).toFixed(2);

  // Active Position for this symbol
  const activePosition = portfolio?.active_positions?.find(
    (p: any) => p.symbol === activeSymbol.toUpperCase()
  );

  const guardrails = portfolio?.guardrail_status || accuracy?.guardrail_status;

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-xl border border-surface-border p-3 sm:p-4 font-mono text-xs justify-between space-y-3 overflow-y-auto">
      {/* Top Banner: Asset, Price & Tab Switcher */}
      <div className="flex items-center justify-between pb-2.5 border-b border-surface-border">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-base font-extrabold text-white tracking-wider">{activeSymbol}</span>
            <span className={`text-xs px-2 py-0.5 rounded font-bold ${change24h >= 0 ? "bg-accent-green/15 text-accent-green" : "bg-accent-red/15 text-accent-red"}`}>
              {change24h >= 0 ? `+${change24h}%` : `${change24h}%`}
            </span>
          </div>
          <span className="text-lg font-black text-white block">
            ${currentPrice ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "65,420.00"}
          </span>
        </div>

        {/* Action / View Tabs */}
        <div className="flex items-center space-x-1 bg-[#080b10] p-1 rounded-lg border border-surface-border">
          <button
            onClick={() => setActiveTab("assistant")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 ${
              activeTab === "assistant" ? "bg-accent-cyan text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab("scorecard")}
            className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center space-x-1 ${
              activeTab === "scorecard" ? "bg-accent-purple text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Track Record ({accuracy?.accuracy_win_rate_pct ?? 0}%)</span>
          </button>
        </div>
      </div>

      {/* Guardrail Circuit Breaker / Overtrading Alert Banner */}
      {guardrails && !guardrails.allowed ? (
        <div className="p-2.5 bg-accent-red/15 border border-accent-red/40 rounded-xl text-accent-red flex items-center space-x-2">
          <Lock className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-bold">{guardrails.message}</span>
        </div>
      ) : guardrails?.is_overtrading_warning ? (
        <div className="p-2 bg-accent-yellow/15 border border-accent-yellow/40 rounded-lg text-accent-yellow flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-bold">{guardrails.warning_message}</span>
        </div>
      ) : null}

      {activeTab === "assistant" ? (
        <>
          {/* Micro-Account Capital Selector ($10 - $100) */}
          <div className="p-2.5 sm:p-3 bg-[#111722] rounded-xl border border-surface-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-accent-green" />
                <span>Simulation Capital:</span>
              </span>

              {!isEditingCapital ? (
                <div className="flex items-center space-x-1">
                  {[10, 25, 50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => handleResetCapital(amt)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        startingCapital === amt
                          ? "bg-accent-green text-black font-extrabold shadow-sm"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      ${amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsEditingCapital(true)}
                    className="p-1 text-slate-400 hover:text-white rounded bg-slate-800"
                    title="Custom capital amount"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={customCapitalInput}
                    onChange={(e) => setCustomCapitalInput(e.target.value)}
                    placeholder="$ amount"
                    className="w-20 bg-[#080b10] border border-surface-border rounded px-1.5 py-0.5 text-xs text-white"
                  />
                  <button
                    onClick={() => handleResetCapital(parseFloat(customCapitalInput) || 50)}
                    className="px-2 py-0.5 bg-accent-green text-black font-bold rounded text-[10px]"
                  >
                    Set
                  </button>
                  <button
                    onClick={() => setIsEditingCapital(false)}
                    className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-surface-border/50">
              <span className="text-slate-300">
                Total Balance: <strong className="text-white">${Number(totalEquity).toFixed(2)}</strong>
              </span>
              <span className="text-accent-yellow font-semibold">
                Safe 2% Max Risk: <strong>${max2PctRiskDollars}</strong>
              </span>
            </div>
          </div>

          {/* Active Trade Lifecycle Progress Slider */}
          {activePosition ? (
            <div className="p-3 bg-[#0d1420] rounded-xl border border-accent-cyan/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2 py-0.5 rounded font-black bg-accent-cyan text-black">
                    ACTIVE {activePosition.side}
                  </span>
                  <span className="font-bold text-white text-xs">
                    Entry: ${activePosition.entry_price}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {activePosition.is_breakeven_locked && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent-green text-black font-black flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>BREAKEVEN SHIELD ACTIVE</span>
                    </span>
                  )}
                  <span className={`font-black text-xs ${activePosition.unrealized_pnl >= 0 ? "text-accent-green" : "text-accent-red"}`}>
                    {activePosition.unrealized_pnl >= 0 ? `+$${activePosition.unrealized_pnl}` : `-$${Math.abs(activePosition.unrealized_pnl)}`} ({activePosition.unrealized_pnl_pct}%)
                  </span>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-accent-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${activePosition.progress_to_tp_pct ?? 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Stop Loss: ${activePosition.stop_loss || "None"}</span>
                  <span className="text-accent-cyan font-bold">{activePosition.progress_to_tp_pct}% to Target 1</span>
                  <span>Target 1: ${activePosition.take_profit || "None"}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Center: Executive AI Signal & Beginner Explanation */}
          <div className="flex-1 space-y-2.5">
            {signal ? (
              <div className={`p-3.5 sm:p-4 rounded-xl border ${signal.action === "BUY" ? "bg-accent-green/10 border-accent-green/30" : signal.action === "SELL" ? "bg-accent-red/10 border-accent-red/30" : "bg-slate-800/40 border-slate-700"} space-y-2.5`}>
                {/* Action Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-black tracking-wide ${signal.action === "BUY" ? "bg-accent-green text-black" : signal.action === "SELL" ? "bg-accent-red text-white" : "bg-slate-700 text-white"}`}>
                      {signal.action} {signal.action === "HOLD" ? "(WAIT IN CASH)" : "RECOMMENDED"}
                    </span>
                    <span className="text-slate-300 font-bold text-xs">
                      Confidence: <span className="text-white">{signal.confidence_score}%</span>
                    </span>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-accent-cyan flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{guide?.estimated_hold_time || "⏱️ Day Trade"}</span>
                  </span>
                </div>

                {/* Beginner Plain-English Breakdown */}
                <div className="p-2.5 sm:p-3 bg-[#0a0d13]/80 rounded-lg border border-surface-border space-y-1.5 text-slate-300 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <HelpCircle className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-[11px]">What is happening:</strong>
                      <p className="text-[11px] text-slate-300">{guide?.what_is_happening || aiDebateResult.bull_thesis}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-1 border-t border-surface-border/50">
                    <ShieldCheck className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block text-[11px]">Why take this action:</strong>
                      <p className="text-[11px] text-slate-300">{guide?.why_enter_or_wait || aiDebateResult.cro_verdict}</p>
                    </div>
                  </div>

                  {guide?.worst_case_scenario && (
                    <div className="flex items-start space-x-2 pt-1 border-t border-surface-border/50">
                      <AlertTriangle className="w-4 h-4 text-accent-red shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-accent-red block text-[11px]">Worst case / Invalidation:</strong>
                        <p className="text-[10px] text-slate-400">{guide.worst_case_scenario}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Concrete Price Targets & Stop Loss */}
                <div className="grid grid-cols-3 gap-2 text-center p-2 bg-[#080b10] rounded-lg border border-surface-border">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">STOP LOSS</span>
                    <span className="text-accent-red font-bold text-xs">${signal.stop_loss}</span>
                    <span className="text-[9px] text-slate-500 block">({signal.stop_loss_pct || "1.5%"})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">TARGET 1</span>
                    <span className="text-accent-green font-bold text-xs">${signal.take_profit_1}</span>
                    <span className="text-[9px] text-slate-500 block">({signal.take_profit_1_pct || "+3.0%"})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">RISK / REWARD</span>
                    <span className="text-accent-cyan font-extrabold text-xs">{signal.risk_reward_ratio}</span>
                    <span className="text-[9px] text-accent-green block">Asymmetric Edge</span>
                  </div>
                </div>

                {/* 1-Click Simulation + Binance Live Copy Action Bar */}
                {signal.action !== "HOLD" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleExecuteAISetup}
                      disabled={executing || (guardrails && !guardrails.allowed)}
                      className="py-2.5 px-3 bg-gradient-to-r from-accent-green to-accent-cyan hover:opacity-95 text-black font-black rounded-xl text-xs transition shadow-lg shadow-green-950/20 flex items-center justify-center space-x-1.5"
                      title="Simulate trade in paper portfolio"
                    >
                      <Zap className="w-4 h-4" />
                      <span>{executing ? "Simulating..." : `🚀 1-Click Simulate (${signal.action})`}</span>
                    </button>

                    <button
                      onClick={() => setIsBinanceModalOpen(true)}
                      className="py-2.5 px-3 bg-gradient-to-r from-accent-yellow/20 to-accent-yellow/30 hover:bg-accent-yellow/40 border border-accent-yellow/50 text-accent-yellow font-black rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-1.5"
                      title="Open Binance / Bybit copy-paste order card"
                    >
                      <Smartphone className="w-4 h-4 text-accent-yellow" />
                      <span>📋 Export for Binance / Bybit</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-surface-border text-center space-y-3 bg-[#0a0d13]">
                <Bot className="w-8 h-8 mx-auto text-accent-purple/80" />
                <div>
                  <h3 className="font-bold text-white text-sm">Zen AI Trading Copilot (Micro Capital Ready)</h3>
                  <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                    Click below to generate a transparent, beginner-friendly trade thesis with micro-risk sizing tailored for ${startingCapital} capital.
                  </p>
                </div>
                <button
                  onClick={handleDebate}
                  disabled={isDebatingAI}
                  className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-cyan text-black font-black rounded-lg text-xs hover:opacity-95 transition shadow-lg shadow-purple-950/30 flex items-center space-x-2 mx-auto"
                >
                  <Sparkles className={`w-4 h-4 ${isDebatingAI ? "animate-spin" : ""}`} />
                  <span>{isDebatingAI ? "Analyzing Market Data..." : "Run AI Signal Analysis"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Execution Bar */}
          <div className="space-y-2 pt-2 border-t border-surface-border">
            {execSuccess && (
              <p className="text-accent-green text-xs bg-accent-green/10 p-2 rounded text-center border border-accent-green/30 font-bold animate-in fade-in">
                {execSuccess}
              </p>
            )}

            <div className="flex items-center space-x-2">
              <div className="flex flex-col">
                <input
                  type="number"
                  step="0.0001"
                  value={orderQty}
                  onChange={(e) => setOrderQty(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#080b10] border border-surface-border rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center"
                  placeholder="Qty"
                />
                <span className="text-[9px] text-slate-500 text-center mt-0.5">≈ ${tradeValue}</span>
              </div>
              <button
                onClick={handleApplyMicroRisk}
                className="px-2.5 py-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan rounded-lg border border-accent-cyan/30 text-[10px] font-bold shrink-0"
                title="Calculate position size risking safe 2% of capital"
              >
                Safe 2% Risk Size
              </button>
              <button
                onClick={() => handleManualTrade("BUY")}
                disabled={executing || (guardrails && !guardrails.allowed)}
                className="flex-1 py-2 bg-accent-green hover:bg-accent-green/90 text-black font-black rounded-lg text-xs transition shadow-sm"
              >
                BUY / LONG
              </button>
              <button
                onClick={() => handleManualTrade("SELL")}
                disabled={executing || (guardrails && !guardrails.allowed)}
                className="flex-1 py-2 bg-accent-red hover:bg-accent-red/90 text-white font-black rounded-lg text-xs transition shadow-sm"
              >
                SELL / SHORT
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Scorecard / Verified Multi-Timeframe AI Accuracy Tab with Real Proof Audit */
        <div className="flex-1 space-y-3">
          {/* Timeframe Filter Bar */}
          <div className="flex items-center justify-between bg-[#111722] p-1 rounded-lg border border-surface-border">
            <span className="text-[10px] text-slate-400 pl-1 font-semibold flex items-center space-x-1">
              <Filter className="w-3 h-3 text-accent-cyan" />
              <span>Hold Time:</span>
            </span>
            <div className="flex items-center space-x-1">
              {[
                { id: "ALL", label: "All" },
                { id: "ULTRA_SCALP", label: "⚡ 5-15m" },
                { id: "SCALP", label: "⚡ 15-45m" },
                { id: "DAY_TRADE", label: "⏱️ 2-6h" },
                { id: "SWING", label: "📅 1-3d" },
              ].map((tf) => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframeFilter(tf.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    timeframeFilter === tf.id
                      ? "bg-accent-purple text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Accuracy Stats Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border text-center">
              <span className="text-[9px] text-slate-500 block font-semibold">WIN RATE</span>
              <span className="text-base font-black text-accent-green">
                {accuracy?.accuracy_win_rate_pct ?? 0}%
              </span>
            </div>
            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border text-center">
              <span className="text-[9px] text-slate-500 block font-semibold">EVALUATED</span>
              <span className="text-base font-black text-white">
                {accuracy?.total_evaluated ?? 0}
              </span>
            </div>
            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border text-center">
              <span className="text-[9px] text-slate-500 block font-semibold">WON / LOST</span>
              <span className="text-base font-black text-accent-cyan">
                {accuracy?.winning_signals ?? 0} / {accuracy?.losing_signals ?? 0}
              </span>
            </div>
            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border text-center">
              <span className="text-[9px] text-slate-500 block font-semibold">ACTIVE</span>
              <span className="text-base font-black text-accent-yellow">
                {accuracy?.active_tracking ?? 0}
              </span>
            </div>
          </div>

          {/* Verified Proof-of-Accuracy Audit Stream */}
          <div className="border border-surface-border rounded-lg overflow-hidden bg-[#0a0d14]">
            <div className="px-3 py-2 bg-[#131926] border-b border-surface-border flex items-center justify-between">
              <span className="font-bold text-white text-xs">Proof-of-Accuracy Real-Market Audit</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetTrackRecord}
                  disabled={resettingRecord}
                  className="flex items-center space-x-1 px-2 py-0.5 bg-accent-red/10 hover:bg-accent-red/20 text-accent-red rounded border border-accent-red/30 text-[10px] font-bold"
                  title="Reset track record and start fresh test"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Reset Log</span>
                </button>
                <button onClick={loadData} className="text-slate-400 hover:text-white">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="divide-y divide-surface-border/50 max-h-[280px] overflow-y-auto">
              {accuracy?.recent_verified_signals && accuracy.recent_verified_signals.length > 0 ? (
                accuracy.recent_verified_signals.map((sig: any) => (
                  <div key={sig.id} className="p-2.5 space-y-1.5 hover:bg-[#111722] text-[11px]">
                    {/* Top line: Symbol, Action, Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-white text-xs">{sig.symbol}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-black ${sig.action === "BUY" ? "bg-accent-green/20 text-accent-green" : "bg-accent-red/20 text-accent-red"}`}>
                          {sig.action}
                        </span>
                        <span className="text-[10px] text-slate-400">{sig.hold_time_label}</span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        sig.status === "HIT_TP"
                          ? "bg-accent-green text-black"
                          : sig.status === "HIT_SL"
                          ? "bg-accent-red text-white"
                          : sig.status === "EXPIRED"
                          ? "bg-slate-700 text-white"
                          : "bg-accent-yellow/20 text-accent-yellow"
                      }`}>
                        {sig.status === "HIT_TP"
                          ? `🎯 WON (+${sig.result_pnl_pct}%)`
                          : sig.status === "HIT_SL"
                          ? `🛑 STOPPED (${sig.result_pnl_pct}%)`
                          : sig.status === "EXPIRED"
                          ? `⏱️ EXPIRED (${sig.result_pnl_pct > 0 ? `+${sig.result_pnl_pct}%` : `${sig.result_pnl_pct}%`})`
                          : "MONITORING ⚡"}
                      </span>
                    </div>

                    {/* Prediction vs Real Market Wicks */}
                    <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#080b10] rounded border border-surface-border/60 text-[10px]">
                      <div>
                        <span className="text-slate-500 block">AI PREDICTION:</span>
                        <span className="text-slate-300">
                          Entry: ${sig.entry_price} • TP: ${sig.take_profit_1} • SL: ${sig.stop_loss}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">REAL BINANCE WICKS:</span>
                        <span className="text-white">
                          High: <strong className="text-accent-green">${sig.highest_price_seen?.toFixed(2)}</strong> • Low: <strong className="text-accent-red">${sig.lowest_price_seen?.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Real-time status note */}
                    <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5">
                      <span>{sig.proof_audit?.real_market_verification || "Monitoring live Binance ticks..."}</span>
                      <span>{sig.evaluated_at ? new Date(sig.evaluated_at * 1000).toLocaleTimeString() : new Date(sig.timestamp * 1000).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500">
                  <p>No verified signals logged yet.</p>
                  <p className="text-[10px] mt-1 text-slate-600">Generate an AI signal to start tracking real-market proof automatically.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Binance & Bybit Live Order Modal */}
      <BinanceOrderModal
        isOpen={isBinanceModalOpen}
        onClose={() => setIsBinanceModalOpen(false)}
        signal={signal}
        symbol={activeSymbol}
        currentPrice={currentPrice}
        userCapital={startingCapital}
      />
    </div>
  );
}
