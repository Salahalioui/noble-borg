from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from app.services.binance_service import binance_service
from app.services.dexscreener_service import dexscreener_service
from app.services.defillama_service import defillama_service
from app.services.quant_engine import quant_engine

router = APIRouter()

@router.get("/price")
async def get_crypto_price(symbol: str = Query("BTCUSDT")):
    """Get real-time spot price from Binance."""
    price = await binance_service.get_ticker_price(symbol)
    if not price:
        raise HTTPException(status_code=404, detail=f"Price not found for {symbol}")
    return price

@router.get("/24hr")
async def get_24hr_stats(symbol: Optional[str] = Query(None)):
    """Get 24-hour statistics (high, low, volume, % change)."""
    stats = await binance_service.get_24hr_ticker(symbol)
    if not stats:
        raise HTTPException(status_code=404, detail="Stats unavailable")
    return stats

@router.get("/depth")
async def get_order_book_depth(symbol: str = Query("BTCUSDT"), limit: int = Query(50, le=100)):
    """Get Level-2 Order Book Depth (bids and asks)."""
    depth = await binance_service.get_order_book(symbol, limit)
    if not depth:
        raise HTTPException(status_code=404, detail=f"Depth unavailable for {symbol}")
    return depth

@router.get("/klines")
async def get_crypto_klines(
    symbol: str = Query("BTCUSDT"),
    interval: str = Query("1h", description="1m, 5m, 15m, 1h, 4h, 1d"),
    limit: int = Query(200, le=500)
):
    """Get crypto OHLCV candlestick historical data for TradingView charts."""
    candles = await binance_service.get_klines(symbol, interval, limit)
    return {"symbol": symbol.upper(), "interval": interval, "count": len(candles), "candles": candles}

@router.get("/technicals")
async def get_crypto_technicals(symbol: str = Query("BTCUSDT"), interval: str = Query("1h")):
    """Compute technical indicators (RSI, MACD, BBands, EMAs, ATR, FVGs) for crypto pair."""
    candles = await binance_service.get_klines(symbol, interval, limit=200)
    if not candles:
        raise HTTPException(status_code=400, detail="Insufficient candle data")
    technicals = quant_engine.compute_indicators(candles)
    return {"symbol": symbol.upper(), "technicals": technicals}

@router.get("/dex/trending")
async def get_dex_trending(chain: str = Query("solana")):
    """Get trending DEX pairs via DEXScreener (e.g. solana, ethereum, base)."""
    clean_chain = chain.lower().replace("usdt", "").strip()
    if clean_chain in ["sol", "solana"]:
        target_chain = "solana"
    elif clean_chain in ["eth", "ethereum"]:
        target_chain = "ethereum"
    elif clean_chain in ["base"]:
        target_chain = "base"
    else:
        target_chain = "solana"
    
    pairs = await dexscreener_service.search_pairs(target_chain)
    return {"chain": target_chain, "count": len(pairs), "pairs": pairs}

@router.get("/dex/search")
async def search_dex_pairs(query: str = Query(..., description="Token name or contract address (e.g. PEPE, SOL, WIF)")):
    """Search multi-chain DEX pairs (Solana, Base, Ethereum, BSC) via DEXScreener."""
    pairs = await dexscreener_service.search_pairs(query)
    return {"query": query, "count": len(pairs), "pairs": pairs}

@router.get("/defi/protocols")
async def get_defi_protocols(limit: int = Query(15, le=50)):
    """Get top DeFi protocols by TVL via DefiLlama."""
    protocols = await defillama_service.get_top_protocols(limit)
    return {"protocols": protocols}

@router.get("/defi/chains")
async def get_defi_chains():
    """Get multi-chain TVL distribution via DefiLlama."""
    chains = await defillama_service.get_chains_tvl()
    return {"chains": chains}
