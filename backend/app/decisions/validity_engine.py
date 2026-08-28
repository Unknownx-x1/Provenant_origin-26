from backend.app.evidence.decay import get_effective_weight

def calculate_adaptive_threshold(regime: str = "HIGH_VOLATILITY") -> float:
    regime_upper = str(regime).upper()
    if "HIGH" in regime_upper or "VOLATILE" in regime_upper:
        return 0.60
    return 0.45

def calculate_validity(decision) -> float:
    nodes = getattr(decision, "evidence_nodes", [])
    if not nodes:
        return 0.0

    total_weight = sum(getattr(e, "base_weight", getattr(e, "weight", 0.33)) for e in nodes)
    effective_weight = sum(get_effective_weight(e) for e in nodes)

    if total_weight == 0:
        return 0.0

    # If supporting premise is contradicted, apply thesis invalidation penalty
    has_contradiction = any(
        getattr(e, "contradicted", False) or getattr(e, "freshness", "") == "CONTRADICTED" or getattr(e, "status", "") == "CONTRADICTED"
        for e in nodes
    )
    if has_contradiction:
        effective_weight *= 0.50

    validity = effective_weight / total_weight
    return round(validity, 2)

def update_decision_validity(decision, regime: str = "HIGH_VOLATILITY") -> float:
    new_validity = calculate_validity(decision)
    decision.validity_score = new_validity
    decision.validity_threshold = calculate_adaptive_threshold(regime)
    return new_validity


