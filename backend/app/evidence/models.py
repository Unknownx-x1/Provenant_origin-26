from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Any

@dataclass
class EvidenceNodeInternal:
    id: str
    type: str  # news | orderbook | momentum | volatility
    source: str
    captured_at: datetime
    base_weight: float
    trust_score: float = 1.0
    contradicted: bool = False
    freshness: str = "FRESH"
    sentiment: Optional[str] = None
    headline: Optional[str] = None
    confidence: Optional[float] = 0.91
    impact: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    value: Optional[Any] = None

