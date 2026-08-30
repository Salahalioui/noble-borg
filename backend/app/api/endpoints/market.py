from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from app.services.finnhub_service import finnhub_service
from app.services.yfinance_service import yfinance_service
from app.services.quant_engine import quant_engine

router = APIRouter()

@router.get("/quote")
async def get_market_quote(symbol: str = Query(..., description="Stock or Asset Symbol, e.g. AAPL, NVDA, TSLA, SPY")):
    """Get real-time stock quote with automated Finnhub -> yfinance fallback."""
    quote = None
    if finnhub_service.is_configured():
        quote = await finnhub_service.get_quote(symbol)
        
    if not quote:
        quote = await yfinance_service.get_quote(symbol)
        
    if not quote:
        raise HTTPException(status_code=404, detail=f"Quote not found for symbol {symbol}")
        
    return quote

@router.get("/history")
async def get_market_history(
    symbol: str = Query(..., description="Stock Symbol"),
    period: str = Query("1mo", description="Period (1d, 5d, 1mo, 3mo, 6mo, 1y)"),
    interval: str = Query("1d", description="Candle interval (1m, 5m, 15m, 1h, 1d)")
):
    """Get historical OHLCV candlestick bars formatted for TradingView charts."""
    candles = await yfinance_service.get_history(symbol=symbol, period=period, interval=interval)
    return {"symbol": symbol.upper(), "count": len(candles), "candles": candles}

@router.get("/fundamentals")
async def get_market_fundamentals(symbol: str = Query(...)):
    """Get valuation ratios, Market Cap, P/E, 52-week ranges, and business summary."""
    data = await yfinance_service.get_fundamentals(symbol)
    if not data:
        raise HTTPException(status_code=404, detail=f"Fundamentals not found for {symbol}")
    return data

@router.get("/technicals")
async def get_market_technicals(
    symbol: str = Query(...),
    period: str = Query("3mo"),
    interval: str = Query("1d")
):
    """Compute technical indicators (RSI, MACD, Bollinger Bands, ATR, S/R, Fair Value Gaps)."""
    candles = await yfinance_service.get_history(symbol=symbol, period=period, interval=interval)
    if not candles:
        raise HTTPException(status_code=400, detail="Unable to retrieve candles for technical analysis")
        
    technicals = quant_engine.compute_indicators(candles)
    return {"symbol": symbol.upper(), "technicals": technicals}
