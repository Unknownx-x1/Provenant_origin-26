from typing import Dict, Any
from backend.app.config import config

class ExecutionSimulator:
    def __init__(self):
        self.positions: Dict[str, Dict[str, Any]] = {}

    async def execute_trade_action(self, execution_order: dict) -> dict:
        action = str(execution_order.get("action", "")).upper()
        asset = execution_order.get("asset", config.default_asset)
        current = self.positions.get(asset, {"action": None, "allocation": 0.0})
        current_allocation = float(execution_order.get("current_allocation", current["allocation"]))
        allocation = float(execution_order.get("allocation", current_allocation))
        decision_id = execution_order.get("decision_id")

        if action == "REDUCE":
            new_allocation = round(current_allocation * config.reduce_allocation_factor, 4)
            resulting_action = execution_order.get("current_action", current["action"])
        elif action == "REVERSE":
            prior_action = str(execution_order.get("current_action", current["action"])).upper()
            resulting_action = "SELL" if prior_action == "BUY" else "BUY"
            new_allocation = allocation
        elif action in {"BUY", "SELL"}:
            resulting_action = action
            new_allocation = allocation
        else:
            return {"status": "REJECTED", "reason": f"Unsupported action {action}"}

        allocated_elsewhere = sum(
            position["allocation"] for position_asset, position in self.positions.items()
            if position_asset != asset
        )
        available_allocation = max(0.0, 1.0 - allocated_elsewhere)
        new_allocation = min(
            new_allocation,
            config.max_exposure_per_asset / config.max_capital,
            available_allocation,
        )
        self.positions[asset] = {"action": resulting_action, "allocation": new_allocation, "decision_id": decision_id}
        return {
            "status": "EXECUTED",
            "action": action,
            "asset": asset,
            "decision_id": decision_id,
            "previous_action": current["action"],
            "previous_allocation": current_allocation,
            "resulting_action": resulting_action,
            "filled_allocation": new_allocation,
            "slippage_bps": 5
        }

executor = ExecutionSimulator()
