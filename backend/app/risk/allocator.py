from backend.app.config import config

def allocate_capital(opportunity: dict, risk_result: dict) -> dict:
    if not risk_result["approved"]:
        return {
            "allocated": False,
            "allocation": 0.0,
            "reason": "Risk evaluation rejected opportunity"
        }

    max_by_exposure = config.max_exposure_per_asset / config.max_capital
    allocation_cap = min(config.max_allocation_pct, max_by_exposure)
    strength = max(0.0, min(1.0, float(opportunity.get("signal_strength", 0.0))))
    risk_score = max(0.0, min(1.0, float(risk_result.get("risk_score", 1.0))))
    allocation = config.min_allocation_pct + (
        (allocation_cap - config.min_allocation_pct) * strength * (1.0 - risk_score)
    )
    return {
        "allocated": True,
        "allocation": round(min(allocation, allocation_cap), 4),
        "reason": "Capital allocated from signal strength and risk"
    }
