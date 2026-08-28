def determine_action(decision) -> str:
    validity = getattr(decision, "validity_score", 0.91)
    threshold = getattr(decision, "validity_threshold", 0.60)

    if validity >= threshold:
        return "HOLD"
    if validity >= threshold * 0.75:
        return "REDUCE"
    return "REVERSE"

def apply_action(decision) -> str:
    action = determine_action(decision)
    if action == "HOLD":
        return "HOLD"

    decision.status = action
    return action
