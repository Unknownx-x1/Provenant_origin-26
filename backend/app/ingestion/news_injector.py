from datetime import datetime, timezone
from collections import deque
from typing import Deque, Optional, Dict, Any, List
from backend.app.ingestion.event_bus import event_bus
from backend.app.ws.broadcaster import broadcaster

MAX_NEWS_HISTORY = 20
news_history: Deque[Dict[str, Any]] = deque(maxlen=MAX_NEWS_HISTORY)


def get_news_history() -> List[Dict[str, Any]]:
    """Return newest-first market-news events for newly connected clients."""
    return list(reversed(news_history))


def reset_news_history() -> None:
    news_history.clear()

async def inject_news(
    asset: str = "AAPL",
    headline: str = "Apple raises Q3 guidance and beats revenue expectations",
    source: str = "Reuters (Simulated)",
    sentiment: str = "positive",
    confidence: float = 0.91,
    weight: float = 0.35,
    impact: str = "SUPPORTS BUY AAPL",
    status: str = "ACTIVE",
    contradicts: Optional[str] = None,
    decision_id: Optional[str] = None
) -> Dict[str, Any]:
    sentiment = sentiment.lower()
    if sentiment not in {"positive", "negative", "neutral"}:
        raise ValueError("sentiment must be positive, negative, or neutral")

    # Keep the existing `contradicts` field while resolving the UI-friendly
    # "latest" shorthand to the concrete decision that it refers to.
    if contradicts == "latest" and not decision_id:
        from backend.app.audit.ledger import ledger
        if ledger.decisions:
            decision_id = ledger.decisions[-1].decision_id

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
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    if contradicts:
        news_event["contradicts"] = decision_id or contradicts
    if decision_id:
        news_event["decision_id"] = decision_id

    news_history.append(news_event)
    await event_bus.market_events.put(news_event)
    await broadcaster.broadcast("MARKET_NEWS", news_event)
    return news_event

