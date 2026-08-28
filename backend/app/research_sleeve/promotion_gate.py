from datetime import datetime, timezone
from typing import Optional
from backend.app.schemas.contracts import Experiment, ExperimentStatus, PromotionStatus, StrategyPoolEntry
from backend.app.audit.ledger import ledger

class PromotionGate:
    def evaluate_and_promote(self, experiment: Experiment) -> Optional[StrategyPoolEntry]:
        if not experiment.validation_result:
            experiment.promotion_status = PromotionStatus.REJECTED
            experiment.status = ExperimentStatus.REJECTED
            ledger.save_experiment(experiment)
            return None
            
        if experiment.validation_result.is_valid:
            experiment.promotion_status = PromotionStatus.PROMOTED
            experiment.status = ExperimentStatus.VERIFIED
            
            # Create new StrategyPool entry
            strat_id = f"{experiment.strategy_template_id}_delayed" if not experiment.strategy_template_id.endswith("_delayed") else experiment.strategy_template_id
            if "v1" in experiment.strategy_template_id:
                strat_id = "news_momentum_v2"

            promoted_entry = StrategyPoolEntry(
                strategy_template_id=strat_id,
                name=f"News + Momentum ({experiment.parameters.get('confirmation_delay_sec', 300)}s Confirmation Delay)",
                params=experiment.parameters,
                status="active",
                promoted_at=datetime.now(timezone.utc).isoformat(),
                oos_sharpe=experiment.validation_result.oos_sharpe,
                p_value=experiment.validation_result.p_value
            )
            
            # Strictly WRITE to StrategyPool ONLY (Capital Firewall enforced)
            ledger.promote_strategy(promoted_entry)
            ledger.save_experiment(experiment)
            return promoted_entry
        else:
            experiment.promotion_status = PromotionStatus.REJECTED
            experiment.status = ExperimentStatus.REJECTED
            ledger.save_experiment(experiment)
            return None

promotion_gate = PromotionGate()

