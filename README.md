# ⚡ MicroAlpha Studio: AI Trading Command Centre & Micro-Account Growth Sandbox
*Crafted by Salah Alioui*

![MicroAlpha Studio Header](https://img.shields.io/badge/Status-Production%20Ready-00f0ff?style=for-the-badge)
![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![Gemini AI](https://img.shields.io/badge/Gemini%20AI-2.5%20Flash-8E75B2?style=for-the-badge&logo=google)
![Binance](https://img.shields.io/badge/Binance-Live%20Stream-F3BA2F?style=for-the-badge&logo=binance)

MicroAlpha Studio is an institutional-grade, AI-assisted multi-asset trading command centre designed by **Salah Alioui** specifically to empower **both complete beginners starting with small accounts ($10–$100)** and advanced traders.

---

## 🌟 Key Features

### 1. 🤖 3-Agent AI Council Debate
* **Bull Analyst**: Identifies high-probability breakout momentum, chart patterns, and Fair Value Gaps (FVG).
* **Bear Risk Officer**: Evaluates counter-trend traps, overbought RSI levels, macro headwinds, and liquidation risks.
* **Chief Risk Officer (CRO)**: Delivers a brutal, mathematically honest verdict with exact **Entry**, **Take-Profit (TP)**, **Stop-Loss (SL)**, and **Risk:Reward ratio (minimum 1:2)**.
* **Strict 2% Safe Risk Limit**: Calibrated for realistic starting accounts ($10 to $100 baseline), preventing account blowups.

### 2. ⚡ Micro-Cap Asset Discovery ($10–$50 Ready)
* **The Reality of Small Capital**: On a $10 account, Bitcoin (+3% move) only yields +$0.30 profit.
* **The Solution**: Surfaces high-momentum, low unit-price assets that capture **+5% to +18% moves** while strictly capping dollar risk at **$1.00**:
  * ⚡ **Micro Gems**: SUI, NEAR, PEPE, RENDER, INJ, SEI, DOGE, XRP.
  * 📈 **Affordable US Growth Equities (<$50/share)**: PLTR, SOFI, HOOD, MARA, RIOT, RIVN.
  * 💎 **Core Blue Chips**: BTC, ETH, SOL, NVDA, AAPL, TSLA.
  * 🌊 **DEX Volume Leaders**: Real-time Solana and Base trending pools.

### 3. 📋 1-Click Binance & Bybit Live Order Assistant
* Instantly formats AI theses into copyable order tickets for the Binance/Bybit mobile app:
  * **Order Type & Pair** (e.g. `BTC/USDT Limit Order`)
  * **Limit Price & USDT Allocation**
  * **Take Profit & Stop Loss triggers**
  * **Spot (1x) vs Margin (2x) toggle**
  * **Local P2P Funding Guide**: 3-step guide on depositing $10–$50 via Binance P2P with BaridiMob/CCP.

### 4. 🛡️ Synchronized Paper Portfolio & Position Management
* Zero-risk simulation sandbox with sub-second WebSocket mark-to-market tracking:
  * **`[ Close Market ]`**: 1-Click instant exit.
  * **`[ 50% Out ]`**: 1-Click scale out to lock partial gains while letting the remainder ride risk-free.
  * **`[ Breakeven ]`**: 1-Click move Stop-Loss to Entry ($0 Risk / Free Trade).
  * **1-Click Reset Menu**: Preset starting balances ($10, $25, $50, $100, $250, $500).

### 5. 🎯 Unforgeable Proof-of-Accuracy Scorecard
* Tracks every historical signal against **real Binance high/low candle wicks**.
* Generates audit cards proving whether the trade hit Target 1 or Stop Loss, with exact timestamps, price records, and win-rate percentages.
* **Persistent Across App Restarts**: Automatically backfills price action that occurred while the backend was offline.

### 6. 🌐 Macro & On-Chain Radar
* **FRED Macro Indicators**: 10Y-2Y Treasury Yield Spread, Fed Funds Effective Rate, CPI Inflation Index.
* **Polymarket Prediction Odds**: Live probability bars for FOMC rate cuts, recession odds, and Bitcoin price milestones with real 24h volume.
* **On-Chain DEX Radar**: Real-time liquidity pool volume & DefiLlama protocol TVL rankings.
* **Educational Tooltips**: Non-clipping, viewport-bounded help tooltips explaining every metric in plain English.

---

## 🏗️ Architecture & Tech Stack

```
noble-borg/
├── frontend/                # Next.js 14 App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/             # Main dashboard page & root layout
│   │   ├── components/      # Widgets, TradingView Canvas, Modals, Tooltips
│   │   ├── store/           # Zustand state management (symbols, presets, modals)
│   │   └── lib/             # API client & WebSocket connections
│   └── package.json
│
├── backend/                 # FastAPI, Python 3.10+, Uvicorn
│   ├── app/
│   │   ├── api/             # REST endpoints (crypto, macro, paper, AI, discovery)
│   │   ├── services/        # Binance WS, Gemini AI Council, FRED, DEXScreener
│   │   └── core/            # App configuration & settings
│   ├── data/                # Persistent JSON storage (paper_portfolio.json)
│   └── requirements.txt
```

---

## 💾 Where the Data Lives & Persistence

1. **Paper Trading Portfolio & AI Scorecard**:
   * Stored locally at `backend/data/paper_portfolio.json`.
   * Written atomically on every trade, signal generation, or balance reset.
   * On server startup, `backfill_offline_signals()` automatically queries Binance to evaluate any trades that concluded while the server was offline.
2. **Production Database Migration (Optional)**:
   * To transition to a cloud database (PostgreSQL / Supabase / SQLite), update `PaperTradeService` to read/write using SQLAlchemy or Supabase REST SDK.

---

## 🚀 Quickstart (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local

# Start Next.js development server
npm run dev
```

* **Frontend Dashboard**: `http://localhost:3000`
* **Backend Swagger Docs**: `http://127.0.0.1:8001/docs`

---

## ☁️ Deployment Guide

### A. Deploying Frontend to Vercel

1. Push your repository to **GitHub**.
2. Go to **[Vercel Dashboard](https://vercel.com/)** -> **Add New Project** -> Select your repository.
3. Configure project settings:
   * **Root Directory**: `frontend`
   * **Framework Preset**: `Next.js`
   * **Build Command**: `npm run build`
   * **Output Directory**: `.next`
4. Add Environment Variables in Vercel:
   ```env
   NEXT_PUBLIC_BACKEND_URL=https://your-deployed-backend-url.com
   NEXT_PUBLIC_WS_URL=wss://your-deployed-backend-url.com/ws
   ```
5. Click **Deploy**!

---

### B. Deploying Backend to Railway / Render / Fly.io / VPS

1. Create a new Web Service pointing to the root or `backend` folder.
2. Set the start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
3. Set Environment Variables:
   ```env
   HOST=0.0.0.0
   PORT=8001
   DEBUG=False
   CORS_ORIGINS=["https://your-vercel-app.vercel.app"]
   GEMINI_API_KEY=your_gemini_api_key
   FINNHUB_API_KEY=your_finnhub_key_if_applicable
   FRED_API_KEY=your_fred_key_if_applicable
   ```
4. Attach a persistent volume to `/app/data` if you want virtual portfolio balances to persist across server redeployments.

---

## 📜 Credits & Data Providers

* **Binance Public Market API**: Real-time Level 2 depth, candlestick feeds, 24h ticker metrics, and live WebSocket streaming.
* **Google DeepMind (Gemini 2.5 Flash)**: Multimodal chart pattern vision analysis and 3-agent AI consensus engine.
* **TradingView**: Lightweight Charts™ library for client-side canvas rendering.
* **Federal Reserve Bank of St. Louis (FRED®)**: Real-time macroeconomic data (10Y-2Y Treasury Yield Curve, Fed Funds Rate, CPI).
* **DEXScreener & DefiLlama**: Decentralized exchange pool tracking and multi-chain protocol Total Value Locked (TVL).
* **Polymarket**: Prediction market odds and 24-hour volume data for macro events.

---

## ⚖️ Disclaimer

*Noble Borg is an educational and analytical trading dashboard. The AI council debates and simulated trades are generated for informational and risk management simulation purposes and do not constitute financial advice. Always trade responsibly and adhere to strict stop-loss rules.*
