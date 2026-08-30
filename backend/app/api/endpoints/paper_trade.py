import time
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.paper_trade_service import paper_trade_service


router = APIRouter()

class OrderRequest(BaseModel):
    symbol: str
    side: str  # "BUY" or "SELL"
    quantity: float
    current_price: float
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None

class PositionSizeRequest(BaseModel):
    entry_price: float
    atr: float
    risk_pct: float = 0.02

class ResetAccountRequest(BaseModel):
    new_balance: float = 50.0

class ClosePositionRequest(BaseModel):
    symbol: str
    current_price: float

class ScalePositionRequest(BaseModel):
    symbol: str
    scale_pct: float = 0.5
    current_price: float

class LockBreakevenRequest(BaseModel):
    symbol: str

@router.get("/portfolio")
async def get_portfolio():
    """Get paper trading portfolio summary (Cash, Equity, P&L, Win Rate, Positions)."""
    return paper_trade_service.get_portfolio_summary()

@router.post("/order")
async def place_order(order: OrderRequest):
    """Place a simulated paper trade."""
    result = paper_trade_service.execute_order(
        symbol=order.symbol,
        side=order.side,
        quantity=order.quantity,
        current_price=order.current_price,
        stop_loss=order.stop_loss,
        take_profit=order.take_profit
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Order failed"))
    return result

@router.post("/close-position")
async def close_position(req: ClosePositionRequest):
    """Close an active position at market price."""
    result = paper_trade_service.close_position_manually(req.symbol, req.current_price)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to close position"))
    return result

@router.post("/scale-position")
async def scale_position(req: ScalePositionRequest):
    """Scale out a percentage (e.g. 50%) of an active position."""
    result = paper_trade_service.scale_out_position(req.symbol, req.scale_pct, req.current_price)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to scale position"))
    return result

@router.post("/lock-breakeven")
async def lock_breakeven(req: LockBreakevenRequest):
    """Move Stop Loss to Entry price immediately."""
    result = paper_trade_service.lock_breakeven_manually(req.symbol)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Failed to lock breakeven"))
    return result

@router.post("/calculate-position-size")
async def calculate_position_size(req: PositionSizeRequest):
    """Calculate optimal ATR position size based on micro-portfolio risk tolerance."""
    sizing = paper_trade_service.calculate_atr_position_size(
        entry_price=req.entry_price,
        atr=req.atr,
        risk_pct=req.risk_pct
    )
    return sizing

@router.post("/record-signal")
async def record_ai_signal(payload: Dict[str, Any]):
    """Record an AI trade signal into the verification journal to track hit rate."""
    return paper_trade_service.record_ai_signal(payload)

@router.get("/ai-accuracy")
async def get_ai_accuracy(timeframe: Optional[str] = Query(None, description="ALL | ULTRA_SCALP | SCALP | DAY_TRADE | SWING")):
    """Get AI accuracy scorecard and proof-of-accuracy audit trails."""
    return paper_trade_service.get_ai_accuracy_scorecard(timeframe_filter=timeframe)

@router.post("/reset-balance")
async def reset_balance(req: ResetAccountRequest):
    """Reset virtual account starting balance ($10, $50, etc.)."""
    return paper_trade_service.reset_account(new_balance=req.new_balance)

@router.post("/reset-ai-signals")
async def reset_ai_signals():
    """Reset AI signal verification history to start fresh."""
    return paper_trade_service.reset_ai_signals()

@router.get("/report/pdf")
async def download_performance_pdf():
    """Generate and download a comprehensive, verified AI Performance Audit PDF report."""
    from fastapi.responses import Response
    from app.services.pdf_report_service import pdf_report_service
    try:
        pdf_bytes = pdf_report_service.generate_performance_pdf()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=MicroAlpha_AI_Performance_Report_{int(time.time())}.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {e}")

