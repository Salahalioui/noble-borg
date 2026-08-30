import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_crypto_price():
    response = client.get("/api/crypto/price?symbol=BTCUSDT")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "BTCUSDT"
    assert data["price"] > 0

def test_crypto_klines():
    response = client.get("/api/crypto/klines?symbol=BTCUSDT&interval=1h&limit=20")
    assert response.status_code == 200
    data = response.json()
    assert len(data["candles"]) > 0
    assert "open" in data["candles"][0]
    assert "close" in data["candles"][0]

def test_crypto_technicals():
    response = client.get("/api/crypto/technicals?symbol=BTCUSDT&interval=1h")
    assert response.status_code == 200
    data = response.json()
    assert "technicals" in data
    assert "rsi_14" in data["technicals"]
    assert "atr_14" in data["technicals"]

def test_stock_quote():
    response = client.get("/api/market/quote?symbol=AAPL")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "AAPL"
    assert data["price"] > 0

def test_news_feed():
    response = client.get("/api/news/feed?query=Bitcoin&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data["news"]) > 0

def test_fear_and_greed():
    response = client.get("/api/news/fear-and-greed")
    assert response.status_code == 200
    data = response.json()
    assert "value" in data
    assert "classification" in data

def test_macro_dashboard():
    response = client.get("/api/macro/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "macro_indicators" in data

def test_polymarket_events():
    response = client.get("/api/macro/polymarket")
    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    assert len(data["events"]) > 0

def test_paper_trading_portfolio_and_orders():
    # 1. Reset balance to micro starting capital
    client.post("/api/paper/reset-balance", json={"new_balance": 50.0})
    res = client.get("/api/paper/portfolio")
    assert res.status_code == 200
    portfolio = res.json()
    assert portfolio["initial_balance"] == 50.0

    # 2. Place a micro BUY order ($6 position)
    order_res = client.post("/api/paper/order", json={
        "symbol": "BTCUSDT",
        "side": "BUY",
        "quantity": 0.0001,
        "current_price": 60000.0
    })
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["success"] is True

    # 3. Check updated portfolio has position
    res_after = client.get("/api/paper/portfolio")
    p_after = res_after.json()
    assert len(p_after["active_positions"]) >= 1

    # 4. Calculate ATR position size
    calc_res = client.post("/api/paper/calculate-position-size", json={
        "entry_price": 60000.0,
        "atr": 1200.0,
        "risk_pct": 0.02
    })
    assert calc_res.status_code == 200
    calc_data = calc_res.json()
    assert "recommended_quantity" in calc_data

def test_market_scanner_opportunities():
    res = client.get("/api/scanner/opportunities")
    assert res.status_code == 200
    data = res.json()
    assert "scanned_assets" in data
    assert "market_breadth" in data

def test_ai_council_debate():
    debate_res = client.post("/api/ai/council-debate", json={
        "symbol": "BTCUSDT",
        "is_crypto": True,
        "user_query": "Check 4H breakout potential",
        "user_capital": 50.0
    })
    assert debate_res.status_code == 200
    debate_data = debate_res.json()
    assert "bull_thesis" in debate_data
    assert "bear_thesis" in debate_data
    assert "cro_verdict" in debate_data
    assert "signal" in debate_data
    assert debate_data["signal"]["action"] in ["BUY", "SELL", "HOLD"]
