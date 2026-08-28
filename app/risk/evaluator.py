MAX_POSITION_RISK = 0.8


def evaluate_risk(opportunity: dict) -> dict:
    """
    Simple MVP risk evaluation.
    """

    evidence_count = len(opportunity["evidence_nodes"])

    # For now, risk is based on evidence strength.
    # More aligned evidence = lower uncertainty.
    risk_score = 1 / evidence_count

    approved = risk_score <= MAX_POSITION_RISK

    result = {
        "approved": approved,
        "risk_score": round(risk_score, 2),
        "reason": (
            "Risk within allowed limit"
            if approved
            else "Risk limit exceeded"
        )
    }

    print("\nRISK EVALUATED")
    print(result)

    return result