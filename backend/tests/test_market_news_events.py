import pytest

from backend.app.ingestion.news_injector import (
    get_news_history,
    inject_news,
    reset_news_history,
)
from backend.app.ws.broadcaster import broadcaster


@pytest.mark.anyio
async def test_injected_market_news_has_live_feed_contract_and_is_broadcast(monkeypatch):
    reset_news_history()
    broadcasts = []

    async def capture_broadcast(event_type, data):
        broadcasts.append((event_type, data))

    monkeypatch.setattr(broadcaster, "broadcast", capture_broadcast)

    event = await inject_news(
        asset="AAPL",
        headline="Apple confirms a new supply agreement",
        sentiment="negative",
        source="Test wire",
        contradicts="latest",
        decision_id="dec_123abc",
    )

    assert event["headline"] == "Apple confirms a new supply agreement"
    assert event["sentiment"] == "negative"
    assert event["asset"] == "AAPL"
    assert event["source"] == "Test wire"
    assert event["timestamp"]
    assert event["contradicts"] == "dec_123abc"
    assert event["decision_id"] == "dec_123abc"
    assert broadcasts == [("MARKET_NEWS", event)]
    assert get_news_history() == [event]

@pytest.mark.anyio
async def test_reset_clears_market_news_history():
    reset_news_history()
    await inject_news(headline="Temporary market news")
    reset_news_history()
    assert get_news_history() == []
