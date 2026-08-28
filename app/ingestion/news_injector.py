from datetime import datetime
from app.ingestion.event_bus import event_bus


async def inject_news(
    asset: str,
    headline: str,
    sentiment: str,
    contradicts: str | None = None
):
    news_event = {
        "type": "news",
        "asset": asset,
        "headline": headline,
        "sentiment": sentiment,
        "contradicts": contradicts,
        "timestamp": datetime.now().isoformat()
    }

    await event_bus.market_events.put(news_event)

    print("NEWS INJECTED:", news_event)