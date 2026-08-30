import json
import asyncio
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.cache import cache
from app.core.rate_limiter import rate_limiter
from app.services.quant_engine import quant_engine

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

class AICouncilService:
    """Multi-Agent Trading Council: Bull Analyst vs. Bear Analyst vs. Chief Risk Officer powered by Gemini 3.7 Flash."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        self.primary_model = "gemini-3.7-flash"
        self.fallback_model = "gemini-2.0-flash"
        
        if GENAI_AVAILABLE and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[AICouncilService] Failed to initialize Gemini Client: {e}")

    def is_configured(self) -> bool:
        return bool(self.client is not None and self.api_key)

    async def analyze_trade_setup(
        self, 
        symbol: str, 
        technicals: Dict[str, Any], 
        news_headlines: list, 
        user_query: Optional[str] = None,
        user_capital: float = 50.0
    ) -> Dict[str, Any]:
        """Conduct a Tri-Agent Council debate to generate an honest, beginner-friendly, and actionable trading signal."""
        
        symbol_upper = symbol.upper()
        cache_key = f"ai:debate:{symbol_upper}:{user_capital}:{user_query or 'default'}"
        cached = await cache.get(cache_key)
        if cached:
            return cached

        if not self.is_configured():
            return self._generate_rule_based_council_signal(symbol_upper, technicals, news_headlines, user_query, user_capital)

        # Free tier rate limit protection: acquire 1 token (15 RPM limit)
        await rate_limiter.acquire("gemini", cost=1.0)

        price = technicals.get("current_price", 100.0)
        safe_risk_dollars = round(user_capital * 0.02, 2)

        # Multi-Agent Debate Prompt with Brutal Honesty & Beginner Assistance
        prompt = f"""
You are the Chief Investment Committee conducting a rigorous, BRUTALLY HONEST, and beginner-friendly trading evaluation for ticker: {symbol_upper}.

CURRENT MARKET TECHNICAL DATA:
{json.dumps(technicals, indent=2)}

RECENT BREAKING NEWS HEADLINES:
{json.dumps(news_headlines[:5], indent=2)}

USER'S REAL ACCOUNT CAPITAL: ${user_capital:.2f} (Safe 2% Max Risk = ${safe_risk_dollars:.2f})
USER QUESTION / FOCUS:
{user_query or "Provide comprehensive trade thesis, beginner explanation, and execution plan"}

CRITICAL GUIDELINES FOR YOUR RESPONSE:
1. BE 100% BRUTALLY HONEST: Never encourage reckless trades or false certainty. If the market is choppy, overbought, or lacking a clear edge, explicitly tell the user: "HOLD CASH / DO NOT FOMO". Protect the user's capital above all else.
2. BEGINNER-FRIENDLY CLARITY: Explain what is happening in simple, clear English without confusing institutional jargon. Explain WHY we are entering, WHERE the danger is, and HOW long this trade will likely take.
3. CONCRETE EXECUTION PLAN FOR ${user_capital:.2f} CAPITAL:
   - Provide exact numbers for Entry Range, Stop Loss (with % drop), Take Profit 1 (% gain), Take Profit 2, Estimated Trade Duration, and Risk Level.
   - Provide exact Dollar Risk/Reward breakdown based on the user's ${user_capital:.2f} capital so they know EXACTLY how many cents/dollars they risk to grow their account safely.

You MUST respond strictly with a valid JSON object matching this schema:
{{
  "symbol": "{symbol_upper}",
  "bull_thesis": "Clear 2-sentence bullish perspective",
  "bear_thesis": "Clear 2-sentence bearish danger perspective",
  "cro_verdict": "Honest consensus and risk synthesis by Chief Risk Officer",
  "beginner_guide": {{
    "what_is_happening": "Simple 1-2 sentence plain English explanation of price action",
    "why_enter_or_wait": "Simple explanation of the edge or why you should wait",
    "risk_level": "LOW (Green)" | "MODERATE (Yellow)" | "HIGH VOLATILITY (Red)",
    "estimated_hold_time": "⚡ Scalp: 15-45 mins" | "⏱️ Day Trade: 2-6 hours" | "📅 Swing Trade: 1-3 days" | "💤 No Trade / Sit on Hands",
    "worst_case_scenario": "Exact honest description of what happens if the trade fails"
  }},
  "signal": {{
    "action": "BUY" | "SELL" | "HOLD",
    "confidence_score": 0 to 100,
    "current_price": {price},
    "entry_range": [min_price, max_price],
    "stop_loss": price,
    "stop_loss_pct": "X.X%",
    "take_profit_1": price,
    "take_profit_1_pct": "X.X%",
    "take_profit_2": price,
    "take_profit_2_pct": "X.X%",
    "risk_reward_ratio": "1:X.X",
    "micro_capital_math": {{
      "account_size_tested": {user_capital},
      "max_dollar_loss_at_2pct_risk": {safe_risk_dollars},
      "expected_dollar_gain_at_tp1": 2.50,
      "micro_position_size": "exact coin quantity"
    }},
    "primary_catalysts": ["catalyst 1", "catalyst 2", "catalyst 3"]
  }}
}}
"""

        def _call_gemini():
            for model_name in [self.primary_model, self.fallback_model]:
                try:
                    response = self.client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.2
                        )
                    )
                    return json.loads(response.text)
                except Exception as ex:
                    print(f"[AICouncilService] Model {model_name} failed: {ex}, trying fallback...")
            raise RuntimeError("All Gemini models failed")

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(None, _call_gemini)
            # Cache successful debate result for 3 minutes (180s) to protect free quota
            await cache.set(cache_key, result, ttl_seconds=180)
            return result
        except Exception as e:
            print(f"[AICouncilService] Gemini API error, falling back to rule engine: {e}")
            return self._generate_rule_based_council_signal(symbol_upper, technicals, news_headlines, user_query)

    def _generate_rule_based_council_signal(
        self, 
        symbol: str, 
        technicals: Dict[str, Any], 
        news_headlines: list, 
        user_query: Optional[str] = None,
        user_capital: float = 50.0
    ) -> Dict[str, Any]:
        """Deterministic quantitative fallback when Gemini API is throttled or offline."""
        price = technicals.get("current_price", 100.0)
        rsi = technicals.get("rsi_14", 50.0)
        atr = technicals.get("atr_14", price * 0.02)
        trend = technicals.get("trend", "NEUTRAL")
        support = technicals.get("support_levels", [price * 0.97])[0] if technicals.get("support_levels") else (price * 0.97)
        resistance = technicals.get("resistance_levels", [price * 1.05])[0] if technicals.get("resistance_levels") else (price * 1.05)
        safe_dollar_risk = round(user_capital * 0.02, 2)

        if trend == "BULLISH" and rsi < 65:
            action = "BUY"
            confidence = min(int(50 + (70 - rsi) * 0.8 + 20), 92)
            sl = round(price - (atr * 1.5), 2)
            tp1 = round(price + (atr * 3.0), 2)
            tp2 = round(price + (atr * 4.5), 2)
            sl_pct = f"{round(((price - sl) / price) * 100, 2)}%"
            tp1_pct = f"+{round(((tp1 - price) / price) * 100, 2)}%"
            tp2_pct = f"+{round(((tp2 - price) / price) * 100, 2)}%"
            rr = f"1:{round((tp1 - price) / max(price - sl, 0.01), 2)}"
            bull_case = f"Price is holding above key EMAs with RSI at {rsi}, showing steady buyer accumulation."
            bear_case = f"Watch out for overhead resistance near {resistance}."
            cro = f"Favorable asymmetric risk profile with calculated {rr} Risk/Reward ratio. Keep stop tight."
            what_is_happening = f"{symbol} is in a steady upward trend. Buyers are defending support levels."
            why_enter = "Momentum is on our side, and our stop-loss is protected below recent support."
            risk_level = "MODERATE (Yellow)"
            est_time = "⏱️ Day Trade: 2-6 hours"
            worst_case = f"If price breaks below ${sl}, buyers lost control; exit immediately to preserve capital."
        elif trend == "BEARISH" or rsi > 75:
            action = "SELL"
            confidence = min(int(50 + (rsi - 30) * 0.6 + 15), 88)
            sl = round(price + (atr * 1.5), 2)
            tp1 = round(price - (atr * 3.0), 2)
            tp2 = round(price - (atr * 4.5), 2)
            sl_pct = f"{round(((sl - price) / price) * 100, 2)}%"
            tp1_pct = f"-{round(((price - tp1) / price) * 100, 2)}%"
            tp2_pct = f"-{round(((price - tp2) / price) * 100, 2)}%"
            rr = f"1:{round((price - tp1) / max(sl - price, 0.01), 2)}"
            bull_case = f"Potential oversold bounce from lower support around {support}."
            bear_case = f"Sellers in full control below moving averages with elevated RSI divergence."
            cro = f"Downside momentum dominant; strictly enforce trailing stop at ${sl}."
            what_is_happening = f"{symbol} is facing heavy selling pressure with lower highs."
            why_enter = "The path of least resistance is downward. Selling or waiting for cheaper prices is favored."
            risk_level = "HIGH VOLATILITY (Red)"
            est_time = "⏱️ Day Trade: 2-6 hours"
            worst_case = f"If price rallies above ${sl}, short sellers are trapped; exit without hesitation."
        else:
            action = "HOLD"
            confidence = 50
            sl = round(price - atr, 2)
            tp1 = round(price + (atr * 2), 2)
            tp2 = round(price + (atr * 3), 2)
            sl_pct = "1.5%"
            tp1_pct = "+3.0%"
            tp2_pct = "+4.5%"
            rr = "1:2.0"
            bull_case = "Consolidating near equilibrium with balanced order flow."
            bear_case = "No clear directional breakout catalyst present."
            cro = "Market is in a choppy range; best move for capital preservation is to wait on the sidelines."
            what_is_happening = f"{symbol} is bouncing sideways in a tight range without clear volume."
            why_enter = "There is no strong statistical edge right now. Sitting in cash is a profitable position."
            risk_level = "LOW (Green)"
            est_time = "💤 No Trade / Sit on Hands"
            worst_case = "Entering randomly in a chop zone will bleed trading fees and chop out stops."

        return {
            "symbol": symbol,
            "bull_thesis": bull_case,
            "bear_thesis": bear_case,
            "cro_verdict": cro,
            "beginner_guide": {
                "what_is_happening": what_is_happening,
                "why_enter_or_wait": why_enter,
                "risk_level": risk_level,
                "estimated_hold_time": est_time,
                "worst_case_scenario": worst_case
            },
            "signal": {
                "action": action,
                "confidence_score": confidence,
                "current_price": price,
                "entry_range": [round(price * 0.998, 2), round(price * 1.002, 2)],
                "stop_loss": sl,
                "stop_loss_pct": sl_pct,
                "take_profit_1": tp1,
                "take_profit_1_pct": tp1_pct,
                "take_profit_2": tp2,
                "take_profit_2_pct": tp2_pct,
                "risk_reward_ratio": rr,
                "dollar_risk_math": {
                    "account_size_example": 1000,
                    "max_dollar_loss_at_1pct_risk": 10.0,
                    "expected_dollar_gain_at_tp1": 22.0
                },
                "primary_catalysts": [
                    f"RSI-14 at {rsi} ({technicals.get('rsi_condition', 'NEUTRAL')})",
                    f"Trend alignment: {trend}",
                    f"ATR-14 Volatility: ${atr}"
                ]
            }
        }

ai_council_service = AICouncilService()
