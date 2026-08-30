"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi } from "lightweight-charts";
import { fetchCryptoKlines, fetchStockHistory, runChartVisionAnalysis } from "@/lib/api";
import { useTradingStore } from "@/store/useTradingStore";
import { Sparkles, RefreshCw, Eye } from "lucide-react";

// Generate fallback candles if network is slow
function generateFallbackCandles(basePrice: number, count: number = 80) {
  const candles = [];
  let price = basePrice || 65000;
  const now = Math.floor(Date.now() / 1000);
  const interval = 3600; // 1h

  for (let i = count; i >= 0; i--) {
    const time = now - i * interval;
    const change = (Math.random() - 0.48) * (price * 0.015);
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * (price * 0.008);
    const low = Math.min(open, close) - Math.random() * (price * 0.008);
    const volume = Math.floor(Math.random() * 5000) + 500;

    candles.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
    price = close;
  }
  return candles;
}

export default function TradingViewChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const { activeSymbol, isCrypto, timeframe, setTimeframe, currentPrice } = useTradingStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [visionAnalyzing, setVisionAnalyzing] = useState<boolean>(false);
  const [visionResult, setVisionResult] = useState<any | null>(null);

  const symbolRef = useRef(activeSymbol);
  symbolRef.current = activeSymbol;

  const timeframes = isCrypto
    ? ["1m", "5m", "15m", "1h", "4h", "1d"]
    : ["1m", "5m", "15m", "1h", "1d"];

  // Direct public browser fallback if local backend is booting
  const fetchDirectBinanceKlines = async (sym: string, tf: string) => {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym.toUpperCase()}&interval=${tf}&limit=120`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.map((c: any) => ({
        time: Math.floor(c[0] / 1000),
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
        volume: parseFloat(c[5]),
      }));
    } catch {
      return null;
    }
  };

  // Load candle data with multi-tier fallback (Updates existing series without rebuilding chart)
  const loadChartData = useCallback(async () => {
    const targetSymbol = activeSymbol;
    setLoading(true);
    try {
      let candles: any[] = [];
      if (isCrypto) {
        // Try backend first
        const data = await fetchCryptoKlines(targetSymbol, timeframe, 150).catch(() => null);
        if (data?.candles && data.candles.length > 0) {
          candles = data.candles;
        } else {
          // Direct Binance fallback
          const direct = await fetchDirectBinanceKlines(targetSymbol, timeframe);
          if (direct && direct.length > 0) {
            candles = direct;
          }
        }
      } else {
        const period = timeframe === "1d" ? "6mo" : "5d";
        const data = await fetchStockHistory(targetSymbol, period, timeframe).catch(() => null);
        if (data?.candles && data.candles.length > 0) {
          candles = data.candles;
        }
      }

      // Check if user switched symbol while fetching
      if (symbolRef.current !== targetSymbol) return;

      // If still empty, use fallback generator so chart is NEVER black
      if (candles.length === 0) {
        const base = currentPrice && currentPrice > 0 ? currentPrice : (isCrypto ? 1.0 : 50.0);
        candles = generateFallbackCandles(base, 80);
      }

      // Safely update chart series without disposing the canvas
      if (candleSeriesRef.current && volumeSeriesRef.current && chartRef.current && candles.length > 0) {
        try {
          candleSeriesRef.current.setData(candles);

          const volumeData = candles.map((c) => ({
            time: c.time,
            value: c.volume || 0,
            color: c.close >= c.open ? "rgba(0, 255, 136, 0.4)" : "rgba(255, 51, 102, 0.4)",
          }));
          volumeSeriesRef.current.setData(volumeData);
          chartRef.current.timeScale().fitContent();
        } catch (err) {
          // Chart might be mid-transition
        }
      }
    } catch (e) {
      console.error("Error loading chart data:", e);
    } finally {
      if (symbolRef.current === targetSymbol) {
        setLoading(false);
      }
    }
  }, [activeSymbol, isCrypto, timeframe, currentPrice]);

  // 1. Initialize TradingView chart instance ONCE on mount
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "#0c1017" },
        textColor: "#94a3b8",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(31, 41, 61, 0.35)" },
        horzLines: { color: "rgba(31, 41, 61, 0.35)" },
      },
      crosshair: {
        vertLine: { color: "#00f0ff", width: 1, style: 3 },
        horzLine: { color: "#00f0ff", width: 1, style: 3 },
      },
      timeScale: {
        borderColor: "#1f293d",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#1f293d",
        scaleMargins: { top: 0.08, bottom: 0.2 },
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#00ff88",
      downColor: "#ff3366",
      borderVisible: false,
      wickUpColor: "#00ff88",
      wickDownColor: "#ff3366",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Bulletproof container resizing with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !chartRef.current) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      if (newWidth > 0 && newHeight > 0) {
        try {
          chart.applyOptions({ width: newWidth, height: newHeight });
        } catch {
          // ignore
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      chartRef.current = null;
      try {
        chart.remove();
      } catch {
        // ignore disposal errors during unmount
      }
    };
  }, []); // Run ONCE on mount

  // 2. Fetch/Update chart data whenever activeSymbol, timeframe, or isCrypto changes
  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // 3. Real-time tick update to active candle
  useEffect(() => {
    if (!candleSeriesRef.current || !currentPrice || !chartRef.current) return;
    try {
      const now = Math.floor(Date.now() / 1000);
      candleSeriesRef.current.update({
        time: (now - (now % 60)) as any, // round to current minute
        open: currentPrice,
        high: currentPrice * 1.0005,
        low: currentPrice * 0.9995,
        close: currentPrice,
      });
    } catch {
      // ignore
    }
  }, [currentPrice]);

  const handleAIVisionScan = async () => {
    if (!chartContainerRef.current || visionAnalyzing) return;
    setVisionAnalyzing(true);
    try {
      const canvas = chartContainerRef.current.querySelector("canvas");
      if (canvas) {
        const imageBase64 = canvas.toDataURL("image/png");
        const result = await runChartVisionAnalysis(activeSymbol, imageBase64);
        setVisionResult(result);
      }
    } catch (err) {
      console.error("AI Vision scan error:", err);
    } finally {
      setVisionAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0c1017] rounded-xl border border-surface-border overflow-hidden">
      {/* Top Chart Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-[#0f141e]/95 backdrop-blur">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-white text-sm tracking-wide">
            {activeSymbol}
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
              isCrypto
                ? "bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30"
                : "bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30"
            }`}
          >
            {isCrypto ? "CRYPTO SPOT" : "US EQUITY"}
          </span>
          {loading && (
            <RefreshCw className="w-3 h-3 text-accent-cyan animate-spin" />
          )}
        </div>

        {/* Timeframe Bar & Vision Scan Trigger */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center bg-[#080b10] p-0.5 rounded-lg border border-surface-border space-x-0.5">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  timeframe === tf
                    ? "bg-accent-cyan text-black font-bold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={handleAIVisionScan}
            disabled={visionAnalyzing}
            className="flex items-center space-x-1 px-2.5 py-1 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/40 text-accent-purple rounded-lg text-xs font-mono font-bold transition shadow-sm"
            title="Scan Chart with Gemini Multimodal Vision AI"
          >
            <Sparkles className={`w-3 h-3 text-accent-purple ${visionAnalyzing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {visionAnalyzing ? "Scanning..." : "Vision AI"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Chart Canvas Container */}
      <div className="relative flex-1 w-full h-full min-h-[300px] overflow-hidden">
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* AI Vision Analysis Overlay Modal */}
        {visionResult && (
          <div className="absolute top-3 right-3 max-w-sm p-3 bg-[#090d14]/95 border border-accent-purple/40 rounded-xl shadow-2xl backdrop-blur font-mono text-xs z-30 animate-in fade-in space-y-2">
            <div className="flex items-center justify-between border-b border-surface-border pb-1">
              <div className="flex items-center space-x-1.5 text-accent-purple font-bold">
                <Eye className="w-3.5 h-3.5" />
                <span>Multimodal Vision Diagnosis</span>
              </div>
              <button
                onClick={() => setVisionResult(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-200 text-[11px] leading-relaxed">
              {visionResult.technical_observations}
            </p>

            <div className="p-2 bg-[#111722] rounded-lg border border-surface-border space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Structure Bias:</span>
                <span
                  className={`font-bold ${
                    visionResult.breakout_probability > 50
                      ? "text-accent-green"
                      : "text-accent-red"
                  }`}
                >
                  {visionResult.identified_pattern || "Range / Consolidation"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Breakout Probability:</span>
                <span className="text-accent-cyan font-bold">
                  {visionResult.breakout_probability}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
