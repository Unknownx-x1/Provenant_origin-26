MAX_ALLOCATION = 0.20  # 20% of total capital


def allocate_capital(opportunity: dict, risk_result: dict) -> dict:
    if not risk_result["approved"]:
        return {
            "allocated": False,
            "allocation": 0.0,
            "reason": "Risk evaluation rejected opportunity"
        }

    allocation = MAX_ALLOCATION

    result = {
        "allocated": True,
        "allocation": allocation,
        "reason": "Capital allocated successfully"
    }

    print("\nCAPITAL ALLOCATED")
    print(result)

    return result