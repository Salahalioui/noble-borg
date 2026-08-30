from fastapi import APIRouter
from app.services.discovery_service import discovery_service

router = APIRouter()

@router.get("/categories")
async def get_discovery_categories():
    """Discover high-volatility micro gems, affordable growth stocks (<$50), and trending tokens for small wallets."""
    return await discovery_service.get_all_categories()
