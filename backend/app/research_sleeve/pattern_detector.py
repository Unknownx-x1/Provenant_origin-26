import uuid
from typing import List, Optional
from datetime import datetime
from backend.app.schemas.contracts import FailureEvent, ResearchTrigger
from backend.app.audit.ledger import ledger
from backend.app.ai.hypothesis_explainer import hypothesis_explainer

class PatternDetector:
    def __init__(self, threshold_count: int = 3, window_sec: int = 300):
        self.threshold_count = threshold_count
        self.window_sec = window_sec

    async def register_failure(self, failure: FailureEvent) -> Optional[ResearchTrigger]:
        # Filter failures by matching pattern key
        key_strategy = failure.strategy_template_id
        key_regime = failure.regime
        key_evidence = failure.dominant_evidence_type
        
        matching = [
            f for f in ledger.failure_events
            if f.strategy_template_id == key_strategy
            and f.regime == key_regime
            and f.dominant_evidence_type == key_evidence
        ]
        
        if len(matching) >= self.threshold_count:
            trigger = ResearchTrigger(
                trigger_id=f"trig_{uuid.uuid4().hex[:8]}",
                strategy_template_id=key_strategy,
                regime=key_regime,
                dominant_evidence_type=key_evidence,
                failure_count=len(matching),
                window_sec=self.window_sec,
                timestamp=datetime.utcnow().isoformat() + "Z"
            )
            
            # Generate LLM narrative explaining research trigger
            narrative = await hypothesis_explainer.explain_trigger(trigger, delay_sec=300)
            trigger.narrative = narrative
            
            ledger.log_trigger(trigger)
            return trigger
            
        return None

pattern_detector = PatternDetector()
