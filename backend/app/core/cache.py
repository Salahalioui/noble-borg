import time
import asyncio
from typing import Any, Optional, Dict

class MemoryCache:
    """High-performance async in-memory cache with per-key TTL (Time-To-Live)."""
    
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        
    async def get(self, key: str) -> Optional[Any]:
        async with self._lock:
            entry = self._cache.get(key)
            if not entry:
                return None
            if time.time() > entry["expires_at"]:
                del self._cache[key]
                return None
            return entry["value"]

    async def set(self, key: str, value: Any, ttl_seconds: int = 60) -> None:
        async with self._lock:
            self._cache[key] = {
                "value": value,
                "expires_at": time.time() + ttl_seconds
            }

    async def delete(self, key: str) -> None:
        async with self._lock:
            if key in self._cache:
                del self._cache[key]

    async def clear(self) -> None:
        async with self._lock:
            self._cache.clear()

    async def cleanup_expired(self) -> int:
        async with self._lock:
            now = time.time()
            expired_keys = [k for k, v in self._cache.items() if now > v["expires_at"]]
            for k in expired_keys:
                del self._cache[k]
            return len(expired_keys)

# Global singleton cache
cache = MemoryCache()
