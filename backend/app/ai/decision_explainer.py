from backend.app.ai.client import ai_client
from backend.app.schemas.contracts import Decision, FailureEvent

class DecisionExplainer:
    async def explain_invalidation(self, decision: Decision, failure: FailureEvent) -> str:
        fallback = (
            f"Decision {decision.decision_id[:8]} on {decision.asset} ({decision.action}) "
            f"was invalid: {failure.dominant_evidence_type.value} evidence was "
            f"{failure.invalidation_cause.value} during {failure.regime.value} regime. "
            f"Validity dropped from 0.91 to {decision.validity_score:.2f} (below threshold {decision.validity_threshold:.2f})."
        )
        
        prompt = (
            f"Explain in one concise sentence why a trading decision was reversed:\n"
            f"Asset: {decision.asset}\nAction: {decision.action}\n"
            f"Invalidation Cause: {failure.invalidation_cause.value}\n"
            f"Dominant Evidence: {failure.dominant_evidence_type.value}\n"
            f"Regime: {failure.regime.value}\n"
            f"Validity score drop: {decision.validity_score:.2f} vs threshold {decision.validity_threshold:.2f}"
        )
        
        return await ai_client.generate_explanation(prompt, fallback)

decision_explainer = DecisionExplainer()
