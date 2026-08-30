from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "MicroAlpha Studio by Salah Alioui"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Server configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = True
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
        "*"
    ]
    
    # AI API Keys
    GEMINI_API_KEY: str = ""
    
    # TradFi API Keys
    FINNHUB_API_KEY: str = ""
    FRED_API_KEY: str = ""
    MARKETAUX_API_KEY: str = ""
    
    # Notification Integrations
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    DISCORD_WEBHOOK_URL: str = ""
    
    # Paper Trading Defaults (Micro-account friendly: $10 - $100)
    DEFAULT_PAPER_BALANCE: float = 100.0
    MAX_RISK_PER_TRADE_PCT: float = 0.02
    MIN_RISK_REWARD_RATIO: float = 2.0
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
