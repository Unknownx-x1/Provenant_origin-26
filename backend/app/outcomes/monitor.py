from typing import Optional
from backend.app.schemas.contracts import Decision, DecisionStatus, InvalidationCause, RegimeType, EvidenceType
from backend.app.outcomes.failure_analysis import failure_analysis
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.audit.ledger import ledger
from backend.app.ws.broadcaster import broadcaster
from backend.app.ingestion.event_bus import event_bus

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
            await broadcaster.broadcast("FAILURE_EVENT", failure.model_dump())
            await event_bus.failure_events.put(failure)

            # Check if recurring pattern threshold is met
            trigger = await pattern_detector.register_failure(failure)
            if trigger:
                await broadcaster.broadcast("RESEARCH_TRIGGER", trigger.model_dump())
                await event_bus.research_trigger_events.put(trigger)

            return {"decision": decision, "failure": failure, "trigger": trigger}
        
        return {"decision": decision}

outcome_monitor = OutcomeMonitor()

