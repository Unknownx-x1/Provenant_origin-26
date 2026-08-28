from dataclasses import dataclass
from datetime import datetime


@dataclass
class EvidenceNode:
    id: str
    type: str
    source: str
    captured_at: datetime

    base_weight: float
    trust_score: float = 1.0

    contradicted: bool = False