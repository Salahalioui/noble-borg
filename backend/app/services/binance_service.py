import httpx
import asyncio
import json
import websockets
from typing import Dict, List, Any, Optional
from app.core.cache import cache
from app.core.rate_limiter import rate_limiter
from app.core.websocket_manager import ws_manager

BINANCE_ENDPOINTS = [
    "https://data-api.binance.vision/api/v3",
    "https://api.binance.com/api/v3",
    "https://api1.binance.com/api/v3",
    "https://api3.binance.com/api/v3"
]
BINANCE_WS_URL = "wss://stream.binance.com:9443/ws"

class BinanceService:
    """High-speed Crypto data provider leveraging public Binance REST & WebSockets."""
    
    def __init__(self):
        self._ws_task: Optional[asyncio.Task] = None
        self._tracked_symbols = ["btcusdt", "ethusdt", "solusdt", "bnbusdt", "xrpusdt", "dogeusdt"]

    async def get_ticker_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Fetch current spot price with multi-endpoint cloud fallback."""
        symbol_upper = symbol.upper()
        cache_key = f"binance:price:{symbol_upper}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("binance", cost=1.0)
        async with httpx.AsyncClient(timeout=6.0) as client:
            for base_url in BINANCE_ENDPOINTS:
                try:
                    resp = await client.get(f"{base_url}/ticker/price", params={"symbol": symbol_upper})
                    if resp.status_code == 200:
                        data = resp.json()
                        result = {
                            "symbol": data["symbol"],
                            "price": float(data["price"]),
                            "timestamp": int(asyncio.get_event_loop().time() * 1000)
                        }
                        await cache.set(cache_key, result, ttl_seconds=3)
                        return result
                except Exception:
                    continue
        return None

    async def get_24hr_ticker(self, symbol: Optional[str] = None) -> Any:
        """Fetch 24-hour ticker statistics including price change, high, low, volume."""
        cache_key = f"binance:24hr:{symbol or 'all'}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("binance", cost=1.0)
        async with httpx.AsyncClient(timeout=8.0) as client:
            params = {"symbol": symbol.upper()} if symbol else {}
            for base_url in BINANCE_ENDPOINTS:
                try:
                    resp = await client.get(f"{base_url}/ticker/24hr", params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        await cache.set(cache_key, data, ttl_seconds=10)
                        return data
                except Exception:
                    continue
        return None

    async def get_order_book(self, symbol: str, limit: int = 50) -> Optional[Dict[str, Any]]:
        """Fetch Level-2 Order Book depth with cloud fallback."""
        symbol_upper = symbol.upper()
        cache_key = f"binance:depth:{symbol_upper}:{limit}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("binance", cost=2.0)
        async with httpx.AsyncClient(timeout=6.0) as client:
            for base_url in BINANCE_ENDPOINTS:
                try:
                    resp = await client.get(f"{base_url}/depth", params={"symbol": symbol_upper, "limit": limit})
                    if resp.status_code == 200:
                        data = resp.json()
                        result = {
                            "symbol": symbol_upper,
                            "lastUpdateId": data["lastUpdateId"],
                            "bids": [[float(price), float(qty)] for price, qty in data["bids"]],
                            "asks": [[float(price), float(qty)] for price, qty in data["asks"]]
                        }
                        await cache.set(cache_key, result, ttl_seconds=2)
                        return result
                except Exception:
                    continue
        return None

    async def get_klines(self, symbol: str, interval: str = "1h", limit: int = 200) -> List[Dict[str, Any]]:
        """Fetch OHLCV candlestick historical data."""
        symbol_upper = symbol.upper()
        cache_key = f"binance:klines:{symbol_upper}:{interval}:{limit}"
        cached = await cache.get(cache_key)
        if cached:
            return cached
            
        await rate_limiter.acquire("binance", cost=2.0)
        async with httpx.AsyncClient(timeout=8.0) as client:
            for base_url in BINANCE_ENDPOINTS:
                try:
                    resp = await client.get(
                        f"{base_url}/klines", 
                        params={"symbol": symbol_upper, "interval": interval, "limit": limit}
                    )
                    if resp.status_code == 200:
                        raw_candles = resp.json()
                        formatted = []
                        for c in raw_candles:
                            formatted.append({
                                "time": int(c[0] / 1000),
                                "open": float(c[1]),
                                "high": float(c[2]),
                                "low": float(c[3]),
                                "close": float(c[4]),
                                "volume": float(c[5])
                            })
                        await cache.set(cache_key, formatted, ttl_seconds=15)
                        return formatted
                except Exception:
                    continue
        return []

    async def start_ws_stream(self):
        """Starts background WebSocket streaming for top crypto assets and pushes to frontend WS manager."""
        streams = "/".join([f"{s}@ticker/{s}@depth20@100ms" for s in self._tracked_symbols])
        url = f"wss://stream.binance.com:9443/stream?streams={streams}"
        
        while True:
            try:
                async with websockets.connect(url, ping_interval=20, ping_timeout=10) as ws:
                    print(f"[Binance WS] Connected to public stream: {url}")
                    while True:
                        msg = await ws.recv()
                        data = json.loads(msg)
                        stream_name = data.get("stream", "")
                        payload = data.get("data", {})
                        
                        if "@ticker" in stream_name:
                            symbol = payload.get("s", "")
                            live_price = float(payload.get("c", 0))
                            
                            # Live AI signal accuracy verification
                            from app.services.paper_trade_service import paper_trade_service
                            paper_trade_service.evaluate_signals_against_price(symbol, live_price)

                            tick = {
                                "type": "ticker",
                                "symbol": symbol,
                                "price": live_price,
                                "change_pct_24h": float(payload.get("P", 0)),
                                "high_24h": float(payload.get("h", 0)),
                                "low_24h": float(payload.get("l", 0)),
                                "volume_24h": float(payload.get("v", 0)),
                                "timestamp": payload.get("E")
                            }
                            await ws_manager.publish_to_topic(f"crypto:{symbol.lower()}", tick)
                            await ws_manager.publish_to_topic("crypto:all", tick)
                            
                        elif "@depth" in stream_name:
                            symbol = stream_name.split("@")[0].upper()
                            depth_data = {
                                "type": "depth",
                                "symbol": symbol,
                                "bids": [[float(p), float(q)] for p, q in payload.get("bids", [])],
                                "asks": [[float(p), float(q)] for p, q in payload.get("asks", [])]
                            }
                            await ws_manager.publish_to_topic(f"depth:{symbol.lower()}", depth_data)
            except Exception as e:
                print(f"[Binance WS] Stream error, reconnecting in 5s: {e}")
                await asyncio.sleep(5)

binance_service = BinanceService()
