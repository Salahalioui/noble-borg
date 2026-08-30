import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.endpoints import market, crypto, macro, news, ai, paper_trade, diagnostics, scanner, discovery
from app.api import websocket as ws_router
from app.services.binance_service import binance_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background streaming tasks and backfill offline signal evaluations
    print(f"[STARTUP] Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    ws_task = asyncio.create_task(binance_service.start_ws_stream())
    asyncio.create_task(paper_trade.paper_trade_service.backfill_offline_signals())
    yield
    # Shutdown: Cancel background tasks
    print("[SHUTDOWN] Shutting down background streaming tasks...")
    ws_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(market.router, prefix="/api/market", tags=["TradFi & Stocks"])
app.include_router(crypto.router, prefix="/api/crypto", tags=["Crypto & DEX"])
app.include_router(macro.router, prefix="/api/macro", tags=["Macro & Prediction Markets"])
app.include_router(news.router, prefix="/api/news", tags=["News & Sentiment"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI Council & Vision Copilot"])
app.include_router(paper_trade.router, prefix="/api/paper", tags=["Paper Trading"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["Market Scanner & Opportunity Radar"])
app.include_router(discovery.router, prefix="/api/discovery", tags=["Discovery & Screener"])
app.include_router(diagnostics.router, prefix="/api/diagnostics", tags=["System Diagnostics"])
app.include_router(ws_router.router, tags=["WebSocket Stream Hub"])

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "ai_configured": bool(settings.GEMINI_API_KEY),
        "finnhub_configured": bool(settings.FINNHUB_API_KEY),
        "fred_configured": bool(settings.FRED_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
