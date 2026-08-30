import time
import asyncio
from fastapi import APIRouter
from typing import Dict, Any, List
from app.core.config import settings
from app.core.cache import cache
from app.core.rate_limiter import rate_limiter
from app.services.binance_service import binance_service
from app.services.finnhub_service import finnhub_service
from app.services.fred_service import fred_service
from app.services.dexscreener_service import dexscreener_service
from app.services.defillama_service import defillama_service
from app.services.news_service import news_service
from app.services.polymarket_service import polymarket_service
from app.services.ai_council_service import ai_council_service

router = APIRouter()

@router.get("/status")
async def get_system_diagnostics() -> Dict[str, Any]:
    """Runs a live latency and connectivity diagnostic check across all configured APIs."""
    
    async def check_api(name: str, check_coro) -> Dict[str, Any]:
        start = time.time()
        try:
            if asyncio.iscoroutinefunction(check_coro):
                res = await check_coro()
            elif callable(check_coro):
                res = check_coro()
                if asyncio.iscoroutine(res):
                    res = await res
            else:
                res = check_coro
            latency_ms = round((time.time() - start) * 1000, 1)
            ok = bool(res is not None and res != [] and res != {})
            return {
                "name": name,
                "status": "ONLINE" if ok else "DEGRADED",
                "latency_ms": latency_ms,
                "message": "Operational" if ok else "Returned empty or fallback"
            }
        except Exception as e:
            latency_ms = round((time.time() - start) * 1000, 1)
            return {
                "name": name,
                "status": "ERROR",
                "latency_ms": latency_ms,
                "message": str(e)[:60]
            }

    async def check_gemini():
        return "Operational" if ai_council_service.is_configured() else "Offline"

    async def check_finnhub():
        if finnhub_service.is_configured():
            return await finnhub_service.get_quote("AAPL")
        return "Fallback yfinance"

    # Run checks in parallel
    results = await asyncio.gather(
        check_api("Binance Crypto WebSocket & REST", binance_service.get_ticker_price("BTCUSDT")),
        check_api("Finnhub US Equities API", check_finnhub),
        check_api("FRED Macroeconomic API", fred_service.get_series_observations("T10Y2Y", limit=2)),
        check_api("Google AI Studio (Gemini 3.7 Flash)", check_gemini),
        check_api("DEXScreener Multi-Chain API", dexscreener_service.search_pairs("SOL")),
        check_api("DefiLlama TVL API", defillama_service.get_chains_tvl()),
        check_api("Google News RSS Feed", news_service.get_google_news("bitcoin", limit=2)),
        check_api("Polymarket Prediction Odds", polymarket_service.get_macro_and_crypto_events(limit=2)),
        return_exceptions=True
    )

    formatted_checks = []
    for r in results:
        if isinstance(r, dict):
            formatted_checks.append(r)
        else:
            formatted_checks.append({
                "name": "Service Check",
                "status": "ERROR",
                "latency_ms": 0,
                "message": str(r)[:60]
            })

    # Rate limiter bucket states
    buckets = {}
    for k, v in rate_limiter._buckets.items():
        buckets[k] = {
            "tokens_available": round(v["tokens"], 1),
            "max_capacity": rate_limiter._limits.get(k, (0, 0))[0]
        }

    return {
        "timestamp": time.time(),
        "all_systems_operational": all(c["status"] == "ONLINE" for c in formatted_checks),
        "api_checks": formatted_checks,
        "rate_limiter_buckets": buckets,
        "active_keys": {
            "gemini_3.7_flash": bool(settings.GEMINI_API_KEY),
            "finnhub": bool(settings.FINNHUB_API_KEY),
            "fred": bool(settings.FRED_API_KEY)
        }
    }
