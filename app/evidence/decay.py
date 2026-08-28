import math
from datetime import datetime

from app.evidence.models import EvidenceNode


HALF_LIVES = {
    "news": 240,        # 4 minutes
    "orderbook": 20,    # 20 seconds
    "momentum": 90      # 90 seconds
}


def get_decay_factor(evidence: EvidenceNode) -> float:
    half_life = HALF_LIVES.get(evidence.type)

    if half_life is None:
        return 1.0

    age_seconds = (
        datetime.now() - evidence.captured_at
    ).total_seconds()

    decay_factor = 0.5 ** (
        age_seconds / half_life
    )

    return max(0.0, min(1.0, decay_factor))


def get_effective_weight(evidence: EvidenceNode) -> float:
    if evidence.contradicted:
        return 0.0

    decay = get_decay_factor(evidence)

    return (
        evidence.base_weight
        * decay
        * evidence.trust_score
    )