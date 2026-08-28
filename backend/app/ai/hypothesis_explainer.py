from backend.app.ai.client import ai_client
from backend.app.schemas.contracts import ResearchTrigger

class HypothesisExplainer:
    async def explain_trigger(self, trigger: ResearchTrigger, delay_sec: int) -> str:
        fallback = (
            f"{trigger.failure_count} consecutive {trigger.dominant_evidence_type.value} + momentum decisions "
            f"failed during {trigger.regime.value} conditions. The system proposes testing a "
            f"{delay_sec // 60}-minute confirmation delay before market entry."
        )
        
        prompt = (
            f"Explain in one sentence why a trading agent's Research Sleeve triggered a hypothesis test:\n"
            f"Failure Count: {trigger.failure_count}\n"
            f"Failed Evidence Combo: {trigger.dominant_evidence_type.value} + momentum\n"
            f"Regime: {trigger.regime.value}\n"
            f"Proposed Fix: {delay_sec // 60}-minute confirmation delay before entry"
        )
        
        return await ai_client.generate_explanation(prompt, fallback)

hypothesis_explainer = HypothesisExplainer()
