import time
import asyncio
from typing import Dict

class TokenBucketRateLimiter:
    """Async Token Bucket Rate Limiter to protect free-tier API quotas and pace requests."""
    
    def __init__(self):
        # Configuration: {provider_name: (max_tokens, refill_rate_per_sec)}
        self._limits: Dict[str, tuple[float, float]] = {
            "gemini": (15.0, 15.0/60.0),    # 15 requests per minute (Free Tier protection)
            "finnhub": (60.0, 1.0),         # 60 requests per minute (1 per sec)
            "fred": (120.0, 2.0),           # 120 requests per minute (2 per sec)
            "dexscreener": (300.0, 5.0),    # 300 requests per minute
            "defillama": (300.0, 5.0),      # 300 requests per minute
            "marketaux": (100.0, 100.0/86400.0), # 100 requests per day
            "binance": (1200.0, 20.0),      # 1200 weight per minute
            "reddit": (60.0, 1.0)           # 60 requests per minute
        }
        
        # State: {provider_name: {"tokens": float, "last_refill": float}}
        self._buckets: Dict[str, Dict[str, float]] = {}
        self._lock = asyncio.Lock()
        
        # Initialize buckets
        now = time.time()
        for provider, (capacity, _) in self._limits.items():
            self._buckets[provider] = {
                "tokens": capacity,
                "last_refill": now
            }

    async def acquire(self, provider: str, cost: float = 1.0, wait: bool = True) -> bool:
        """Acquire token for provider. If wait is True, sleeps until token is available."""
        if provider not in self._limits:
            return True
            
        capacity, refill_rate = self._limits[provider]
        
        while True:
            async with self._lock:
                now = time.time()
                bucket = self._buckets[provider]
                
                # Refill tokens based on elapsed time
                elapsed = now - bucket["last_refill"]
                bucket["tokens"] = min(capacity, bucket["tokens"] + (elapsed * refill_rate))
                bucket["last_refill"] = now
                
                if bucket["tokens"] >= cost:
                    bucket["tokens"] -= cost
                    return True
                
                if not wait:
                    return False
                    
                # Calculate sleep duration needed for 1 token
                missing_tokens = cost - bucket["tokens"]
                sleep_time = missing_tokens / refill_rate
            
            await asyncio.sleep(min(sleep_time, 2.0))

rate_limiter = TokenBucketRateLimiter()
