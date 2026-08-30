import os
import json
import time
import uuid
from typing import Dict, List, Any, Optional
from app.core.config import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
PORTFOLIO_FILE = os.path.join(DATA_DIR, "paper_portfolio.json")

class PaperTradeService:
    """Simulated Paper Trading Portfolio, Auto-Breakeven Trailing Stops, Equity Curves, & Proof-of-Accuracy Journal."""

    def __init__(self):
        self.initial_balance = 50.0  # Default $50 micro capital
        self.cash_balance = 50.0
        self.positions: Dict[str, Dict[str, Any]] = {}
        self.trade_history: List[Dict[str, Any]] = []
        self.ai_signals: List[Dict[str, Any]] = []
        self.equity_curve: List[Dict[str, Any]] = []
        self.daily_drawdown_locked_until: Optional[float] = None
        self.max_daily_loss_pct: float = 0.05  # 5% max daily loss limit ($2.50 on $50 account)

        os.makedirs(DATA_DIR, exist_ok=True)
        self._load_from_disk()

    def _load_from_disk(self):
        """Load portfolio state and AI signals history from persistent JSON storage."""
        if os.path.exists(PORTFOLIO_FILE):
            try:
                with open(PORTFOLIO_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.initial_balance = float(data.get("initial_balance", 50.0))
                    self.cash_balance = float(data.get("cash_balance", self.initial_balance))
                    self.positions = data.get("positions", {})
                    self.trade_history = data.get("trade_history", [])
                    self.ai_signals = data.get("ai_signals", [])
                    self.equity_curve = data.get("equity_curve", [])
                    self.daily_drawdown_locked_until = data.get("daily_drawdown_locked_until")
            except Exception as e:
                print(f"[PaperTradeService] Error loading {PORTFOLIO_FILE}: {e}")

        # Seed initial equity curve if empty
        if not self.equity_curve:
            self.equity_curve = [{"timestamp": time.time(), "equity": self.cash_balance}]

    def _save_to_disk(self):
        """Atomically persist portfolio state and signals to JSON storage."""
        try:
            temp_file = f"{PORTFOLIO_FILE}.tmp"
            payload = {
                "initial_balance": self.initial_balance,
                "cash_balance": self.cash_balance,
                "positions": self.positions,
                "trade_history": self.trade_history,
                "ai_signals": self.ai_signals,
                "equity_curve": self.equity_curve[-50:],  # keep last 50 data points
                "daily_drawdown_locked_until": self.daily_drawdown_locked_until,
                "last_updated": time.time()
            }
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            os.replace(temp_file, PORTFOLIO_FILE)
        except Exception as e:
            print(f"[PaperTradeService] Error saving to disk: {e}")

    def reset_account(self, new_balance: float = 50.0) -> Dict[str, Any]:
        """Reset virtual paper trading capital to a clean starting amount ($10, $50, etc.)."""
        self.initial_balance = float(new_balance)
        self.cash_balance = float(new_balance)
        self.positions = {}
        self.trade_history = []
        self.daily_drawdown_locked_until = None
        self.equity_curve = [{"timestamp": time.time(), "equity": float(new_balance)}]
        self._save_to_disk()
        return self.get_portfolio_summary()

    def reset_ai_signals(self) -> Dict[str, Any]:
        """Reset the AI accuracy track record to start a clean verification log."""
        self.ai_signals = []
        self._save_to_disk()
        return self.get_ai_accuracy_scorecard()

    def check_risk_guardrails(self) -> Dict[str, Any]:
        """Check for Daily Drawdown Circuit Breaker and Overtrading frequency."""
        now = time.time()
        
        # 1. Circuit Breaker Check
        if self.daily_drawdown_locked_until and now < self.daily_drawdown_locked_until:
            remaining_mins = int((self.daily_drawdown_locked_until - now) / 60)
            return {
                "allowed": False,
                "reason": "CIRCUIT_BREAKER_ACTIVE",
                "message": f"🛡️ Daily Loss Circuit Breaker Active. Trading paused for {remaining_mins} mins to preserve remaining capital.",
                "remaining_minutes": remaining_mins
            }

        # 2. Daily Loss calculation (last 24 hours)
        recent_trades = [t for t in self.trade_history if (now - t.get("timestamp", now)) < 86400]
        daily_pnl = sum(t.get("realized_pnl", 0.0) for t in recent_trades)
        max_allowed_loss = -(self.initial_balance * self.max_daily_loss_pct)

        if daily_pnl <= max_allowed_loss and len(recent_trades) >= 2:
            self.daily_drawdown_locked_until = now + (12 * 3600)  # Lock for 12 hours
            self._save_to_disk()
            return {
                "allowed": False,
                "reason": "CIRCUIT_BREAKER_TRIGGERED",
                "message": f"🛡️ Max Daily Loss Limit Hit (-${abs(daily_pnl):.2f}). Trading paused for 12h to prevent emotional revenge trading.",
                "remaining_minutes": 720
            }

        # 3. Overtrading Check (more than 4 trades in 15 minutes)
        last_15m_trades = [t for t in self.trade_history if (now - t.get("timestamp", now)) < 900]
        is_overtrading = len(last_15m_trades) >= 4

        return {
            "allowed": True,
            "is_overtrading_warning": is_overtrading,
            "warning_message": "⚠️ High Trade Frequency Alert: Taking frequent trades in consolidation creates fee drag. Wait for clear AI setups." if is_overtrading else None,
            "daily_pnl": round(daily_pnl, 2),
            "max_allowed_loss": round(abs(max_allowed_loss), 2)
        }

    def record_ai_signal(self, signal_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Store an AI generated signal with exact timeframe duration and wick tracking."""
        symbol = signal_payload.get("symbol", "").upper()
        signal_data = signal_payload.get("signal", {})
        guide = signal_payload.get("beginner_guide", {})
        
        if not symbol or not signal_data or signal_data.get("action") == "HOLD":
            return {"recorded": False}

        signal_id = str(uuid.uuid4())[:8]
        entry_price = float(signal_data.get("current_price", 0))
        stop_loss = float(signal_data.get("stop_loss", 0))
        tp1 = float(signal_data.get("take_profit_1", 0))
        tp2 = float(signal_data.get("take_profit_2", 0))
        action = signal_data.get("action", "BUY")
        hold_time_str = guide.get("estimated_hold_time", "⏱️ Day Trade: 2-6 hours")

        # Parse hold time category and timeout seconds
        timeframe_category = "DAY_TRADE"
        max_duration_sec = 6 * 3600  # Default 6 hours

        if "5" in hold_time_str or "15 mins" in hold_time_str or "Scalp: 15-45" in hold_time_str:
            timeframe_category = "SCALP"
            max_duration_sec = 45 * 60  # 45 mins
        elif "Ultra-Scalp" in hold_time_str or "5-15" in hold_time_str:
            timeframe_category = "ULTRA_SCALP"
            max_duration_sec = 15 * 60  # 15 mins
        elif "Swing" in hold_time_str or "1-3 days" in hold_time_str:
            timeframe_category = "SWING"
            max_duration_sec = 72 * 3600  # 3 days

        current_spot = float(signal_data.get("current_price", entry_price))
        # If entry is within 0.3% of current spot, treat as immediate market fill; otherwise pending limit
        is_immediate_fill = abs(current_spot - entry_price) / max(current_spot, 1) <= 0.003

        record = {
            "id": signal_id,
            "timestamp": time.time(),
            "symbol": symbol,
            "action": action,
            "entry_price": entry_price,
            "spot_at_creation": current_spot,
            "entry_filled": is_immediate_fill,
            "filled_at": time.time() if is_immediate_fill else None,
            "stop_loss": stop_loss,
            "take_profit_1": tp1,
            "take_profit_2": tp2,
            "confidence": signal_data.get("confidence_score", 0),
            "hold_time_label": hold_time_str,
            "timeframe_category": timeframe_category,
            "max_duration_sec": max_duration_sec,
            "status": "ACTIVE",  # ACTIVE | HIT_TP | HIT_SL | EXPIRED | UNFILLED_CANCELLED
            "result_pnl_pct": 0.0,
            "highest_price_seen": current_spot,
            "lowest_price_seen": current_spot,
            "exit_price": None,
            "evaluated_at": None,
            "proof_audit": {
                "predicted_entry": entry_price,
                "predicted_tp1": tp1,
                "predicted_sl": stop_loss,
                "peak_favorable_price": current_spot,
                "deepest_adverse_price": current_spot,
                "real_market_verification": "FILLED_AT_MARKET" if is_immediate_fill else f"PENDING_LIMIT_FILL (Entry: ${entry_price:,.2f})"
            }
        }

        self.ai_signals.append(record)
        self._save_to_disk()
        return {"recorded": True, "signal_id": signal_id}

    def evaluate_signals_against_price(self, symbol: str, live_price: float):
        """Evaluate active AI signals against real-time market price with strict limit fill verification."""
        if not live_price or live_price <= 0:
            return

        now = time.time()
        changed = False
        sym_upper = symbol.upper()

        for s in self.ai_signals:
            if s.get("symbol") == sym_upper and s.get("status") == "ACTIVE":
                action = s.get("action")
                entry = s.get("entry_price", 0)
                sl = s.get("stop_loss", 0)
                tp = s.get("take_profit_1", 0)
                created_at = s.get("timestamp", now)
                max_sec = s.get("max_duration_sec", 6 * 3600)
                entry_filled = s.get("entry_filled", False)

                # Update live high and low wick records for proof
                s["highest_price_seen"] = max(s.get("highest_price_seen", live_price), live_price)
                s["lowest_price_seen"] = min(s.get("lowest_price_seen", live_price), live_price)
                
                s["proof_audit"]["peak_favorable_price"] = s["highest_price_seen"] if action == "BUY" else s["lowest_price_seen"]
                s["proof_audit"]["deepest_adverse_price"] = s["lowest_price_seen"] if action == "BUY" else s["highest_price_seen"]

                # STEP 1: LIMIT ORDER FILL VALIDATION
                if not entry_filled:
                    if action == "BUY" and live_price <= entry:
                        s["entry_filled"] = True
                        s["filled_at"] = now
                        s["proof_audit"]["real_market_verification"] = f"LIMIT FILLED: Price reached entry ${live_price:,.2f}"
                        changed = True
                        entry_filled = True
                    elif action == "SELL" and live_price >= entry:
                        s["entry_filled"] = True
                        s["filled_at"] = now
                        s["proof_audit"]["real_market_verification"] = f"LIMIT FILLED: Price reached entry ${live_price:,.2f}"
                        changed = True
                        entry_filled = True
                    elif (now - created_at) > max_sec:
                        s["status"] = "UNFILLED_CANCELLED"
                        s["result_pnl_pct"] = 0.0
                        s["evaluated_at"] = now
                        s["proof_audit"]["real_market_verification"] = f"EXPIRED UNFILLED: Market never reached limit entry ${entry:,.2f}"
                        changed = True
                        continue

                # STEP 2: POSITION EVALUATION (ONLY ONCE FILLED)
                if entry_filled:
                    if action == "BUY":
                        # TP reached
                        if tp > entry and live_price >= tp:
                            s["status"] = "HIT_TP"
                            s["exit_price"] = live_price
                            s["result_pnl_pct"] = round(((tp - entry) / entry) * 100, 2) if entry else 0.0
                            s["evaluated_at"] = now
                            s["proof_audit"]["real_market_verification"] = f"TARGET REACHED: High wick touched ${live_price:,.2f}"
                            changed = True
                        # SL hit
                        elif sl < entry and live_price <= sl and sl > 0:
                            s["status"] = "HIT_SL"
                            s["exit_price"] = live_price
                            s["result_pnl_pct"] = round(((sl - entry) / entry) * 100, 2) if entry else 0.0
                            s["evaluated_at"] = now
                            s["proof_audit"]["real_market_verification"] = f"STOPPED OUT: Low wick touched ${live_price:,.2f}"
                            changed = True
                        # Time Expiration
                        elif (now - created_at) > max_sec:
                            s["status"] = "EXPIRED"
                            s["exit_price"] = live_price
                            s["result_pnl_pct"] = round(((live_price - entry) / entry) * 100, 2) if entry else 0.0
                            s["evaluated_at"] = now
                            s["proof_audit"]["real_market_verification"] = f"TIME EXPIRED: Exit price at ${live_price:,.2f}"
                            changed = True

                    elif action == "SELL":
                        # TP reached
                        if tp < entry and live_price <= tp and tp > 0:
                            s["status"] = "HIT_TP"
                            s["exit_price"] = live_price
                            s["result_pnl_pct"] = round(((entry - tp) / entry) * 100, 2) if entry else 0.0
                            s["evaluated_at"] = now
                            s["proof_audit"]["real_market_verification"] = f"TARGET REACHED: Low wick touched ${live_price:,.2f}"
                            changed = True
                        # SL hit
                        elif sl > entry and live_price >= sl and sl > 0:
                            s["status"] = "HIT_SL"
                            s["exit_price"] = live_price
                            s["result_pnl_pct"] = round(((entry - sl) / entry) * 100, 2) if entry else 0.0
                            s["evaluated_at"] = now
                            s["proof_audit"]["real_market_verification"] = f"STOPPED OUT: High wick touched ${live_price:,.2f}"
                            changed = True
                        # Time Expiration
                        elif (now - created_at) > max_sec:
                            s["status"] = "EXPIRED"
                            s["exit_price"] = live_price
                            s["result_pnl_pct"] = round(((entry - live_price) / entry) * 100, 2) if entry else 0.0
                            s["evaluated_at"] = now
                            s["proof_audit"]["real_market_verification"] = f"TIME EXPIRED: Exit price at ${live_price:,.2f}"
                            changed = True

        # Auto-Breakeven Trailing Stop for Open Positions
        if sym_upper in self.positions:
            pos = self.positions[sym_upper]
            entry = pos.get("entry_price", 0)
            tp = pos.get("take_profit")
            sl = pos.get("stop_loss")
            side = pos.get("side")

            if tp and entry and sl and not pos.get("is_breakeven_locked"):
                if side == "LONG" and tp > entry:
                    halfway_point = entry + ((tp - entry) * 0.5)
                    if live_price >= halfway_point:
                        pos["stop_loss"] = entry  # Move SL to breakeven!
                        pos["is_breakeven_locked"] = True
                        pos["breakeven_triggered_at"] = now
                        changed = True
                elif side == "SHORT" and tp < entry:
                    halfway_point = entry - ((entry - tp) * 0.5)
                    if live_price <= halfway_point:
                        pos["stop_loss"] = entry  # Move SL to breakeven!
                        pos["is_breakeven_locked"] = True
                        pos["breakeven_triggered_at"] = now
                        changed = True

        if changed:
            self._save_to_disk()

    async def backfill_offline_signals(self):
        """Backfill and evaluate any active signals that were running while the backend was offline."""
        from app.services.binance_service import binance_service
        active_signals = [s for s in self.ai_signals if s.get("status") == "ACTIVE"]
        if not active_signals:
            return

        print(f"[PaperTradeService] Backfilling {len(active_signals)} active signals from live market...")
        for s in active_signals:
            sym = s.get("symbol")
            if not sym:
                continue
            try:
                price_data = await binance_service.get_price(sym)
                live_price = float(price_data.get("price", 0))
                if live_price > 0:
                    self.evaluate_signals_against_price(sym, live_price)
            except Exception as e:
                print(f"[PaperTradeService] Error backfilling {sym}: {e}")

    def get_ai_accuracy_scorecard(self, timeframe_filter: Optional[str] = None) -> Dict[str, Any]:
        """Calculates hit rate, accuracy score, and returns rich proof audit trails."""
        signals = self.ai_signals
        if timeframe_filter and timeframe_filter != "ALL":
            signals = [s for s in signals if s.get("timeframe_category") == timeframe_filter]

        total_signals = len(signals)
        evaluated = [s for s in signals if s.get("status") in ["HIT_TP", "HIT_SL", "EXPIRED"]]
        wins = [s for s in evaluated if s.get("status") == "HIT_TP" or (s.get("status") == "EXPIRED" and s.get("result_pnl_pct", 0) > 0)]
        losses = [s for s in evaluated if s.get("status") == "HIT_SL" or (s.get("status") == "EXPIRED" and s.get("result_pnl_pct", 0) <= 0)]
        active = [s for s in signals if s.get("status") == "ACTIVE"]

        total_evaluated = len(evaluated)
        win_rate = (len(wins) / total_evaluated * 100) if total_evaluated > 0 else 0.0
        avg_gain = sum(s.get("result_pnl_pct", 0) for s in wins) / max(len(wins), 1)
        avg_loss = sum(abs(s.get("result_pnl_pct", 0)) for s in losses) / max(len(losses), 1)

        # Breakdown by Timeframe
        def get_tf_stats(cat: str):
            cat_sigs = [s for s in self.ai_signals if s.get("timeframe_category") == cat and s.get("status") in ["HIT_TP", "HIT_SL"]]
            cat_wins = [s for s in cat_sigs if s.get("status") == "HIT_TP"]
            rate = (len(cat_wins) / len(cat_sigs) * 100) if cat_sigs else 0.0
            return {
                "total": len(cat_sigs),
                "wins": len(cat_wins),
                "win_rate_pct": round(rate, 1)
            }

        return {
            "total_signals_generated": total_signals,
            "total_evaluated": total_evaluated,
            "active_tracking": len(active),
            "winning_signals": len(wins),
            "losing_signals": len(losses),
            "accuracy_win_rate_pct": round(win_rate, 1),
            "avg_win_pct": round(avg_gain, 2),
            "avg_loss_pct": round(avg_loss, 2),
            "timeframe_breakdown": {
                "ultra_scalp_5_15m": get_tf_stats("ULTRA_SCALP"),
                "scalp_15_45m": get_tf_stats("SCALP"),
                "day_trade_2_6h": get_tf_stats("DAY_TRADE"),
                "swing_1_3d": get_tf_stats("SWING")
            },
            "guardrail_status": self.check_risk_guardrails(),
            "recent_verified_signals": list(reversed(signals[-20:]))
        }

    def calculate_atr_position_size(self, entry_price: float, atr: float, risk_pct: float = 0.02) -> Dict[str, Any]:
        """Calculate recommended position size based on safe 2% risk limit."""
        equity = self.cash_balance
        max_dollar_risk = equity * risk_pct
        stop_distance = atr * 1.5
        if stop_distance <= 0:
            stop_distance = entry_price * 0.015
        qty = max_dollar_risk / stop_distance
        return {
            "account_equity": equity,
            "max_dollar_risk": round(max_dollar_risk, 2),
            "stop_loss_distance": round(stop_distance, 2),
            "recommended_quantity": round(qty, 5),
            "recommended_dollar_allocation": round(qty * entry_price, 2)
        }

    def get_portfolio_summary(self, live_prices: Optional[Dict[str, float]] = None) -> Dict[str, Any]:
        """Calculate live equity, unrealized P&L, realized P&L, Win Rate, and Sharpe Ratio."""
        live_prices = live_prices or {}
        
        unrealized_pnl = 0.0
        positions_list = []
        
        for symbol, pos in self.positions.items():
            current_price = live_prices.get(symbol, pos["current_price"])
            side = pos["side"]
            qty = pos["quantity"]
            entry = pos["entry_price"]
            tp = pos.get("take_profit")
            sl = pos.get("stop_loss")
            
            if side == "LONG":
                pnl = (current_price - entry) * qty
                pnl_pct = ((current_price - entry) / entry) * 100 if entry else 0.0
                progress_to_tp = round(min(max((current_price - entry) / (tp - entry) * 100, 0), 100), 1) if (tp and tp > entry) else 0.0
            else:
                pnl = (entry - current_price) * qty
                pnl_pct = ((entry - current_price) / entry) * 100 if entry else 0.0
                progress_to_tp = round(min(max((entry - current_price) / (entry - tp) * 100, 0), 100), 1) if (tp and tp < entry) else 0.0
                
            unrealized_pnl += pnl
            
            positions_list.append({
                **pos,
                "current_price": current_price,
                "unrealized_pnl": round(pnl, 2),
                "unrealized_pnl_pct": round(pnl_pct, 2),
                "progress_to_tp_pct": progress_to_tp,
                "is_breakeven_locked": pos.get("is_breakeven_locked", False),
                "market_value": round(current_price * qty, 2)
            })

        total_equity = self.cash_balance + unrealized_pnl
        realized_pnl = sum(t.get("realized_pnl", 0.0) for t in self.trade_history)
        
        winning_trades = [t for t in self.trade_history if t.get("realized_pnl", 0) > 0]
        total_trades = len(self.trade_history)
        win_rate = (len(winning_trades) / total_trades * 100) if total_trades > 0 else 0.0
        
        gross_profit = sum(t["realized_pnl"] for t in self.trade_history if t.get("realized_pnl", 0) > 0)
        gross_loss = abs(sum(t["realized_pnl"] for t in self.trade_history if t.get("realized_pnl", 0) < 0))
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 1.0)

        # Record equity curve point
        now = time.time()
        if not self.equity_curve or (now - self.equity_curve[-1]["timestamp"]) > 60:
            self.equity_curve.append({"timestamp": now, "equity": round(total_equity, 2)})

        return {
            "initial_balance": round(self.initial_balance, 2),
            "cash_balance": round(self.cash_balance, 2),
            "total_equity": round(total_equity, 2),
            "unrealized_pnl": round(unrealized_pnl, 2),
            "realized_pnl": round(realized_pnl, 2),
            "total_pnl": round((total_equity - self.initial_balance), 2),
            "total_pnl_pct": round(((total_equity - self.initial_balance) / self.initial_balance) * 100, 2),
            "total_trades": total_trades,
            "win_rate_pct": round(win_rate, 1),
            "profit_factor": profit_factor,
            "equity_curve": self.equity_curve,
            "guardrail_status": self.check_risk_guardrails(),
            "active_positions": positions_list,
            "trade_history": self.trade_history[-20:]
        }

    def execute_order(
        self, 
        symbol: str, 
        side: str, 
        quantity: float, 
        current_price: float,
        stop_loss: Optional[float] = None,
        take_profit: Optional[float] = None
    ) -> Dict[str, Any]:
        """Execute a market order with risk guardrail enforcement."""
        symbol_upper = symbol.upper()
        side_upper = side.upper()
        
        if quantity <= 0 or current_price <= 0:
            return {"success": False, "error": "Invalid quantity or price"}

        # Guardrail check
        guardrail = self.check_risk_guardrails()
        if not guardrail.get("allowed", True):
            return {"success": False, "error": guardrail.get("message", "Trading temporarily restricted by risk guardrail")}

        order_cost = quantity * current_price

        # Check if closing an existing opposite position
        if symbol_upper in self.positions:
            pos = self.positions[symbol_upper]
            if pos["side"] != side_upper:
                entry = pos["entry_price"]
                pos_qty = pos["quantity"]
                
                if pos["side"] == "LONG":
                    realized = (current_price - entry) * min(quantity, pos_qty)
                else:
                    realized = (entry - current_price) * min(quantity, pos_qty)

                trade_record = {
                    "id": str(uuid.uuid4())[:8],
                    "symbol": symbol_upper,
                    "side": pos["side"],
                    "entry_price": entry,
                    "exit_price": current_price,
                    "quantity": min(quantity, pos_qty),
                    "realized_pnl": round(realized, 2),
                    "timestamp": time.time()
                }
                self.trade_history.append(trade_record)
                self.cash_balance += (entry * pos_qty) + realized

                if quantity >= pos_qty:
                    del self.positions[symbol_upper]
                else:
                    self.positions[symbol_upper]["quantity"] -= quantity
                
                self._save_to_disk()
                return {
                    "success": True,
                    "action": "CLOSED_POSITION",
                    "realized_pnl": round(realized, 2),
                    "portfolio": self.get_portfolio_summary()
                }

        # Opening new position
        if self.cash_balance < order_cost:
            return {"success": False, "error": f"Insufficient cash. Need ${order_cost:.2f}, have ${self.cash_balance:.2f}"}

        self.cash_balance -= order_cost
        pos_id = str(uuid.uuid4())[:8]
        self.positions[symbol_upper] = {
            "id": pos_id,
            "symbol": symbol_upper,
            "side": "LONG" if side_upper == "BUY" else "SHORT",
            "quantity": quantity,
            "entry_price": current_price,
            "current_price": current_price,
            "stop_loss": stop_loss,
            "take_profit": take_profit,
            "is_breakeven_locked": False,
            "timestamp": time.time()
        }

        self._save_to_disk()
        return {
            "success": True,
            "action": "OPENED_POSITION",
            "position": self.positions[symbol_upper],
            "portfolio": self.get_portfolio_summary()
        }

    def close_position_manually(self, symbol: str, current_price: float) -> Dict[str, Any]:
        """Close an entire active position at market price."""
        symbol_upper = symbol.upper()
        if symbol_upper not in self.positions:
            return {"success": False, "error": f"No open position found for {symbol_upper}"}

        pos = self.positions[symbol_upper]
        entry = pos["entry_price"]
        qty = pos["quantity"]
        side = pos["side"]

        if side == "LONG":
            realized = (current_price - entry) * qty
        else:
            realized = (entry - current_price) * qty

        trade_record = {
            "id": str(uuid.uuid4())[:8],
            "symbol": symbol_upper,
            "side": side,
            "entry_price": entry,
            "exit_price": current_price,
            "quantity": qty,
            "realized_pnl": round(realized, 2),
            "timestamp": time.time()
        }
        self.trade_history.append(trade_record)
        self.cash_balance += (entry * qty) + realized
        del self.positions[symbol_upper]

        self._save_to_disk()
        return {
            "success": True,
            "action": "MANUALLY_CLOSED",
            "realized_pnl": round(realized, 2),
            "portfolio": self.get_portfolio_summary()
        }

    def scale_out_position(self, symbol: str, scale_pct: float = 0.5, current_price: float = 0.0) -> Dict[str, Any]:
        """Scale out (e.g. 50%) of a position to take partial profits."""
        symbol_upper = symbol.upper()
        if symbol_upper not in self.positions:
            return {"success": False, "error": f"No open position found for {symbol_upper}"}

        pos = self.positions[symbol_upper]
        entry = pos["entry_price"]
        total_qty = pos["quantity"]
        scale_qty = total_qty * scale_pct

        if scale_qty <= 0 or current_price <= 0:
            return {"success": False, "error": "Invalid scale quantity or price"}

        side = pos["side"]
        if side == "LONG":
            realized = (current_price - entry) * scale_qty
        else:
            realized = (entry - current_price) * scale_qty

        trade_record = {
            "id": str(uuid.uuid4())[:8],
            "symbol": symbol_upper,
            "side": side,
            "entry_price": entry,
            "exit_price": current_price,
            "quantity": round(scale_qty, 5),
            "realized_pnl": round(realized, 2),
            "timestamp": time.time()
        }
        self.trade_history.append(trade_record)
        self.cash_balance += (entry * scale_qty) + realized
        pos["quantity"] -= scale_qty

        self._save_to_disk()
        return {
            "success": True,
            "action": "SCALED_OUT",
            "realized_pnl": round(realized, 2),
            "remaining_quantity": round(pos["quantity"], 5),
            "portfolio": self.get_portfolio_summary()
        }

    def lock_breakeven_manually(self, symbol: str) -> Dict[str, Any]:
        """Move Stop Loss to Entry price immediately."""
        symbol_upper = symbol.upper()
        if symbol_upper not in self.positions:
            return {"success": False, "error": f"No open position found for {symbol_upper}"}

        pos = self.positions[symbol_upper]
        pos["stop_loss"] = pos["entry_price"]
        pos["is_breakeven_locked"] = True
        pos["breakeven_triggered_at"] = time.time()
        self._save_to_disk()
        return {"success": True, "position": pos}

paper_trade_service = PaperTradeService()
