from typing import Dict, Any
from backend.app.config import config

STRATEGY_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "news_momentum_v1": {
        "strategy_template_id": "news_momentum_v1",
        "name": "News + Momentum — Immediate Entry",
        "required_evidence": ["NEWS", "MOMENTUM", "ORDERBOOK"],
        "params": {
            "entry_mode": "immediate",
            "confirmation_delay_sec": 0,
            "min_validity_threshold": config.hold_threshold_high_vol
        },
        "status": "ACTIVE",
        "oos_sharpe": 1.10,
        "p_value": 0.040
    },
    "news_momentum_v2": {
        "strategy_template_id": "news_momentum_v2",
        "name": "News + Momentum — 5-Min Confirmation Delay",
        "required_evidence": ["NEWS", "MOMENTUM", "ORDERBOOK", "VOLATILITY"],
        "params": {
            "entry_mode": "delayed_confirmation",
            "confirmation_delay_sec": 300,
            "min_validity_threshold": config.hold_threshold_high_vol
        },
        "status": "PROMOTED",
        "oos_sharpe": 1.42,
        "p_value": 0.018
    }
}

class StrategyTemplateRegistry:
    def __init__(self):
        self.templates = STRATEGY_TEMPLATES.copy()

    def get_template(self, template_id: str) -> Dict[str, Any]:
        return self.templates.get(template_id, self.templates["news_momentum_v1"])

    def register_template(self, template_id: str, template_data: Dict[str, Any]):
        self.templates[template_id] = template_data

template_registry = StrategyTemplateRegistry()
