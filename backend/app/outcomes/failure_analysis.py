import uuid
from datetime import datetime
from backend.app.schemas.contracts import (
    Decision, FailureEvent, InvalidationCause, RegimeType, EvidenceType
)
from backend.app.audit.ledger import ledger
from backend.app.ai.decision_explainer import decision_explainer

class FailureAnalysisEngine:
    async def analyze_invalidation(
        self,
        decision: Decision,
        cause: InvalidationCause,
        regime: RegimeType = RegimeType.HIGH_VOL,
        dominant_evidence: EvidenceType = EvidenceType.NEWS
    ) -> FailureEvent:
        failure = FailureEvent(
            failure_id=f"fail_{uuid.uuid4().hex[:8]}",
            decision_id=decision.decision_id,
            strategy_template_id=decision.strategy_template_id,
            regime=regime,
            invalidation_cause=cause,
            dominant_evidence_type=dominant_evidence,
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
        # Generate LLM explanation asynchronously
        explanation = await decision_explainer.explain_invalidation(decision, failure)
        decision.explanation = explanation
        
        ledger.log_failure(failure)
        return failure

failure_analysis = FailureAnalysisEngine()
