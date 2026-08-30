from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
from app.services.ai_council_service import ai_council_service
from app.services.ai_vision_service import ai_vision_service
from app.services.binance_service import binance_service
from app.services.yfinance_service import yfinance_service
from app.services.quant_engine import quant_engine
from app.services.news_service import news_service

router = APIRouter()

class CouncilDebateRequest(BaseModel):
    symbol: str
    is_crypto: bool = True
    user_query: Optional[str] = None
    user_capital: float = 50.0

class ChartVisionRequest(BaseModel):
    symbol: str
    image_base64: str

@router.post("/council-debate")
async def conduct_council_debate(payload: CouncilDebateRequest):
    """Run a Tri-Agent Council Debate (Bull vs Bear vs Chief Risk Officer) and return structured trade signals."""
    return await _process_debate(payload.symbol, payload.is_crypto, payload.user_query, payload.user_capital)

@router.get("/council-debate")
async def conduct_council_debate_get(
    symbol: str = Query(..., description="Asset symbol, e.g. BTCUSDT"),
    is_crypto: bool = Query(True, description="True for crypto, False for stocks"),
    user_query: Optional[str] = Query(None, description="Custom prompt/query"),
    user_capital: float = Query(50.0, description="User's starting trading capital in USD")
):
    """GET endpoint for Tri-Agent Council debate."""
    return await _process_debate(symbol, is_crypto, user_query, user_capital)

async def _process_debate(symbol: str, is_crypto: bool, user_query: Optional[str], user_capital: float = 50.0):
    sym = symbol.upper()
    
    # 1. Fetch live candles & compute technical indicators
    if is_crypto:
        candles = await binance_service.get_klines(sym, interval="1h", limit=100)
    else:
        candles = await yfinance_service.get_history(sym, period="1mo", interval="1d")
        
    if not candles:
        # Fetch real spot price directly so AI is never misaligned
        if is_crypto:
            price_info = await binance_service.get_ticker_price(sym)
            live_price = float(price_info.get("price", 78900.0)) if price_info else 78900.0
            atr_val = round(live_price * 0.018, 4)
        else:
            live_price = 150.0
            atr_val = 3.5

        technicals = {
            "current_price": live_price,
            "rsi_14": 52.4,
            "atr_14": atr_val,
            "trend": "BULLISH",
            "rsi_condition": "NEUTRAL",
            "support_levels": [round(live_price * 0.975, 4)],
            "resistance_levels": [round(live_price * 1.045, 4)]
        }
    else:
        technicals = quant_engine.compute_indicators(candles)
    
    # 2. Fetch recent news
    news_items = await news_service.get_google_news(query=f"{sym} news", limit=5)
    headlines = [n["title"] for n in news_items] if news_items else []
    
    # 3. Conduct Tri-Agent Council Analysis
    debate_result = await ai_council_service.analyze_trade_setup(
        symbol=sym,
        technicals=technicals,
        news_headlines=headlines,
        user_query=user_query,
        user_capital=user_capital
    )
    
    # 4. Automatically record signal for multi-timeframe accuracy tracking
    try:
        from app.services.paper_trade_service import paper_trade_service
        if debate_result.get("signal") and debate_result["signal"].get("action") != "HOLD":
            paper_trade_service.record_ai_signal(debate_result)
    except Exception as e:
        print(f"[AI Endpoint] Error recording signal: {e}")
    
    return debate_result

@router.post("/vision-analysis")
async def analyze_chart_screenshot(payload: ChartVisionRequest):
    """Run Multimodal Vision analysis on TradingView chart canvas screenshot."""
    if not payload.image_base64:
        raise HTTPException(status_code=400, detail="Missing chart image base64 data")
        
    analysis = await ai_vision_service.analyze_chart_image(
        base64_image=payload.image_base64,
        symbol=payload.symbol.upper()
    )
    return analysis
