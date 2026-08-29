import pytest

from backend.app.audit.ledger import ledger
from backend.app.decisions.engine import decision_engine
from backend.app.execution.executor import executor
from backend.app.opportunities.generator import determine_initial_action
from backend.app.schemas.contracts import DecisionStatus, EvidenceNode, EvidenceType


def node(node_id, evidence_type, weight, value, sentiment=None):
    return EvidenceNode(id=node_id, type=evidence_type, weight=weight, source="test", value=value, sentiment=sentiment, confidence=1.0)


def test_initial_action_uses_weighted_evidence_direction():
    buy, buy_strength = determine_initial_action([
        node("n", EvidenceType.NEWS, .35, "supports buy", "positive"),
        node("m", EvidenceType.MOMENTUM, .25, "Bullish Momentum"),
        node("o", EvidenceType.ORDERBOOK, .25, "Buyer Imbalance"),
    ])
    sell, sell_strength = determine_initial_action([
        node("n", EvidenceType.NEWS, .35, "supports sell", "negative"),
        node("m", EvidenceType.MOMENTUM, .25, "Bearish Momentum"),
        node("o", EvidenceType.ORDERBOOK, .25, "Seller Imbalance"),
    ])
    assert (buy, buy_strength) == ("BUY", 1.0)
    assert (sell, sell_strength) == ("SELL", 1.0)
    assert determine_initial_action([
        node("n", EvidenceType.NEWS, .35, "neutral", "neutral"),
        node("m", EvidenceType.MOMENTUM, .25, "Bullish Momentum"),
        node("o", EvidenceType.ORDERBOOK, .25, "Seller Imbalance"),
    ])[0] == "HOLD"


@pytest.mark.anyio
async def test_reduce_and_reverse_change_simulated_position():
    ledger.reset()
    executor.positions.clear()
    decision_engine.active_decision = None
    decision = await decision_engine.handle_opportunity({
        "opportunity_id": "opp_track_a",
        "asset": "AAPL",
        "action": "BUY",
        "signal_strength": 1.0,
        "evidence_nodes": [
            node("news", EvidenceType.NEWS, .1, "supports buy", "positive"),
            node("momentum", EvidenceType.MOMENTUM, .9, "Bullish Momentum"),
        ],
    })
    assert decision and decision.allocation < .20
    original_allocation = decision.allocation

    decision.evidence_nodes[0].contradicted = True
    decision.evidence_nodes[0].freshness = "CONTRADICTED"
    await decision_engine.handle_contradictory_evidence(decision.evidence_nodes[0])
    assert decision.status == DecisionStatus.REDUCED
    assert decision.allocation < original_allocation
    assert executor.positions["AAPL"]["action"] == "BUY"

    decision.evidence_nodes[1].contradicted = True
    decision.evidence_nodes[1].freshness = "CONTRADICTED"
    await decision_engine.handle_contradictory_evidence(decision.evidence_nodes[0])
    assert decision.status == DecisionStatus.REVERSED
    assert decision.action == "SELL"
    assert executor.positions["AAPL"]["action"] == "SELL"
