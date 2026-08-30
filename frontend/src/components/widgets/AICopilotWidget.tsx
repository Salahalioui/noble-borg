"use client";

import React, { useState } from "react";
import { runAICouncilDebate } from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { Bot, Sparkles, TrendingUp, TrendingDown, ShieldAlert, Send, CheckCircle2 } from "lucide-react";

export default function AICopilotWidget() {
  const { activeSymbol, isCrypto, aiDebateResult, setAIDebateResult, isDebatingAI, setIsDebatingAI } = useTradingStore();
  const [query, setQuery] = useState("");

  const handleTriggerDebate = async (customQuery?: string) => {
    setIsDebatingAI(true);
    try {
      let chartImage: string | undefined = undefined;
      const canvas = document.querySelector("canvas");
      if (canvas) {
        try {
          chartImage = canvas.toDataURL("image/jpeg", 0.75);
        } catch {
          // ignore cross-origin
        }
      }
      const result = await runAICouncilDebate(activeSymbol, isCrypto, customQuery || query, 50.0, chartImage);
      setAIDebateResult(result);
    } catch (err) {
      console.error("AI Council Debate error:", err);
    } finally {
      setIsDebatingAI(false);
    }
  };

  const signal = aiDebateResult?.signal;

  return (
    <div className="flex flex-col h-full bg-[#0c1017] rounded-lg border border-surface-border overflow-hidden text-xs font-mono">
      {/* Widget Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-[#0f141e]/90">
        <div className="flex items-center space-x-2 text-slate-200 font-semibold">
          <Bot className="w-4 h-4 text-accent-purple" />
          <span>AI Multi-Agent Council</span>
        </div>
        <button
          onClick={() => handleTriggerDebate()}
          disabled={isDebatingAI}
          className="flex items-center space-x-1 px-2 py-0.5 bg-accent-purple/20 hover:bg-accent-purple/30 text-accent-purple rounded border border-accent-purple/40 text-[11px] font-bold transition"
        >
          <Sparkles className={`w-3 h-3 ${isDebatingAI ? "animate-spin" : ""}`} />
          <span>{isDebatingAI ? "Debating..." : "Debate Setup"}</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        {!aiDebateResult && !isDebatingAI ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 text-slate-400 space-y-2">
            <Bot className="w-8 h-8 text-accent-purple/60" />
            <p className="text-xs">
              Trigger the Tri-Agent Council to debate the Bull Case vs Bear Case and calculate risk-adjusted signals for{" "}
              <span className="text-white font-bold">{activeSymbol}</span>.
            </p>
            <button
              onClick={() => handleTriggerDebate()}
              className="px-3 py-1.5 bg-gradient-to-r from-accent-purple to-accent-cyan text-black font-bold rounded shadow text-xs mt-2 hover:opacity-90 transition"
            >
              Start Council Debate
            </button>
          </div>
        ) : isDebatingAI ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3 text-accent-cyan">
            <Sparkles className="w-6 h-6 animate-spin text-accent-purple" />
            <div className="text-center space-y-1">
              <p className="font-bold text-white">Tri-Agent Council in Session...</p>
              <p className="text-[11px] text-slate-400">Bull & Bear Analysts debating order flow & technicals</p>
            </div>
          </div>
        ) : (
          <>
            {/* Standardized Signal Card */}
            {signal && (
              <div
                className={`p-3 rounded-lg border ${
                  signal.action === "BUY"
                    ? "bg-accent-green/10 border-accent-green/40"
                    : signal.action === "SELL"
                    ? "bg-accent-red/10 border-accent-red/40"
                    : "bg-slate-800/40 border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        signal.action === "BUY"
                          ? "bg-accent-green text-black"
                          : signal.action === "SELL"
                          ? "bg-accent-red text-white"
                          : "bg-slate-600 text-white"
                      }`}
                    >
                      {signal.action} SIGNAL
                    </span>
                    <span className="text-slate-300 font-bold">
                      Confidence: {signal.confidence_score}%
                    </span>
                  </div>
                  <span className="text-accent-cyan font-bold bg-[#080b10] px-2 py-0.5 rounded border border-accent-cyan/30">
                    R:R {signal.risk_reward_ratio}
                  </span>
                </div>

                {/* Price targets grid */}
                <div className="grid grid-cols-3 gap-2 text-[11px] bg-[#070a0f] p-2 rounded border border-surface-border">
                  <div>
                    <span className="text-slate-500 block text-[9px]">STOP LOSS</span>
                    <span className="text-accent-red font-bold">${signal.stop_loss}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">TARGET 1</span>
                    <span className="text-accent-green font-bold">${signal.take_profit_1}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">TARGET 2</span>
                    <span className="text-accent-green font-bold">${signal.take_profit_2}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tri-Agent Council Debate Perspectives */}
            <div className="space-y-2">
              {/* Bull Analyst */}
              <div className="p-2.5 rounded bg-[#111722] border border-accent-green/20">
                <div className="flex items-center space-x-1.5 text-accent-green font-bold mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Bull Analyst Thesis</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{aiDebateResult.bull_thesis}</p>
              </div>

              {/* Bear Analyst */}
              <div className="p-2.5 rounded bg-[#111722] border border-accent-red/20">
                <div className="flex items-center space-x-1.5 text-accent-red font-bold mb-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Bear Analyst Thesis</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{aiDebateResult.bear_thesis}</p>
              </div>

              {/* Chief Risk Officer */}
              <div className="p-2.5 rounded bg-[#111722] border border-accent-purple/30">
                <div className="flex items-center space-x-1.5 text-accent-purple font-bold mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Chief Risk Officer Synthesis</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{aiDebateResult.cro_verdict}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Interactive Query Bar */}
      <div className="p-2 border-t border-surface-border bg-[#0f141e]/90 flex items-center space-x-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleTriggerDebate(query)}
          placeholder="Ask AI Copilot (e.g. 'Evaluate 4H pullback risk')..."
          className="flex-1 bg-[#080b10] border border-surface-border rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent-purple"
        />
        <button
          onClick={() => handleTriggerDebate(query)}
          disabled={isDebatingAI}
          className="p-1.5 bg-accent-purple text-white rounded hover:bg-accent-purple/80 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
