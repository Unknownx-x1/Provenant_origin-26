from backend.app.config import config

def determine_action(decision) -> str:
    validity = getattr(decision, "validity_score", 0.0)
    threshold = getattr(decision, "validity_threshold", config.hold_threshold_high_vol)
    reduce_threshold = threshold * config.reduce_threshold_ratio

    if validity >= threshold:
        return "HOLD"
    if validity >= reduce_threshold:
        return "REDUCE"
    return "REVERSE"

def apply_action(decision) -> str:
    action = determine_action(decision)
    if action == "HOLD":
        return "HOLD"

    decision.status = action
    return action
