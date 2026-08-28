class ExecutionSimulator:
    async def execute_trade_action(self, execution_order: dict) -> dict:
        action = execution_order.get("action")
        asset = execution_order.get("asset")
        allocation = execution_order.get("allocation", 0.20)
        
        return {
            "status": "EXECUTED",
            "action": action,
            "asset": asset,
            "filled_allocation": allocation,
            "slippage_bps": 5
        }

executor = ExecutionSimulator()
