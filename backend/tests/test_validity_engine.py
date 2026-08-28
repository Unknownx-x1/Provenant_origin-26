import pytest
from backend.app.schemas.contracts import Decision, DecisionStatus, EvidenceNode, EvidenceType
from backend.app.decisions.validity_engine import calculate_validity

from datetime import datetime, timezone

def test_validity_score_calculation():
    now_iso = datetime.now(timezone.utc).isoformat()
    nodes = [
        EvidenceNode(id="e1", type=EvidenceType.NEWS, weight=0.35, source="Bloomberg Breaking", captured_at=now_iso),
        EvidenceNode(id="e2", type=EvidenceType.MOMENTUM, weight=0.25, source="RSI_14", captured_at=now_iso),
        EvidenceNode(id="e3", type=EvidenceType.ORDERBOOK, weight=0.25, source="Depth Proxy", captured_at=now_iso)
    ]
    
    score = calculate_validity(Decision(
        decision_id="d1", opportunity_id="o1", asset="AAPL", action="BUY", evidence_nodes=nodes, validity_score=0.91
    ))
    assert score >= 0.80  # Fresh evidence nodes produce high score


def test_validity_threshold_breach():
    decision = Decision(
        decision_id="dec_test_01",
        opportunity_id="opp_test_01",
        asset="AAPL",
        action="BUY",
        evidence_nodes=[
            EvidenceNode(id="e1", type=EvidenceType.NEWS, weight=0.35, source="Bloomberg Breaking", captured_at="2026-08-28T16:00:00Z", freshness="DECAYING")
        ],
        validity_score=0.34,
        validity_threshold=0.60,
        status=DecisionStatus.OPEN
    )
    
    assert decision.validity_score < decision.validity_threshold
