MAX_POSITION_RISK = 0.80

def evaluate_risk(opportunity: dict) -> dict:
    evidence_count = len(opportunity["evidence_nodes"])
    risk_score = 1.0 / max(1, evidence_count)
    approved = risk_score <= MAX_POSITION_RISK

    return {
        "approved": approved,
        "risk_score": round(risk_score, 2),
        "reason": "Risk within allowed limit" if approved else "Risk limit exceeded"
    }
