import asyncio
import random
from datetime import datetime, timezone
from backend.app.ingestion.event_bus import event_bus

current_market_tick = {
    "asset": "AAPL",
    "price": 228.40,
    "volume": 7450000,
    "change_pct": 1.18,
    "timestamp": datetime.now(timezone.utc).isoformat()
}
market_price_history = [
    {"time": "16:00:00", "price": 227.10},
    {"time": "16:01:00", "price": 227.45},
    {"time": "16:02:00", "price": 227.80},
    {"time": "16:03:00", "price": 228.15},
    {"time": "16:04:00", "price": 228.25},
    {"time": "16:05:00", "price": 228.40}
]

async def market_simulator():
    global current_market_tick, market_price_history
    price = 228.40
    volume = 7450000

    while True:
        try:
            # Synthetic stock price walk around 228.40
            price += random.uniform(-0.15, 0.15)
            price = round(max(220.0, min(235.0, price)), 2)
            volume += random.randint(100, 5000)
            now_iso = datetime.now(timezone.utc).isoformat()
            time_str = datetime.now(timezone.utc).strftime("%H:%M:%S")

            current_market_tick = {
                "asset": "AAPL",
                "price": price,
                "volume": volume,
                "change_pct": round(((price - 225.73) / 225.73) * 100, 2),
                "timestamp": now_iso
            }

            market_price_history.append({"time": time_str, "price": price})
            if len(market_price_history) > 20:
                market_price_history = market_price_history[-20:]

            price_event = {
                "type": "price",
                "asset": "AAPL",
                "price": price,
                "volume": volume,
                "change_pct": round(((price - 225.73) / 225.73) * 100, 2),
                "timestamp": now_iso
            }

            orderbook_event = {
                "type": "orderbook",
                "asset": "AAPL",
                "bid_volume": random.randint(5000, 12000),
                "ask_volume": random.randint(3000, 8000),
                "timestamp": now_iso
            }

            await event_bus.market_events.put(price_event)
            await event_bus.market_events.put(orderbook_event)

            await asyncio.sleep(2)
        except Exception:
            await asyncio.sleep(1)


