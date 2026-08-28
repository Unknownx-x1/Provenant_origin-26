from app.evidence.decay import get_effective_weight


def calculate_validity(decision) -> float:
    total_weight = sum(
        evidence.base_weight
        for evidence in decision.evidence_nodes
    )

    effective_weight = sum(
        get_effective_weight(evidence)
        for evidence in decision.evidence_nodes
    )

    if total_weight == 0:
        return 0.0

    validity = effective_weight / total_weight

    return round(validity, 2)


def update_decision_validity(decision):
    old_validity = decision.validity_score

    new_validity = calculate_validity(decision)

    decision.validity_score = new_validity

    print(
        f"\nVALIDITY UPDATED: "
        f"{old_validity} → {new_validity}"
    )

    return new_validity