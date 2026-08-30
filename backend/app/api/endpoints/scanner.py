from fastapi import APIRouter
from app.services.market_scanner_service import market_scanner_service

router = APIRouter()

@router.get("/opportunities")
async def get_market_opportunities():
    """Scan top crypto and stock assets to identify the #1 highest-probability setup of the hour."""
    return await market_scanner_service.scan_opportunities()
