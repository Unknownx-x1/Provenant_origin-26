import uuid
from datetime import datetime
from backend.app.evidence.models import EvidenceNodeInternal
from backend.app.ingestion.event_bus import event_bus

class EvidenceProcessor:
    async def process_market_event(self, event: dict):
        event_type = event.get("type")
        
        if event_type == "price":
            node = EvidenceNodeInternal(
                id=f"ev_{uuid.uuid4().hex[:6]}",
                type="momentum",
                source="RSI_14",
                captured_at=datetime.utcnow(),
                base_weight=0.25,
                trust_score=1.0
            )
            await event_bus.evidence_events.put(node)

        elif event_type == "orderbook":
            node = EvidenceNodeInternal(
                id=f"ev_{uuid.uuid4().hex[:6]}",
                type="orderbook",
                source="OrderBook Depth Proxy",
                captured_at=datetime.utcnow(),
                base_weight=0.25,
                trust_score=1.0
            )
            await event_bus.evidence_events.put(node)

        elif event_type == "news":
            node = EvidenceNodeInternal(
                id=f"ev_{uuid.uuid4().hex[:6]}",
                type="news",
                source="Breaking News Stream",
                captured_at=datetime.utcnow(),
                base_weight=0.35,
                trust_score=1.0,
                sentiment=event.get("sentiment", "positive"),
                contradicted=bool(event.get("contradicts"))
            )
            if event.get("contradicts"):
                await event_bus.decision_evidence_events.put(node)
            else:
                await event_bus.evidence_events.put(node)

evidence_processor = EvidenceProcessor()
