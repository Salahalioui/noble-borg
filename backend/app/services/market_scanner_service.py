import asyncio
from typing import Dict, List, Any
from app.services.binance_service import binance_service
from app.services.yfinance_service import yfinance_service
from app.services.quant_engine import quant_engine
from app.core.cache import cache

SCANNER_ASSETS = [
    {"symbol": "BTCUSDT", "is_crypto": True, "name": "Bitcoin"},
    {"symbol": "ETHUSDT", "is_crypto": True, "name": "Ethereum"},
    {"symbol": "SOLUSDT", "is_crypto": True, "name": "Solana"},
    {"symbol": "XRPUSDT", "is_crypto": True, "name": "XRP"},
    {"symbol": "DOGEUSDT", "is_crypto": True, "name": "Dogecoin"},
    {"symbol": "NVDA", "is_crypto": False, "name": "Nvidia"},
    {"symbol": "AAPL", "is_crypto": False, "name": "Apple"},
    {"symbol": "TSLA", "is_crypto": False, "name": "Tesla"},
]

class MarketScannerService:
    """Automated multi-asset opportunity radar that identifies the #1 highest-probability setup of the hour."""

    async def scan_opportunities(self) -> Dict[str, Any]:
        cache_key = "scanner:opportunities:all"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        results = []

        for asset in SCANNER_ASSETS:
            sym = asset["symbol"]
            is_crypto = asset["is_crypto"]

            try:
                if is_crypto:
                    candles = await binance_service.get_klines(sym, interval="1h", limit=50)
                else:
                    candles = await yfinance_service.get_history(sym, period="1mo", interval="1d")

                if not candles or len(candles) < 20:
                    continue

                technicals = quant_engine.compute_indicators(candles)
                price = technicals.get("current_price", 0.0)
                rsi = technicals.get("rsi_14", 50.0)
                trend = technicals.get("trend", "NEUTRAL")
                macd_hist = technicals.get("macd_histogram", 0.0)
                bb_upper = technicals.get("bb_upper", price * 1.05)
                bb_lower = technicals.get("bb_lower", price * 0.95)
                fvgs = technicals.get("recent_fvgs", [])

                # Calculate Opportunity Score (0 to 100)
                score = 50
                badge = "💤 CHOP / SIT ON HANDS"
                color = "slate"
                action_bias = "HOLD CASH"

                # Bullish Setup Evaluation
                if trend == "BULLISH":
                    if 45 <= rsi <= 62 and macd_hist > 0:
                        score = 88
                        badge = "🚀 HIGH EDGE BULLISH"
                        color = "green"
                        action_bias = "BUY / LONG"
                    elif rsi > 70:
                        score = 40
                        badge = "⚠️ OVERBOUGHT TOP"
                        color = "yellow"
                        action_bias = "WAIT FOR PULLBACK"
                    else:
                        score = 68
                        badge = "📈 MILD MOMENTUM"
                        color = "cyan"
                        action_bias = "WATCHLIST"
                elif trend == "BEARISH":
                    if rsi < 35:
                        score = 65
                        badge = "⚡ OVERSOLD BOUNCE"
                        color = "purple"
                        action_bias = "SCALP BOUNCE"
                    else:
                        score = 30
                        badge = "🔴 DOWNTREND DANGER"
                        color = "red"
                        action_bias = "AVOID"

                # Check for active support FVG
                has_bull_fvg = any(f.get("type") == "BULLISH_FVG" for f in fvgs)
                if has_bull_fvg and trend == "BULLISH":
                    score = min(score + 8, 96)

                results.append({
                    "symbol": sym,
                    "name": asset["name"],
                    "is_crypto": is_crypto,
                    "current_price": price,
                    "rsi": rsi,
                    "trend": trend,
                    "opportunity_score": score,
                    "badge": badge,
                    "badge_color": color,
                    "action_bias": action_bias,
                    "key_catalyst": f"RSI {rsi:.1f} • {trend} Trend" + (" • Active FVG Support" if has_bull_fvg else "")
                })

            except Exception as e:
                print(f"[MarketScannerService] Error scanning {sym}: {e}")

        # Sort by highest opportunity score
        results.sort(key=lambda x: x["opportunity_score"], reverse=True)

        top_pick = results[0] if results else None
        bullish_count = sum(1 for r in results if r["trend"] == "BULLISH")
        bearish_count = sum(1 for r in results if r["trend"] == "BEARISH")
        neutral_count = len(results) - (bullish_count + bearish_count)

        payload = {
            "top_pick": top_pick,
            "scanned_assets": results,
            "market_breadth": {
                "total_scanned": len(results),
                "bullish": bullish_count,
                "bearish": bearish_count,
                "choppy": neutral_count,
                "market_sentiment": "FAVORABLE FOR SELECTIVE LONGS" if bullish_count > bearish_count else "DEFENSIVE / PREFER CASH"
            }
        }

        await cache.set(cache_key, payload, ttl_seconds=60)  # Cache 1 minute
        return payload

market_scanner_service = MarketScannerService()
