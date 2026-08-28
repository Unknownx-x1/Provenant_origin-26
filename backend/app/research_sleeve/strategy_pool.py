from typing import List
from backend.app.schemas.contracts import StrategyPoolEntry
from backend.app.audit.ledger import ledger

class StrategyPoolManager:
    """
    Read-only Strategy Pool manager for Track A Opportunity Generator.
    Research Sleeve promotes to Strategy Pool; Track A reads active strategies.
    No execution/capital allocation write APIs exist in this module.
    """
    def get_active_pool(self) -> List[StrategyPoolEntry]:
        return ledger.get_active_strategies()

    def get_strategy_by_id(self, strategy_template_id: str) -> StrategyPoolEntry:
        return ledger.strategy_pool.get(strategy_template_id)

strategy_pool_manager = StrategyPoolManager()
