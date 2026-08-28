from dataclasses import dataclass
from typing import List

from app.evidence.models import EvidenceNode


@dataclass
class Decision:
    decision_id: str
    opportunity_id: str

    asset: str
    action: str

    evidence_nodes: List[EvidenceNode]

    validity_score: float
    validity_threshold: float

    status: str

    strategy_template_id: str
    allocation: float