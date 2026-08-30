"use client";

import React, { useEffect } from "react";
import Header from "@/components/layout/Header";
import GridContainer from "@/components/layout/GridContainer";
import { useTradingStore } from "@/store/useTradingStore";
import { fetchCryptoPrice, fetchStockQuote } from "@/lib/api";

export default function CommandCentreDashboard() {
  const { 
    activeSymbol, 
    isCrypto, 
    updateTickerPrice, 
    setBackendConnected 
  } = useTradingStore();

  // 1. Initial REST Price Fetch & Polling Fallback
  useEffect(() => {
    let isMounted = true;

    async function loadQuote() {
      try {
        if (isCrypto) {
          const data = await fetchCryptoPrice(activeSymbol);
          if (isMounted && data) {
            updateTickerPrice(data.price, 2.45);
            setBackendConnected(true);
          }
        } else {
          const data = await fetchStockQuote(activeSymbol);
          if (isMounted && data) {
            updateTickerPrice(data.price, data.change_pct, data.high, data.low);
            setBackendConnected(true);
          }
        }
      } catch (err) {
        console.warn("Backend connection pending:", err);
      }
    }

    loadQuote();
    const interval = setInterval(loadQuote, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSymbol, isCrypto, updateTickerPrice, setBackendConnected]);

  // 2. WebSocket Real-Time Stream Subscription
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWS() {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8001/ws";
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setBackendConnected(true);
        // Subscribe to active symbol ticks and general signals
        if (isCrypto) {
          ws?.send(
            JSON.stringify({
              action: "subscribe",
              topic: `crypto:${activeSymbol.toLowerCase()}`,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.topic && msg.data?.type === "ticker") {
            const t = msg.data;
            if (t.symbol.toUpperCase() === activeSymbol.toUpperCase()) {
              updateTickerPrice(t.price, t.change_pct_24h, t.high_24h, t.low_24h, t.volume_24h);
            }
          }
        } catch (e) {
          // ignore non-json
        }
      };

      ws.onclose = () => {
        setBackendConnected(false);
        reconnectTimeout = setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [activeSymbol, isCrypto, updateTickerPrice, setBackendConnected]);

  return (
    <main className="flex flex-col min-h-screen bg-[#080b10]">
      <Header />
      <GridContainer />
    </main>
  );
}
