"use client";

import React, { useState } from "react";
import { X, TrendingUp, DollarSign, ShieldAlert, Sparkles, Calendar, Zap } from "lucide-react";

interface CompoundGrowthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCapital?: number;
}

export default function CompoundGrowthModal({
  isOpen,
  onClose,
  initialCapital = 50,
}: CompoundGrowthModalProps) {
  const [startingBalance, setStartingBalance] = useState<number>(initialCapital);
  const [weeklyGainPct, setWeeklyGainPct] = useState<number>(3.0); // 3% safe weekly goal
  const [numWeeks, setNumWeeks] = useState<number>(26); // 6 months = 26 weeks

  if (!isOpen) return null;

  // Compound formula: A = P * (1 + r)^n
  const r = weeklyGainPct / 100;
  const finalBalance = startingBalance * Math.pow(1 + r, numWeeks);
  const totalProfit = finalBalance - startingBalance;
  const totalGrowthPct = ((finalBalance - startingBalance) / startingBalance) * 100;

  // Generate week-by-week projection
  const milestones = [4, 8, 12, 16, 26, 52].filter((w) => w <= numWeeks);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-[#0c1017] border border-surface-border w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-4 sm:p-5 font-mono shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-accent-green/15 text-accent-green rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">
                Micro-Account Compound Simulator
              </h2>
              <p className="text-[11px] text-slate-400">
                Safe 2% risk disciplined growth for $10 - $100 accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg bg-[#111722]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-2.5 p-3 bg-[#111722] rounded-xl border border-surface-border">
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Starting Capital</span>
            <div className="flex items-center space-x-1 mt-1">
              {[10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setStartingBalance(amt)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    startingBalance === amt
                      ? "bg-accent-green text-black font-extrabold"
                      : "bg-[#080b10] text-slate-400 hover:text-white"
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Weekly Goal (%)</span>
            <div className="flex items-center space-x-1 mt-1">
              {[2, 3, 5].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setWeeklyGainPct(pct)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    weeklyGainPct === pct
                      ? "bg-accent-cyan text-black font-extrabold"
                      : "bg-[#080b10] text-slate-400 hover:text-white"
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Duration</span>
            <div className="flex items-center space-x-1 mt-1">
              {[
                { w: 12, l: "3 mo" },
                { w: 26, l: "6 mo" },
                { w: 52, l: "1 yr" },
              ].map((d) => (
                <button
                  key={d.w}
                  onClick={() => setNumWeeks(d.w)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    numWeeks === d.w
                      ? "bg-accent-purple text-white font-extrabold"
                      : "bg-[#080b10] text-slate-400 hover:text-white"
                  }`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projection Summary Card */}
        <div className="p-4 bg-gradient-to-br from-accent-green/10 via-[#0d131f] to-accent-cyan/10 rounded-xl border border-accent-green/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-bold">PROJECTED BALANCE:</span>
            <span className="text-2xl font-black text-accent-green">
              ${finalBalance.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border/50 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Total Profit</span>
              <span className="font-bold text-white">+${totalProfit.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Growth</span>
              <span className="font-bold text-accent-cyan">+{totalGrowthPct.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Max 2% Risk</span>
              <span className="font-bold text-accent-yellow">
                ${(startingBalance * 0.02).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Milestones */}
        <div className="space-y-1.5 bg-[#0a0d13] p-3 rounded-xl border border-surface-border max-h-36 overflow-y-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Milestone Timeline ({weeklyGainPct}% weekly compounding)
          </span>
          {milestones.map((wk) => {
            const bal = startingBalance * Math.pow(1 + r, wk);
            return (
              <div key={wk} className="flex items-center justify-between text-xs py-1 border-b border-surface-border/40">
                <span className="text-slate-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-accent-purple" />
                  <span>Week {wk} ({Math.round(wk / 4.3)} months)</span>
                </span>
                <span className="font-bold text-accent-green">${bal.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        {/* Realism & Psychology Note */}
        <div className="p-2.5 bg-[#111722] rounded-lg border border-surface-border text-[11px] text-slate-300 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
          <p>
            <strong>The Micro-Account Truth:</strong> You do NOT need 50x leverage or $10,000 to succeed. Making just <strong>+$1.50 per week</strong> with strict 2% stop-losses compounds safely without ever risking account liquidation!
          </p>
        </div>
      </div>
    </div>
  );
}
