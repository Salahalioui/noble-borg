import httpx
from typing import Dict, List, Any, Optional
from app.core.cache import cache
from app.core.rate_limiter import rate_limiter

DEXSCREENER_BASE_URL = "https://api.dexscreener.com/latest/dex"

class DEXScreenerService:
    """Zero-key on-chain DEX pairs, liquidity pools, and trending meme/DeFi tokens."""

    async def search_pairs(self, query: str) -> List[Dict[str, Any]]:
        """Search for token pairs across all DEXes (Solana, Base, Ethereum, BSC, etc.)."""
        cache_key = f"dex:search:{query.lower()}"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        await rate_limiter.acquire("dexscreener", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{DEXSCREENER_BASE_URL}/search", params={"q": query})
                if resp.status_code == 200:
                    data = resp.json()
                    pairs = data.get("pairs", []) or []
                    formatted = []
                    for p in pairs[:20]:
                        formatted.append({
                            "chainId": p.get("chainId"),
                            "dexId": p.get("dexId"),
                            "pairAddress": p.get("pairAddress"),
                            "baseToken": p.get("baseToken", {}),
                            "quoteToken": p.get("quoteToken", {}),
                            "priceUsd": float(p.get("priceUsd", 0) or 0),
                            "priceChange24h": float(p.get("priceChange", {}).get("h24", 0) or 0),
                            "priceChange1h": float(p.get("priceChange", {}).get("h1", 0) or 0),
                            "volume24h": float(p.get("volume", {}).get("h24", 0) or 0),
                            "liquidityUsd": float(p.get("liquidity", {}).get("usd", 0) or 0),
                            "fdv": float(p.get("fdv", 0) or 0),
                            "txns24h": p.get("txns", {}).get("h24", {})
                        })
                    await cache.set(cache_key, formatted, ttl_seconds=20)
                    return formatted
        except Exception as e:
            print(f"[DEXScreenerService] Error searching pairs for {query}: {e}")
        return []

    async def get_token_pairs(self, chain_id: str, token_address: str) -> List[Dict[str, Any]]:
        """Get all trading pairs for a specific token address on a given chain."""
        cache_key = f"dex:token:{chain_id}:{token_address}"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        await rate_limiter.acquire("dexscreener", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(f"{DEXSCREENER_BASE_URL}/tokens/{token_address}")
                if resp.status_code == 200:
                    data = resp.json()
                    pairs = data.get("pairs", []) or []
                    await cache.set(cache_key, pairs, ttl_seconds=15)
                    return pairs
        except Exception as e:
            print(f"[DEXScreenerService] Error fetching token pairs: {e}")
        return []

dexscreener_service = DEXScreenerService()
