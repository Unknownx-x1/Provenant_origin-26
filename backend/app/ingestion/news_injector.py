from datetime import datetime, timezone
from typing import Optional
from backend.app.ingestion.event_bus import event_bus

async def inject_news(
    asset: str = "AAPL",
    headline: str = "Positive Earnings & Market Expansion",
    sentiment: str = "positive",
    contradicts: Optional[str] = None
):
    news_event = {
        "type": "news",
        "asset": asset,
        "headline": headline,
        "sentiment": sentiment,
        "contradicts": contradicts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    await event_bus.market_events.put(news_event)
    return news_event

