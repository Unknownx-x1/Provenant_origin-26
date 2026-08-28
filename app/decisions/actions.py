def determine_action(decision) -> str:
    validity = decision.validity_score
    threshold = decision.validity_threshold

    if validity >= threshold:
        return "HOLD"

    if validity >= threshold * 0.75:
        return "REDUCE"

    return "REVERSE"


def apply_action(decision):
    action = determine_action(decision)

    if action == "HOLD":
        return None

    decision.status = action

    print("\n🚨 DECISION ACTION TRIGGERED")
    print(f"Decision: {decision.decision_id}")
    print(f"Validity: {decision.validity_score}")
    print(f"Threshold: {decision.validity_threshold}")
    print(f"Action: {action}")

    return action