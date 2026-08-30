import asyncio
import yfinance as yf
import pandas as pd
from typing import Dict, List, Any, Optional
from app.core.cache import cache

class YFinanceService:
    """Zero-key TradFi data engine for global equities, historical candles, and fundamentals."""
    
    async def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch quote via yfinance in async executor thread."""
        symbol_upper = symbol.upper()
        cache_key = f"yf:quote:{symbol_upper}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        def _fetch():
            ticker = yf.Ticker(symbol_upper)
            fast_info = ticker.fast_info
            price = fast_info.last_price
            prev_close = fast_info.previous_close
            if not price or pd.isna(price):
                hist = ticker.history(period="2d")
                if not hist.empty:
                    price = float(hist["Close"].iloc[-1])
                    prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else price
                else:
                    return None
                    
            change = float(price - prev_close) if prev_close else 0.0
            change_pct = float((change / prev_close) * 100) if prev_close else 0.0
            
            return {
                "symbol": symbol_upper,
                "price": round(float(price), 2),
                "change": round(change, 2),
                "change_pct": round(change_pct, 2),
                "high": round(float(fast_info.day_high or price), 2),
                "low": round(float(fast_info.day_low or price), 2),
                "open": round(float(fast_info.open or price), 2),
                "prev_close": round(float(prev_close or price), 2),
                "volume": int(fast_info.last_volume or 0),
                "source": "yfinance"
            }

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, _fetch)
            if result:
                await cache.set(cache_key, result, ttl_seconds=15)
                return result
        except Exception as e:
            print(f"[YFinanceService] Error fetching quote for {symbol}: {e}")
        return None

    async def get_history(self, symbol: str, period: str = "1mo", interval: str = "1d") -> List[Dict[str, Any]]:
        """Fetch OHLCV candles formatted for TradingView Lightweight Charts.
        Valid periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max
        Valid intervals: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo
        """
        symbol_upper = symbol.upper()
        cache_key = f"yf:hist:{symbol_upper}:{period}:{interval}"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        def _fetch():
            ticker = yf.Ticker(symbol_upper)
            df = ticker.history(period=period, interval=interval)
            if df.empty:
                return []
                
            bars = []
            for index, row in df.iterrows():
                # Format timestamp in UNIX seconds
                timestamp = int(index.timestamp())
                bars.append({
                    "time": timestamp,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]) if "Volume" in row else 0
                })
            return bars

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, _fetch)
            if result:
                await cache.set(cache_key, result, ttl_seconds=60)
                return result
        except Exception as e:
            print(f"[YFinanceService] Error fetching history for {symbol}: {e}")
        return []

    async def get_fundamentals(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch key fundamental valuation and company ratios."""
        symbol_upper = symbol.upper()
        cache_key = f"yf:fundamentals:{symbol_upper}"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        def _fetch():
            ticker = yf.Ticker(symbol_upper)
            info = ticker.info
            if not info:
                return None
            return {
                "symbol": symbol_upper,
                "name": info.get("shortName") or info.get("longName"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "forward_pe": info.get("forwardPE"),
                "peg_ratio": info.get("pegRatio"),
                "dividend_yield": info.get("dividendYield"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                "target_mean_price": info.get("targetMeanPrice"),
                "recommendation": info.get("recommendationKey"),
                "beta": info.get("beta"),
                "summary": info.get("longBusinessSummary")
            }

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, _fetch)
            if result:
                await cache.set(cache_key, result, ttl_seconds=3600 * 6)  # Cache 6h
                return result
        except Exception as e:
            print(f"[YFinanceService] Error fetching fundamentals for {symbol}: {e}")
        return None

yfinance_service = YFinanceService()
