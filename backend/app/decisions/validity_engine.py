from backend.app.evidence.decay import get_effective_weight

def calculate_validity(decision) -> float:
    nodes = getattr(decision, "evidence_nodes", [])
    if not nodes:
        return 0.0

    total_weight = sum(getattr(e, "base_weight", getattr(e, "weight", 0.33)) for e in nodes)
    effective_weight = sum(get_effective_weight(e) for e in nodes)

    if total_weight == 0:
        return 0.0

    validity = effective_weight / total_weight
    return round(validity, 2)

def update_decision_validity(decision) -> float:
    new_validity = calculate_validity(decision)
    decision.validity_score = new_validity
    return new_validity
