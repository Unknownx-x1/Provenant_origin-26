import asyncio
import random
from datetime import datetime, timezone
from typing import List, Dict, Any
from backend.app.ingestion.event_bus import event_bus
from backend.app.ws.broadcaster import broadcaster

# Authoritative backend update interval (Default: 10 seconds)
market_update_interval_sec: float = 10.0

current_market_tick: Dict[str, Any] = {
    "asset": "AAPL",
    "price": 228.40,
    "volume": 7450000,
    "change_pct": 1.18,
    "bid": 228.38,
    "ask": 228.42,
    "spread": 0.04,
    "rsi": 64.2,
    "vwap": 228.25,
    "regime": "HIGH_VOLATILITY",
    "interval_sec": 10.0,
    "timestamp": datetime.now(timezone.utc).isoformat()
}

market_price_history: List[Dict[str, Any]] = [
    {"time": "16:00:00", "price": 227.10},
    {"time": "16:01:00", "price": 227.45},
    {"time": "16:02:00", "price": 227.80},
    {"time": "16:03:00", "price": 228.15},
    {"time": "16:04:00", "price": 228.25},
    {"time": "16:05:00", "price": 228.40}
]

def calculate_rsi(prices: List[float], period: int = 14) -> float:
    if len(prices) < 2:
        return 50.0
    changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    if not changes:
        return 50.0
    gains = [c for c in changes if c > 0]
    losses = [-c for c in changes if c < 0]
    avg_gain = sum(gains) / max(1, len(gains)) if gains else 0.0
    avg_loss = sum(losses) / max(1, len(losses)) if losses else 0.0001
    rs = avg_gain / avg_loss
    rsi = 100.0 - (100.0 / (1.0 + rs))
    return round(max(10.0, min(90.0, rsi)), 1)

def set_market_interval(interval_sec: float) -> float:
    global market_update_interval_sec
    market_update_interval_sec = max(1.0, float(interval_sec))
    current_market_tick["interval_sec"] = market_update_interval_sec
    return market_update_interval_sec

def simulate_price_step(step_delta: float = None) -> Dict[str, Any]:
    global current_market_tick, market_price_history
    price = current_market_tick.get("price", 228.40)
    base_price = 225.73
    volume = current_market_tick.get("volume", 7450000) + random.randint(1000, 15000)

    if step_delta is None:
        step_delta = random.uniform(-0.35, 0.35)
    price = round(max(215.0, min(245.0, price + step_delta)), 2)

    now_iso = datetime.now(timezone.utc).isoformat()
    time_str = datetime.now(timezone.utc).strftime("%H:%M:%S")

    market_price_history.append({"time": time_str, "price": price})
    if len(market_price_history) > 30:
        market_price_history = market_price_history[-30:]

    prices = [h["price"] for h in market_price_history]
    rsi = calculate_rsi(prices)
    vwap = round(sum(prices) / len(prices), 2)
    bid = round(price - 0.02, 2)
    ask = round(price + 0.02, 2)
    change_pct = round(((price - base_price) / base_price) * 100, 2)

    current_market_tick = {
        "asset": "AAPL",
        "price": price,
        "volume": volume,
        "change_pct": change_pct,
        "bid": bid,
        "ask": ask,
        "spread": round(ask - bid, 2),
        "rsi": rsi,
        "vwap": vwap,
        "regime": "HIGH_VOLATILITY",
        "interval_sec": market_update_interval_sec,
        "timestamp": now_iso
    }
    return current_market_tick

async def market_simulator():
    global current_market_tick, market_price_history
    while True:
        try:
            tick = simulate_price_step()
            now_iso = tick["timestamp"]
            price_event = {
                "type": "price",
                "asset": "AAPL",
                "price": tick["price"],
                "volume": tick["volume"],
                "change_pct": tick["change_pct"],
                "rsi": tick["rsi"],
                "vwap": tick["vwap"],
                "timestamp": now_iso
            }

            orderbook_event = {
                "type": "orderbook",
                "asset": "AAPL",
                "bid": tick["bid"],
                "ask": tick["ask"],
                "bid_volume": random.randint(4000, 15000),
                "ask_volume": random.randint(3000, 10000),
                "timestamp": now_iso
            }

            await event_bus.market_events.put(price_event)
            await event_bus.market_events.put(orderbook_event)
            await broadcaster.broadcast("MARKET_TICK", current_market_tick)

            await asyncio.sleep(market_update_interval_sec)
        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(1)



