import httpx
from typing import Dict, List, Any, Optional
from app.core.cache import cache
from app.core.rate_limiter import rate_limiter

DEFILLAMA_BASE_URL = "https://api.llama.fi"

class DefiLlamaService:
    """Zero-key DeFi intelligence: TVL rankings, top protocols, chains, and stablecoin pegs."""

    async def get_top_protocols(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Fetch top DeFi protocols by Total Value Locked (TVL)."""
        cache_key = f"defillama:protocols:{limit}"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        await rate_limiter.acquire("defillama", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{DEFILLAMA_BASE_URL}/protocols")
                if resp.status_code == 200:
                    protocols = resp.json()
                    formatted = []
                    for p in protocols[:limit]:
                        formatted.append({
                            "name": p.get("name"),
                            "symbol": p.get("symbol"),
                            "category": p.get("category"),
                            "chains": p.get("chains", [])[:3],
                            "tvl": float(p.get("tvl", 0) or 0),
                            "change_1d": float(p.get("change_1d", 0) or 0),
                            "change_7d": float(p.get("change_7d", 0) or 0),
                            "mcap": float(p.get("mcap", 0) or 0) if p.get("mcap") else None,
                            "url": p.get("url")
                        })
                    await cache.set(cache_key, formatted, ttl_seconds=300)  # Cache 5m
                    return formatted
        except Exception as e:
            print(f"[DefiLlamaService] Error fetching protocols: {e}")
        return []

    async def get_chains_tvl(self) -> List[Dict[str, Any]]:
        """Fetch TVL distribution across major blockchains (Ethereum, Solana, Tron, BSC, Arbitrum, Base)."""
        cache_key = "defillama:chains_tvl"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        await rate_limiter.acquire("defillama", cost=1.0)
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{DEFILLAMA_BASE_URL}/v2/chains")
                if resp.status_code == 200:
                    chains = resp.json()
                    # Sort by TVL descending
                    chains_sorted = sorted(chains, key=lambda x: x.get("tvl", 0), reverse=True)[:10]
                    formatted = [
                        {
                            "name": c.get("name"),
                            "tvl": float(c.get("tvl", 0) or 0),
                            "tokenSymbol": c.get("tokenSymbol")
                        }
                        for c in chains_sorted
                    ]
                    await cache.set(cache_key, formatted, ttl_seconds=300)
                    return formatted
        except Exception as e:
            print(f"[DefiLlamaService] Error fetching chains TVL: {e}")
        return []

defillama_service = DefiLlamaService()
