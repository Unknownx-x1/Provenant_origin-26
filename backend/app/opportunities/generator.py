import uuid
import asyncio
from backend.app.ingestion.event_bus import event_bus

latest_evidence = {}
opportunity_active = False

async def opportunity_generator():
    global opportunity_active

    while True:
        try:
            evidence = await asyncio.wait_for(event_bus.evidence_events.get(), timeout=1.0)
            latest_evidence[evidence.type] = evidence
            
            required_evidence = ["news", "momentum", "orderbook"]

            if opportunity_active:
                continue

            if all(e_type in latest_evidence for e_type in required_evidence):
                news_evidence = latest_evidence["news"]
                if getattr(news_evidence, "sentiment", None) != "positive":
                    continue

                opportunity = {
                    "opportunity_id": str(uuid.uuid4()),
                    "asset": "BTC-USD",
                    "action": "BUY",
                    "evidence_nodes": [
                        latest_evidence["news"],
                        latest_evidence["momentum"],
                        latest_evidence["orderbook"]
                    ],
                    "strategy_template_id": "news_momentum_v1"
                }

                opportunity_active = True
                await event_bus.opportunity_events.put(opportunity)

        except asyncio.TimeoutError:
            await asyncio.sleep(0.1)
