import math
from datetime import datetime

HALF_LIVES = {
    "news": 240,        # 4 minutes (240 sec)
    "orderbook": 20,    # 20 seconds
    "momentum": 90,     # 90 seconds
    "volatility": 180   # 180 seconds
}

def get_decay_factor(evidence) -> float:
    e_type = getattr(evidence, "type", "news")
    if hasattr(e_type, "value"):
        e_type = e_type.value.lower()
    else:
        e_type = str(e_type).lower()

    half_life = HALF_LIVES.get(e_type, 180)

    captured_at = getattr(evidence, "captured_at", None)
    if isinstance(captured_at, str):
        try:
            captured_at = datetime.fromisoformat(captured_at.replace("Z", ""))
        except Exception:
            captured_at = datetime.utcnow()

    if not isinstance(captured_at, datetime):
        captured_at = datetime.utcnow()

    age_seconds = (datetime.utcnow() - captured_at).total_seconds()
    if age_seconds < 0:
        age_seconds = 0.0

    decay_factor = 0.5 ** (age_seconds / half_life)
    return max(0.0, min(1.0, decay_factor))

def get_effective_weight(evidence) -> float:
    if getattr(evidence, "contradicted", False):
        return 0.0

    freshness = getattr(evidence, "freshness", "FRESH")
    if freshness == "DECAYING" and getattr(evidence, "type", "") == "NEWS":
        return 0.10  # Contradicted / decaying news penalty

    decay = get_decay_factor(evidence)
    base_weight = getattr(evidence, "base_weight", getattr(evidence, "weight", 0.33))
    trust_score = getattr(evidence, "trust_score", 1.0)
    return base_weight * decay * trust_score
