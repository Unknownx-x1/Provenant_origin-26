from datetime import datetime
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
            promoted_entry = StrategyPoolEntry(
                strategy_template_id=f"{experiment.strategy_template_id}_delayed",
                name=f"News + Momentum ({experiment.parameters.get('confirmation_delay_sec', 300)}s Confirmation Delay)",
                params=experiment.parameters,
                status="active",
                promoted_at=datetime.utcnow().isoformat() + "Z",
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
