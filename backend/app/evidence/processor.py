import uuid
from datetime import datetime, timezone
from backend.app.evidence.models import EvidenceNodeInternal
from backend.app.ingestion.event_bus import event_bus
from backend.app.evidence.trust import trust_engine

class EvidenceProcessor:
    async def process_market_event(self, event: dict) -> EvidenceNodeInternal:
        event_type = event.get("type")
        now = datetime.now(timezone.utc)

        if event_type == "price":
            node = EvidenceNodeInternal(
                id=f"ev_{uuid.uuid4().hex[:6]}",
                type="momentum",
                source="RSI_14",
                captured_at=now,
                base_weight=0.25,
                trust_score=trust_engine.get_source_trust("RSI_14"),
                value=f"RSI {event.get('rsi', 64.2)} Bullish Momentum",
                status="ACTIVE"
            )
            await event_bus.evidence_events.put(node)
            return node

        elif event_type == "orderbook":
            node = EvidenceNodeInternal(
                id=f"ev_{uuid.uuid4().hex[:6]}",
                type="orderbook",
                source="OrderBook Depth Proxy",
                captured_at=now,
                base_weight=0.25,
                trust_score=trust_engine.get_source_trust("Depth Proxy"),
                value=f"Bid/Ask Depth Proxy ({event.get('bid_volume', 8500)} / {event.get('ask_volume', 4200)})",
                status="ACTIVE"
            )
            await event_bus.evidence_events.put(node)
            return node

        elif event_type == "news":
            sentiment = event.get("sentiment", "positive")
            headline = event.get("headline", "Apple raises Q3 guidance")
            source = event.get("source", "Reuters (Simulated)")
            confidence = event.get("confidence", 0.91)
            weight = event.get("weight", 0.35)
            is_contradicted = bool(event.get("contradicts")) or (sentiment == "negative")

            impact = event.get("impact")
            if not impact:
                impact = "CONTRADICTS BUY AAPL" if is_contradicted else "SUPPORTS BUY AAPL"

            status = "CONTRADICTED" if is_contradicted else "ACTIVE"

            node = EvidenceNodeInternal(
                id=f"ev_{uuid.uuid4().hex[:6]}",
                type="news",
                source=source,
                captured_at=now,
                base_weight=weight,
                trust_score=confidence,
                sentiment=sentiment,
                contradicted=is_contradicted,
                headline=headline,
                confidence=confidence,
                impact=impact,
                status=status,
                value=f"{headline} ({status})"
            )

            if is_contradicted:
                await event_bus.decision_evidence_events.put(node)
            else:
                await event_bus.evidence_events.put(node)
            return node

        return None

evidence_processor = EvidenceProcessor()

