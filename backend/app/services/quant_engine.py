import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
import ta

class QuantEngine:
    """Computes technical analysis indicators, support/resistance, and signal patterns using ta library."""

    @staticmethod
    def compute_indicators(candles: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute full suite of technical indicators from OHLCV candles."""
        if not candles or len(candles) < 20:
            return {"error": "Insufficient candle data (need >= 20 bars)"}

        df = pd.DataFrame(candles)
        df["time"] = pd.to_datetime(df["time"], unit="s")
        df.sort_values("time", inplace=True)
        df.reset_index(drop=True, inplace=True)
        
        close = df["close"]
        high = df["high"]
        low = df["low"]

        # 1. Moving Averages
        df["EMA_9"] = ta.trend.EMAIndicator(close=close, window=9).ema_indicator()
        df["EMA_21"] = ta.trend.EMAIndicator(close=close, window=21).ema_indicator()
        df["EMA_50"] = ta.trend.EMAIndicator(close=close, window=50).ema_indicator()
        df["EMA_200"] = ta.trend.EMAIndicator(close=close, window=200).ema_indicator() if len(df) >= 200 else None
        df["SMA_20"] = ta.trend.SMAIndicator(close=close, window=20).sma_indicator()

        # 2. Momentum & Oscillators
        rsi_indicator = ta.momentum.RSIIndicator(close=close, window=14)
        df["RSI_14"] = rsi_indicator.rsi()
        
        macd_indicator = ta.trend.MACD(close=close, window_fast=12, window_slow=26, window_sign=9)
        df["MACD"] = macd_indicator.macd()
        df["MACD_Hist"] = macd_indicator.macd_diff()
        df["MACD_Signal"] = macd_indicator.macd_signal()

        # 3. Volatility & Bands
        bb_indicator = ta.volatility.BollingerBands(close=close, window=20, window_dev=2)
        df["BBL"] = bb_indicator.bollinger_lband()
        df["BBM"] = bb_indicator.bollinger_mavg()
        df["BBU"] = bb_indicator.bollinger_hband()

        # 4. ATR (Average True Range) for Stop Loss & Volatility
        atr_indicator = ta.volatility.AverageTrueRange(high=high, low=low, close=close, window=14)
        df["ATR_14"] = atr_indicator.average_true_range()

        # Extract latest values
        latest = df.iloc[-1]

        # Calculate Fair Value Gaps (FVG)
        fvg_list = []
        for i in range(2, len(df)):
            curr_low = df["low"].iloc[i]
            curr_high = df["high"].iloc[i]
            prev2_high = df["high"].iloc[i-2]
            prev2_low = df["low"].iloc[i-2]

            # Bullish FVG: Low of candle 3 is higher than High of candle 1
            if curr_low > prev2_high:
                fvg_list.append({
                    "type": "BULLISH_FVG",
                    "top": float(curr_low),
                    "bottom": float(prev2_high),
                    "time": int(df["time"].iloc[i].timestamp())
                })
            # Bearish FVG: High of candle 3 is lower than Low of candle 1
            elif curr_high < prev2_low:
                fvg_list.append({
                    "type": "BEARISH_FVG",
                    "top": float(prev2_low),
                    "bottom": float(curr_high),
                    "time": int(df["time"].iloc[i].timestamp())
                })

        # Calculate Support & Resistance (Pivot High/Low)
        recent_highs = df["high"].tail(30).tolist()
        recent_lows = df["low"].tail(30).tolist()
        resistance_levels = sorted(list(set([round(x, 2) for x in recent_highs if x > latest["close"]])))[:3]
        support_levels = sorted(list(set([round(x, 2) for x in recent_lows if x < latest["close"]])), reverse=True)[:3]

        # Signal conditions
        rsi = float(latest["RSI_14"]) if not pd.isna(latest.get("RSI_14")) else 50.0
        atr = float(latest["ATR_14"]) if not pd.isna(latest.get("ATR_14")) else (latest["close"] * 0.02)
        
        trend = "NEUTRAL"
        if latest.get("EMA_9") is not None and latest.get("EMA_21") is not None:
            if latest["EMA_9"] > latest["EMA_21"] and latest["close"] > latest["EMA_9"]:
                trend = "BULLISH"
            elif latest["EMA_9"] < latest["EMA_21"] and latest["close"] < latest["EMA_9"]:
                trend = "BEARISH"

        return {
            "current_price": float(latest["close"]),
            "trend": trend,
            "rsi_14": round(rsi, 2),
            "rsi_condition": "OVERBOUGHT" if rsi > 70 else "OVERSOLD" if rsi < 30 else "NEUTRAL",
            "atr_14": round(atr, 4),
            "ema_9": round(float(latest["EMA_9"]), 2) if not pd.isna(latest.get("EMA_9")) else None,
            "ema_21": round(float(latest["EMA_21"]), 2) if not pd.isna(latest.get("EMA_21")) else None,
            "ema_50": round(float(latest["EMA_50"]), 2) if not pd.isna(latest.get("EMA_50")) else None,
            "ema_200": round(float(latest["EMA_200"]), 2) if (latest.get("EMA_200") is not None and not pd.isna(latest.get("EMA_200"))) else None,
            "bb_upper": round(float(latest["BBU"]), 2) if not pd.isna(latest.get("BBU")) else None,
            "bb_lower": round(float(latest["BBL"]), 2) if not pd.isna(latest.get("BBL")) else None,
            "macd_histogram": round(float(latest["MACD_Hist"]), 4) if not pd.isna(latest.get("MACD_Hist")) else None,
            "support_levels": support_levels,
            "resistance_levels": resistance_levels,
            "recent_fvgs": fvg_list[-4:] if fvg_list else []
        }

quant_engine = QuantEngine()
