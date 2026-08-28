from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class EvidenceNodeInternal:
    id: str
    type: str  # news | orderbook | momentum | volatility
    source: str
    captured_at: datetime
    base_weight: float
    trust_score: float = 1.0
    contradicted: bool = False
    sentiment: Optional[str] = None
