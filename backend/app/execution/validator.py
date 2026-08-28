from backend.app.config import config
from backend.app.schemas.contracts import Decision, DecisionStatus

class ExecutionValidator:
    def __init__(self):
        self.max_exposure = config.max_exposure_per_asset
        self.max_capital = config.max_capital

    def validate_execution(self, decision: Decision, requested_amount_usd: float) -> dict:
        # Firewall & Boundary Enforcement
        if requested_amount_usd > self.max_exposure:
            return {
                "valid": False,
                "reason": f"Requested exposure ${requested_amount_usd} exceeds single asset limit (${self.max_exposure})"
            }

        if decision.status == DecisionStatus.CLOSED:
            return {
                "valid": False,
                "reason": f"Decision {decision.decision_id} is already CLOSED"
            }

        return {
            "valid": True,
            "approved_amount_usd": requested_amount_usd,
            "slippage_bps": 5
        }

execution_validator = ExecutionValidator()
