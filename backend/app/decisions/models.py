from dataclasses import dataclass, field
from typing import List, Any
from backend.app.config import config

@dataclass
class DecisionInternal:
    decision_id: str
    opportunity_id: str
    asset: str
    action: str
    evidence_nodes: List[Any]
    validity_score: float = 0.91
    validity_threshold: float = config.hold_threshold_high_vol
    status: str = "OPEN"
    strategy_template_id: str = "news_momentum_v1"
    allocation: float = config.min_allocation_pct
