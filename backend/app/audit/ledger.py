from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.schemas.contracts import (
    Decision, FailureEvent, ResearchTrigger, Experiment, StrategyPoolEntry
)

class AuditLedger:
    def __init__(self):
        self.decisions: List[Decision] = []
        self.failure_events: List[FailureEvent] = []
        self.research_triggers: List[ResearchTrigger] = []
        self.experiments: Dict[str, Experiment] = {}
        self.strategy_pool: Dict[str, StrategyPoolEntry] = {}
        
        # Initialize default base strategy
        base_strategy = StrategyPoolEntry(
            strategy_template_id="news_momentum_v1",
            name="News + Momentum Immediate Entry",
            params={"confirmation_delay_sec": 0},
            status="active",
            promoted_at=datetime.utcnow().isoformat() + "Z",
            oos_sharpe=1.10,
            p_value=0.040
        )
        self.strategy_pool[base_strategy.strategy_template_id] = base_strategy

    def log_decision(self, decision: Decision):
        self.decisions.append(decision)

    def log_failure(self, failure: FailureEvent):
        self.failure_events.append(failure)

    def log_trigger(self, trigger: ResearchTrigger):
        self.research_triggers.append(trigger)

    def save_experiment(self, experiment: Experiment):
        self.experiments[experiment.experiment_id] = experiment

    def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        return self.experiments.get(experiment_id)

    def promote_strategy(self, entry: StrategyPoolEntry):
        self.strategy_pool[entry.strategy_template_id] = entry

    def get_active_strategies(self) -> List[StrategyPoolEntry]:
        return [s for s in self.strategy_pool.values() if s.status == "active"]

    def reset(self):
        self.decisions.clear()
        self.failure_events.clear()
        self.research_triggers.clear()
        self.experiments.clear()

ledger = AuditLedger()
