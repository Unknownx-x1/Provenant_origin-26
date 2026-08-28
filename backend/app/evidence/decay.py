import math
from datetime import datetime
from backend.app.evidence.models import EvidenceNodeInternal

HALF_LIVES = {
    "news": 240,        # 4 minutes (240 sec)
    "orderbook": 20,    # 20 seconds
    "momentum": 90,     # 90 seconds
    "volatility": 180   # 180 seconds
}

def get_decay_factor(evidence: EvidenceNodeInternal) -> float:
    half_life = HALF_LIVES.get(evidence.type)
    if half_life is None:
        return 1.0

    age_seconds = (datetime.utcnow() - evidence.captured_at).total_seconds()
    if age_seconds < 0:
        age_seconds = 0.0

    decay_factor = 0.5 ** (age_seconds / half_life)
    return max(0.0, min(1.0, decay_factor))

def get_effective_weight(evidence: EvidenceNodeInternal) -> float:
    if evidence.contradicted:
        return 0.0

    decay = get_decay_factor(evidence)
    return evidence.base_weight * decay * evidence.trust_score
