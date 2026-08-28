import uuid
import asyncio
from typing import Dict, Any
from backend.app.ingestion.event_bus import event_bus
from backend.app.research_sleeve.strategy_pool import strategy_pool_manager
from backend.app.schemas.contracts import EvidenceNode, EvidenceType

latest_evidence: Dict[str, Any] = {}
opportunity_active: bool = False

def reset_opportunity_state():
    global opportunity_active, latest_evidence
    opportunity_active = False
    latest_evidence.clear()

def set_opportunity_active(active: bool):
    global opportunity_active
    opportunity_active = active

async def opportunity_generator():
    global opportunity_active

    while True:
        try:
            evidence = await asyncio.wait_for(event_bus.evidence_events.get(), timeout=1.0)
            e_type = getattr(evidence, "type", "")
            if hasattr(e_type, "value"):
                e_type = e_type.value.lower()
            else:
                e_type = str(e_type).lower()

            latest_evidence[e_type] = evidence

            required_evidence = ["news", "momentum", "orderbook"]

            if opportunity_active:
                continue

            if all(k in latest_evidence for k in required_evidence):
                news_evidence = latest_evidence["news"]
                if getattr(news_evidence, "sentiment", "positive") != "positive" or getattr(news_evidence, "contradicted", False):
                    continue

                # Query active strategy pool (Closed-Loop Outer Loop Integration)
                active_pool = strategy_pool_manager.get_active_pool()
                active_strategy_id = "news_momentum_v1"
                if active_pool:
                    # Select the latest promoted active strategy
                    active_strategy_id = active_pool[-1].strategy_template_id

                # Format evidence nodes
                nodes = []
                for k in required_evidence:
                    item = latest_evidence[k]
                    e_enum = EvidenceType.NEWS if k == "news" else (EvidenceType.MOMENTUM if k == "momentum" else EvidenceType.ORDERBOOK)
                    node_id = getattr(item, "id", f"ev_{uuid.uuid4().hex[:6]}")
                    weight = getattr(item, "base_weight", getattr(item, "weight", 0.33))
                    source = getattr(item, "source", "Stream")
                    val = getattr(item, "value", None)
                    headline = getattr(item, "headline", None)
                    sentiment = getattr(item, "sentiment", None)
                    confidence = getattr(item, "confidence", getattr(item, "trust_score", 0.91))
                    impact = getattr(item, "impact", None)
                    status = getattr(item, "status", "ACTIVE")

                    nodes.append(EvidenceNode(
                        id=node_id,
                        type=e_enum,
                        weight=weight,
                        source=source,
                        value=val,
                        headline=headline,
                        sentiment=sentiment,
                        confidence=confidence,
                        impact=impact,
                        status=status,
                        freshness="FRESH"
                    ))

                # Add volatility regime node
                nodes.append(EvidenceNode(
                    id=f"ev_{uuid.uuid4().hex[:6]}",
                    type=EvidenceType.VOLATILITY,
                    weight=0.15,
                    source="VIX Regime Modifier",
                    value="Normal Volatility",
                    impact="Regime Modifier",
                    status="ACTIVE",
                    freshness="FRESH"
                ))

                opp_id = f"opp_{uuid.uuid4().hex[:6]}"
                opportunity = {
                    "opportunity_id": opp_id,
                    "asset": "AAPL",
                    "action": "BUY",
                    "evidence_nodes": nodes,
                    "strategy_template_id": active_strategy_id
                }

                opportunity_active = True
                await event_bus.opportunity_events.put(opportunity)

        except asyncio.CancelledError:
            break
        except asyncio.TimeoutError:
            await asyncio.sleep(0.1)
        except Exception:
            await asyncio.sleep(0.1)

