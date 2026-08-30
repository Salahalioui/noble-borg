from fastapi import APIRouter
from app.services.fred_service import fred_service
from app.services.polymarket_service import polymarket_service

router = APIRouter()

@router.get("/dashboard")
async def get_macro_dashboard():
    """Get key macroeconomic indicators: 10Y-2Y Yield Curve, Fed Funds Rate, CPI, GDP, M2."""
    data = await fred_service.get_macro_dashboard()
    return {"macro_indicators": data}

@router.get("/polymarket")
async def get_polymarket_events():
    """Get high-volume prediction market odds for macro and crypto events."""
    events = await polymarket_service.get_macro_and_crypto_events(limit=8)
    return {"events": events}
