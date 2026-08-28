import uuid
from datetime import datetime

from app.ingestion.event_bus import event_bus
from app.evidence.models import EvidenceNode


previous_prices = {}


async def evidence_processor():
    while True:
        event = await event_bus.market_events.get()

        evidence = None

        # NEWS → Evidence
        if event["type"] == "news":
            evidence = EvidenceNode(
                id=str(uuid.uuid4()),
                type="news",
                source="news_injector",
                captured_at=datetime.fromisoformat(
                    event["timestamp"]
                ),
                base_weight=0.35
            )

            # Store news sentiment
            evidence.sentiment = event["sentiment"]

            # Mark negative news as contradictory
            evidence.contradictory = (
                event["sentiment"] == "negative"
            )

        # ORDERBOOK → Evidence
        elif event["type"] == "orderbook":
            evidence = EvidenceNode(
                id=str(uuid.uuid4()),
                type="orderbook",
                source="market_simulator",
                captured_at=datetime.fromisoformat(
                    event["timestamp"]
                ),
                base_weight=0.35
            )

        # PRICE → Compare with previous price → MOMENTUM
        elif event["type"] == "price":
            asset = event["asset"]
            current_price = event["price"]

            if asset in previous_prices:
                previous_price = previous_prices[asset]

                if current_price > previous_price:
                    evidence = EvidenceNode(
                        id=str(uuid.uuid4()),
                        type="momentum",
                        source="market_simulator",
                        captured_at=datetime.fromisoformat(
                            event["timestamp"]
                        ),
                        base_weight=0.30
                    )

                    print(
                        f"POSITIVE MOMENTUM: "
                        f"{previous_price} → {current_price}"
                    )

            previous_prices[asset] = current_price

        # Send evidence to opportunity generation
        if evidence:
            await event_bus.evidence_events.put(evidence)

            print(
                f"EVIDENCE CREATED: "
                f"{evidence.type} | "
                f"weight={evidence.base_weight}"
            )

            # Send contradictory evidence to active decisions
            if getattr(evidence, "contradictory", False):
                await event_bus.decision_evidence_events.put(
                    evidence
                )

                print(
                    "⚠️ CONTRADICTORY EVIDENCE SENT "
                    "TO DECISION MONITOR"
                )