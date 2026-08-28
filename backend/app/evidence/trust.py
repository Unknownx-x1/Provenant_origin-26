from typing import Dict

DEFAULT_SOURCE_TRUST: Dict[str, float] = {
    "Bloomberg Breaking": 1.0,
    "Reuters Breaking News": 1.0,
    "RSI_14": 0.95,
    "Depth Proxy": 0.90,
    "VIX Regime Modifier": 0.85,
    "Unverified Twitter": 0.30
}

class EvidenceTrustEngine:
    def __init__(self, trust_map: Dict[str, float] = None):
        self.trust_map = trust_map or DEFAULT_SOURCE_TRUST

    def get_source_trust(self, source: str) -> float:
        for key, trust in self.trust_map.items():
            if key.lower() in source.lower():
                return trust
        return 0.75  # Default baseline trust

    def calculate_effective_weight(self, base_weight: float, source: str, freshness_mult: float = 1.0) -> float:
        trust = self.get_source_trust(source)
        return base_weight * trust * freshness_mult

trust_engine = EvidenceTrustEngine()
