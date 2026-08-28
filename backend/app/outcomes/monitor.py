from typing import Optional
from backend.app.schemas.contracts import Decision, DecisionStatus, InvalidationCause, RegimeType, EvidenceType
from backend.app.outcomes.failure_analysis import failure_analysis
from backend.app.audit.ledger import ledger

class OutcomeMonitor:
    async def process_decision_update(self, decision: Decision) -> Optional[dict]:
        ledger.log_decision(decision)
        
        # Check if decision was invalidated
        if decision.status in [DecisionStatus.CANCELLED, DecisionStatus.REVERSED]:
            failure = await failure_analysis.analyze_invalidation(
                decision=decision,
                cause=InvalidationCause.EVIDENCE_CONTRADICTED,
                regime=RegimeType.HIGH_VOL,
                dominant_evidence=EvidenceType.NEWS
            )
            return {"decision": decision, "failure": failure}
        
        return {"decision": decision}

outcome_monitor = OutcomeMonitor()
