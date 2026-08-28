from datetime import datetime, timezone
from typing import Optional, Dict, Any
from backend.app.ingestion.event_bus import event_bus

async def inject_news(
    asset: str = "AAPL",
    headline: str = "Apple raises Q3 guidance and beats revenue expectations",
    source: str = "Reuters (Simulated)",
    sentiment: str = "positive",
    confidence: float = 0.91,
    weight: float = 0.35,
    impact: str = "SUPPORTS BUY AAPL",
    status: str = "ACTIVE",
    contradicts: Optional[str] = None
) -> Dict[str, Any]:
    news_event = {
        "type": "news",
        "asset": asset,
        "headline": headline,
        "source": source,
        "sentiment": sentiment,
        "confidence": confidence,
        "weight": weight,
        "impact": impact,
        "status": status,
        "contradicts": contradicts,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    await event_bus.market_events.put(news_event)
    return news_event

