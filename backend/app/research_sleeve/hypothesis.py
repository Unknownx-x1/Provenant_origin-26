import uuid
from typing import Dict, Any
from backend.app.schemas.contracts import ResearchTrigger, Experiment, ExperimentStatus, PromotionStatus
from backend.app.audit.ledger import ledger

class HypothesisEngine:
    def create_experiment_from_trigger(self, trigger: ResearchTrigger) -> Experiment:
        experiment_id = f"exp_{uuid.uuid4().hex[:6]}"
        
        # Bounded hypothesis parameter search space
        hypothesis_text = (
            f"Delay entry by 5 minutes after {trigger.dominant_evidence_type.value} signals "
            f"in {trigger.regime.value} conditions to allow liquidity recovery before entering."
        )
        
        params: Dict[str, Any] = {
            "confirmation_delay_sec": 300,
            "volatility_buffer": 1.25,
            "min_liquidity_threshold": 0.50
        }
        
        experiment = Experiment(
            experiment_id=experiment_id,
            hypothesis=hypothesis_text,
            strategy_template_id=trigger.strategy_template_id,
            parameters=params,
            dataset="asset_prices.csv",
            test_window="90d_walk_forward",
            status=ExperimentStatus.CREATED,
            promotion_status=PromotionStatus.PENDING,
            explanation=trigger.narrative
        )
        
        ledger.save_experiment(experiment)
        return experiment

hypothesis_engine = HypothesisEngine()
