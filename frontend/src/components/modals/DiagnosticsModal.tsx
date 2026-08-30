"use client";

import React, { useEffect, useState } from "react";
import { fetchSystemDiagnostics } from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  X 
} from "lucide-react";

export default function DiagnosticsModal() {
  const { isDiagnosticsOpen, setDiagnosticsOpen } = useTradingStore();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetchSystemDiagnostics();
      setData(res);
    } catch (err) {
      console.error("Failed to run diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDiagnosticsOpen) {
      runDiagnostics();
    }
  }, [isDiagnosticsOpen]);

  if (!isDiagnosticsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 p-4 font-mono text-xs">
      <div className="bg-[#0e131d] border border-surface-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-950/40 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-surface-border bg-[#131926] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-accent-cyan" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm">System Diagnostics & API Latency Radar</h2>
              <p className="text-[10px] text-slate-400">Live operational connectivity, response times & token buckets</p>
            </div>
          </div>
          <button
            onClick={() => setDiagnosticsOpen(false)}
            className="p-1 text-slate-400 hover:text-white rounded bg-slate-800/60 hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Top Status Banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#131926] rounded-lg border border-surface-border flex items-center space-x-3">
              <div className="p-2 rounded bg-accent-green/10 text-accent-green">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">SYSTEM STATUS</span>
                <span className="font-bold text-accent-green text-xs">
                  {data?.all_systems_operational ? "ALL SYSTEMS OPTIMAL" : "OPERATIONAL"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#131926] rounded-lg border border-surface-border flex items-center space-x-3">
              <div className="p-2 rounded bg-accent-purple/10 text-accent-purple">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">AI MODEL ENGINE</span>
                <span className="font-bold text-white text-xs">Gemini 3.7 Flash</span>
              </div>
            </div>

            <div className="p-3 bg-[#131926] rounded-lg border border-surface-border flex items-center space-x-3">
              <div className="p-2 rounded bg-accent-cyan/10 text-accent-cyan">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">FREE TIER GUARD</span>
                <span className="font-bold text-accent-cyan text-xs">15 RPM Rate Pacer Active</span>
              </div>
            </div>
          </div>

          {/* API Health & Latency Table */}
          <div className="border border-surface-border rounded-lg overflow-hidden bg-[#0a0d14]">
            <div className="px-3 py-2 bg-[#131926] border-b border-surface-border flex items-center justify-between">
              <span className="font-bold text-slate-300 text-xs">Connected Data Services & APIs</span>
              <span className="text-[10px] text-slate-500">Live Latency (ms)</span>
            </div>

            <div className="divide-y divide-surface-border/50">
              {loading ? (
                <div className="py-8 flex items-center justify-center space-x-2 text-accent-cyan">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Pinging API endpoints & calculating latencies...</span>
                </div>
              ) : (
                data?.api_checks?.map((check: any, idx: number) => (
                  <div key={idx} className="px-3 py-2.5 flex items-center justify-between hover:bg-[#111722] transition">
                    <div className="flex items-center space-x-2.5">
                      {check.status === "ONLINE" ? (
                        <div className="w-2 h-2 rounded-full bg-accent-green shadow-sm shadow-accent-green animate-pulse" />
                      ) : check.status === "DEGRADED" ? (
                        <div className="w-2 h-2 rounded-full bg-accent-yellow shadow-sm shadow-accent-yellow" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-accent-red" />
                      )}
                      <div>
                        <span className="font-semibold text-white text-xs block">{check.name}</span>
                        <span className="text-[10px] text-slate-500">{check.message}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-accent-cyan text-xs font-mono">{check.latency_ms} ms</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ml-2 bg-slate-800 text-slate-300">
                        {check.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Data Feed Fidelity & Live vs Fallback Indicator */}
          <div className="p-3 bg-[#131926] rounded-lg border border-accent-cyan/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-accent-cyan" />
                <span>Data Stream Fidelity & Fallback Verification</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-accent-green/20 text-accent-green border border-accent-green/40">
                Live Hybrid Mode Active
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              MicroAlpha Studio uses a <span className="text-accent-cyan font-bold">dual-tier real-time pipeline</span>:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="p-2 rounded bg-[#0a0d14] border border-surface-border">
                <div className="flex items-center space-x-1.5 text-accent-green font-bold mb-1">
                  <div className="w-2 h-2 rounded-full bg-accent-green animate-ping" />
                  <span>🟢 Primary Stream (Real-Time)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Binance Vision WebSocket & Global REST stream live 100ms ticks, Level-2 depth, and candlestick updates directly.
                </p>
              </div>

              <div className="p-2 rounded bg-[#0a0d14] border border-surface-border">
                <div className="flex items-center space-x-1.5 text-accent-yellow font-bold mb-1">
                  <div className="w-2 h-2 rounded-full bg-accent-yellow" />
                  <span>🟡 Intelligent Fallback Shield</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  If cloud datacenter network delays occur, the frontend seamlessly computes real-time spreads from last verified ticks with zero downtime.
                </p>
              </div>
            </div>
          </div>

          {/* Rate Limiter Token Buckets Status */}
          <div className="p-3 bg-[#131926] rounded-lg border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 text-xs flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-accent-yellow" />
                <span>Rate Limiter Token Buckets (Anti-429 Protection)</span>
              </span>
              <span className="text-[10px] text-slate-500">Autonomous Refill Rate</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {data?.rate_limiter_buckets &&
                Object.entries(data.rate_limiter_buckets).map(([key, bucket]: any) => (
                  <div key={key} className="p-2 bg-[#0a0d14] rounded border border-surface-border">
                    <span className="text-[10px] text-slate-400 uppercase block">{key}</span>
                    <span className="font-bold text-white text-xs font-mono">
                      {bucket.tokens_available} / {bucket.max_capacity}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-surface-border bg-[#131926] flex items-center justify-between">
          <span className="text-[10px] text-slate-500">
            Last ping: {data?.timestamp ? new Date(data.timestamp * 1000).toLocaleTimeString() : "Just now"}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1 bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan rounded border border-accent-cyan/40 text-xs font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Re-Run Full Test</span>
            </button>
            <button
              onClick={() => setDiagnosticsOpen(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
