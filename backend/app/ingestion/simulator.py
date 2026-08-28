import asyncio
import random
from datetime import datetime
from backend.app.ingestion.event_bus import event_bus

async def market_simulator():
    price = 64000.0

    while True:
        try:
            price += random.uniform(-10, 10)
            price_event = {
                "type": "price",
                "asset": "BTC-USD",
                "price": round(price, 2),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

            orderbook_event = {
                "type": "orderbook",
                "asset": "BTC-USD",
                "bid_volume": random.randint(5000, 10000),
                "ask_volume": random.randint(1000, 8000),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

            await event_bus.market_events.put(price_event)
            await event_bus.market_events.put(orderbook_event)

            await asyncio.sleep(2)
        except Exception:
            await asyncio.sleep(1)
