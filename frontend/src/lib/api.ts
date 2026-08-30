const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export async function fetchCryptoPrice(symbol: string = "BTCUSDT") {
  const sym = symbol.toUpperCase();
  // 1. Direct Ultra-Fast Public Binance Vision CDN (~50ms)
  try {
    const res = await fetch(`https://data-api.binance.vision/api/v3/ticker/24hr?symbol=${sym}`);
    if (res.ok) {
      const data = await res.json();
      return {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        change_pct_24h: parseFloat(data.priceChangePercent),
        high_24h: parseFloat(data.highPrice),
        low_24h: parseFloat(data.lowPrice),
        volume_24h: parseFloat(data.volume),
        timestamp: data.closeTime
      };
    }
  } catch {
    // continue to backend
  }

  // 2. Backend Fallback
  const res = await fetch(`${BACKEND_URL}/api/crypto/price?symbol=${sym}`);
  if (!res.ok) throw new Error(`Failed to fetch crypto price: ${res.statusText}`);
  return res.json();
}

export async function fetchCryptoKlines(symbol: string = "BTCUSDT", interval: string = "1h", limit: number = 200) {
  const sym = symbol.toUpperCase();
  // 1. Direct Ultra-Fast Public Binance Vision CDN (~60ms)
  try {
    const res = await fetch(`https://data-api.binance.vision/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
    if (res.ok) {
      const raw = await res.json();
      if (Array.isArray(raw) && raw.length > 0) {
        const candles = raw.map((c: any) => ({
          time: Math.floor(c[0] / 1000),
          open: parseFloat(c[1]),
          high: parseFloat(c[2]),
          low: parseFloat(c[3]),
          close: parseFloat(c[4]),
          volume: parseFloat(c[5])
        }));
        return { symbol: sym, interval, count: candles.length, candles };
      }
    }
  } catch {
    // continue to backend
  }

  // 2. Backend Fallback
  const res = await fetch(`${BACKEND_URL}/api/crypto/klines?symbol=${sym}&interval=${interval}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch klines");
  return res.json();
}

export async function fetchCryptoDepth(symbol: string = "BTCUSDT", limit: number = 50) {
  const sym = symbol.toUpperCase();
  // 1. Direct Ultra-Fast Public Binance Vision CDN (~50ms)
  try {
    const res = await fetch(`https://data-api.binance.vision/api/v3/depth?symbol=${sym}&limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.bids && data?.asks) {
        return {
          symbol: sym,
          lastUpdateId: data.lastUpdateId,
          bids: data.bids.map((b: any) => [parseFloat(b[0]), parseFloat(b[1])]),
          asks: data.asks.map((a: any) => [parseFloat(a[0]), parseFloat(a[1])])
        };
      }
    }
  } catch {
    // continue to backend
  }

  // 2. Backend Fallback
  const res = await fetch(`${BACKEND_URL}/api/crypto/depth?symbol=${sym}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch depth");
  return res.json();
}

export async function fetchCryptoTechnicals(symbol: string = "BTCUSDT", interval: string = "1h") {
  const res = await fetch(`${BACKEND_URL}/api/crypto/technicals?symbol=${symbol}&interval=${interval}`);
  if (!res.ok) throw new Error("Failed to fetch technicals");
  return res.json();
}

export async function fetchStockQuote(symbol: string = "AAPL") {
  const res = await fetch(`${BACKEND_URL}/api/market/quote?symbol=${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch stock quote");
  return res.json();
}

export async function fetchStockHistory(symbol: string, period: string = "1mo", interval: string = "1d") {
  const res = await fetch(`${BACKEND_URL}/api/market/history?symbol=${symbol}&period=${period}&interval=${interval}`);
  if (!res.ok) throw new Error("Failed to fetch stock history");
  return res.json();
}

export async function fetchNewsFeed(query: string = "stock market crypto", limit: number = 15) {
  const res = await fetch(`${BACKEND_URL}/api/news/feed?query=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch news feed");
  return res.json();
}

export async function fetchRedditBuzz(subreddit: string = "wallstreetbets", limit: number = 10) {
  const res = await fetch(`${BACKEND_URL}/api/news/reddit?subreddit=${subreddit}&limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch Reddit buzz");
  return res.json();
}

export async function fetchFearAndGreed() {
  const res = await fetch(`${BACKEND_URL}/api/news/fear-and-greed`);
  if (!res.ok) throw new Error("Failed to fetch Fear and Greed");
  return res.json();
}

export async function fetchMacroDashboard() {
  const res = await fetch(`${BACKEND_URL}/api/macro/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch macro dashboard");
  return res.json();
}

export async function fetchPolymarketEvents() {
  const res = await fetch(`${BACKEND_URL}/api/macro/polymarket`);
  if (!res.ok) throw new Error("Failed to fetch polymarket");
  return res.json();
}

export async function fetchDEXTrending(chain: string = "solana") {
  const res = await fetch(`${BACKEND_URL}/api/crypto/dex/trending?chain=${chain}`);
  if (!res.ok) throw new Error("Failed to fetch DEX trending");
  return res.json();
}

export async function fetchDeFiProtocols() {
  const res = await fetch(`${BACKEND_URL}/api/crypto/defi/protocols`);
  if (!res.ok) throw new Error("Failed to fetch DeFi protocols");
  return res.json();
}

export async function runAICouncilDebate(
  symbol: string, 
  isCrypto: boolean = true, 
  userQuery?: string, 
  userCapital: number = 50.0
) {
  const res = await fetch(`${BACKEND_URL}/api/ai/council-debate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      symbol, 
      is_crypto: isCrypto, 
      user_query: userQuery,
      user_capital: userCapital 
    }),
  });
  if (!res.ok) throw new Error("Failed to run AI Council debate");
  const data = await res.json();
  // Automatically record signal into accuracy tracker
  if (data?.signal && data.signal.action !== "HOLD") {
    recordAISignal(data).catch(() => null);
  }
  return data;
}

export async function runChartVisionAnalysis(symbol: string, imageBase64: string) {
  const res = await fetch(`${BACKEND_URL}/api/ai/vision-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, image_base64: imageBase64 }),
  });
  if (!res.ok) throw new Error("Failed to run vision analysis");
  return res.json();
}

export async function fetchPaperPortfolio() {
  const res = await fetch(`${BACKEND_URL}/api/paper/portfolio`);
  if (!res.ok) throw new Error("Failed to fetch portfolio");
  return res.json();
}

export async function executePaperOrder(order: {
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  current_price: number;
  stop_loss?: number;
  take_profit?: number;
}) {
  const res = await fetch(`${BACKEND_URL}/api/paper/order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Order failed" }));
    throw new Error(err.detail || "Order execution failed");
  }
  return res.json();
}

export async function calculateATRSizing(entryPrice: number, atr: number, riskPct: number = 0.02) {
  const res = await fetch(`${BACKEND_URL}/api/paper/calculate-position-size`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry_price: entryPrice, atr, risk_pct: riskPct }),
  });
  if (!res.ok) throw new Error("Failed to calculate position size");
  return res.json();
}

export async function recordAISignal(signalPayload: any) {
  const res = await fetch(`${BACKEND_URL}/api/paper/record-signal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(signalPayload),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchAIAccuracyScorecard(timeframe?: string) {
  const url = timeframe && timeframe !== "ALL"
    ? `${BACKEND_URL}/api/paper/ai-accuracy?timeframe=${timeframe}`
    : `${BACKEND_URL}/api/paper/ai-accuracy`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch AI accuracy");
  return res.json();
}

export async function resetAITrackRecord() {
  const res = await fetch(`${BACKEND_URL}/api/paper/reset-ai-signals`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reset AI track record");
  return res.json();
}

export async function resetPaperBalance(newBalance: number = 50.0) {
  const res = await fetch(`${BACKEND_URL}/api/paper/reset-balance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_balance: newBalance }),
  });
  if (!res.ok) throw new Error("Failed to reset balance");
  return res.json();
}

export async function fetchSystemDiagnostics() {
  const res = await fetch(`${BACKEND_URL}/api/diagnostics/status`);
  if (!res.ok) throw new Error("Failed to fetch diagnostics");
  return res.json();
}

export async function fetchMarketOpportunities() {
  const res = await fetch(`${BACKEND_URL}/api/scanner/opportunities`);
  if (!res.ok) throw new Error("Failed to fetch market opportunities");
  return res.json();
}

export async function closePaperPosition(symbol: string, currentPrice: number) {
  const res = await fetch(`${BACKEND_URL}/api/paper/close-position`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, current_price: currentPrice }),
  });
  if (!res.ok) throw new Error("Failed to close position");
  return res.json();
}

export async function scalePaperPosition(symbol: string, scalePct: number = 0.5, currentPrice: number = 0) {
  const res = await fetch(`${BACKEND_URL}/api/paper/scale-position`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, scale_pct: scalePct, current_price: currentPrice }),
  });
  if (!res.ok) throw new Error("Failed to scale position");
  return res.json();
}

export async function lockBreakeven(symbol: string) {
  const res = await fetch(`${BACKEND_URL}/api/paper/lock-breakeven`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  if (!res.ok) throw new Error("Failed to lock breakeven");
  return res.json();
}

export async function fetchDiscoveryCategories() {
  const res = await fetch(`${BACKEND_URL}/api/discovery/categories`);
  if (!res.ok) throw new Error("Failed to fetch discovery categories");
  return res.json();
}

