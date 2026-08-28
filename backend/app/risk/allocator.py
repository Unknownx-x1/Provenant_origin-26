MAX_ALLOCATION = 0.20  # 20% max capital allocation

def allocate_capital(opportunity: dict, risk_result: dict) -> dict:
    if not risk_result["approved"]:
        return {
            "allocated": False,
            "allocation": 0.0,
            "reason": "Risk evaluation rejected opportunity"
        }

    return {
        "allocated": True,
        "allocation": MAX_ALLOCATION,
        "reason": "Capital allocated successfully"
    }
