import asyncio
import random
from datetime import datetime

from app.ingestion.event_bus import event_bus


async def market_simulator():
    price = 100.0

    while True:
        # Simulate price movement
        price += random.uniform(-1, 1)

        price_event = {
            "type": "price",
            "asset": "ASSET_A",
            "price": round(price, 2),
            "timestamp": datetime.now().isoformat()
        }

        # Simulate order book
        orderbook_event = {
            "type": "orderbook",
            "asset": "ASSET_A",
            "bid_volume": random.randint(5000, 10000),
            "ask_volume": random.randint(1000, 8000),
            "timestamp": datetime.now().isoformat()
        }

        await event_bus.market_events.put(price_event)
        await event_bus.market_events.put(orderbook_event)

        print("Generated:", price_event)
        print("Generated:", orderbook_event)

        await asyncio.sleep(1)