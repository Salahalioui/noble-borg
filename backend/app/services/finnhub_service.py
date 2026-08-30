import httpx
from typing import Dict, List, Any, Optional
from app.core.config import settings
from app.core.cache import cache
from app.core.rate_limiter import rate_limiter

FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

class FinnhubService:
    """Finnhub API integration for real-time US stock quotes, market news, and company profiles."""
    
    def __init__(self):
        self.api_key = settings.FINNHUB_API_KEY

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get real-time quote for US stock symbol."""
        if not self.is_configured():
            return None
            
        symbol_upper = symbol.upper()
        cache_key = f"finnhub:quote:{symbol_upper}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("finnhub", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(
                    f"{FINNHUB_BASE_URL}/quote",
                    params={"symbol": symbol_upper, "token": self.api_key}
                )
                if resp.status_code == 200:
                    d = resp.json()
                    # Finnhub returns: c (current), d (change), dp (percent change), h (high), l (low), o (open), pc (prev close)
                    if d.get("c", 0) > 0:
                        result = {
                            "symbol": symbol_upper,
                            "price": float(d.get("c", 0)),
                            "change": float(d.get("d", 0)),
                            "change_pct": float(d.get("dp", 0)),
                            "high": float(d.get("h", 0)),
                            "low": float(d.get("l", 0)),
                            "open": float(d.get("o", 0)),
                            "prev_close": float(d.get("pc", 0)),
                            "source": "finnhub"
                        }
                        await cache.set(cache_key, result, ttl_seconds=10)
                        return result
        except Exception as e:
            print(f"[FinnhubService] Error getting quote for {symbol}: {e}")
        return None

    async def get_company_news(self, symbol: str, from_date: str, to_date: str) -> List[Dict[str, Any]]:
        """Get company news by ticker."""
        if not self.is_configured():
            return []
            
        cache_key = f"finnhub:news:{symbol}:{from_date}:{to_date}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("finnhub", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{FINNHUB_BASE_URL}/company-news",
                    params={"symbol": symbol.upper(), "from": from_date, "to": to_date, "token": self.api_key}
                )
                if resp.status_code == 200:
                    news = resp.json()
                    await cache.set(cache_key, news, ttl_seconds=120)
                    return news
        except Exception as e:
            print(f"[FinnhubService] Error fetching news: {e}")
        return []

    async def get_market_news(self, category: str = "general") -> List[Dict[str, Any]]:
        """Get top market news."""
        if not self.is_configured():
            return []
            
        cache_key = f"finnhub:marketnews:{category}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("finnhub", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(
                    f"{FINNHUB_BASE_URL}/news",
                    params={"category": category, "token": self.api_key}
                )
                if resp.status_code == 200:
                    news = resp.json()
                    await cache.set(cache_key, news, ttl_seconds=180)
                    return news
        except Exception as e:
            print(f"[FinnhubService] Error fetching market news: {e}")
        return []

finnhub_service = FinnhubService()
