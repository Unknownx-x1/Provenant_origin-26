from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
from backend.app.config import config

def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

class InvalidationCause(str, Enum):
    EVIDENCE_CONTRADICTED = "evidence_contradicted"
    EVIDENCE_DECAYED = "evidence_decayed"
    TRUST_DOWNGRADED = "trust_downgraded"
    EXECUTION_BLOCKED = "execution_blocked"


class RegimeType(str, Enum):
    HIGH_VOL = "HIGH_VOLATILITY"
    LOW_VOL = "LOW_VOLATILITY"
    TRENDING = "TRENDING"
    ILLIQUID = "ILLIQUID"


class EvidenceType(str, Enum):
    NEWS = "NEWS"
    ORDERBOOK = "ORDERBOOK"
    VOLATILITY = "VOLATILITY"
    MOMENTUM = "MOMENTUM"


class DecisionStatus(str, Enum):
    OPEN = "OPEN"
    REDUCED = "REDUCED"
    PAUSED = "PAUSED"
    CANCELLED = "CANCELLED"
    REVERSED = "REVERSED"
    CLOSED = "CLOSED"


class ExperimentStatus(str, Enum):
    CREATED = "CREATED"
    COMMITTING = "COMMITTING"
    LOCKED = "LOCKED"
    TESTING = "TESTING"
    REVEALING = "REVEALING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class PromotionStatus(str, Enum):
    PENDING = "PENDING"
    PROMOTED = "PROMOTED"
    REJECTED = "REJECTED"


class EvidenceNode(BaseModel):
    id: str
    type: EvidenceType
    weight: float
    source: str
    captured_at: str = Field(default_factory=utc_now_iso)
    freshness: str = "FRESH"
    value: Optional[Any] = None
    headline: Optional[str] = None
    sentiment: Optional[str] = None
    confidence: Optional[float] = 0.91
    impact: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    contradicted: bool = False


class Decision(BaseModel):
    decision_id: str
    opportunity_id: str
    asset: str = "AAPL"
    action: str = "BUY"  # BUY | SELL
    evidence_nodes: List[EvidenceNode]
    validity_score: float
    validity_threshold: float = config.hold_threshold_high_vol
    status: DecisionStatus = DecisionStatus.OPEN
    strategy_template_id: str = "news_momentum_v1"
    allocation: float = config.min_allocation_pct
    explanation: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)


class FailureEvent(BaseModel):
    failure_id: str
    decision_id: str
    strategy_template_id: str
    regime: RegimeType
    invalidation_cause: InvalidationCause
    dominant_evidence_type: EvidenceType
    timestamp: str = Field(default_factory=utc_now_iso)


class ResearchTrigger(BaseModel):
    trigger_id: str
    strategy_template_id: str
    regime: RegimeType
    dominant_evidence_type: EvidenceType
    failure_count: int = 3
    window_sec: int = 300
    narrative: Optional[str] = None
    timestamp: str = Field(default_factory=utc_now_iso)


class BacktestResult(BaseModel):
    total_return: float
    max_drawdown: float
    win_rate: float
    trades_count: int


class ValidationResult(BaseModel):
    oos_sharpe: float
    p_value: float
    decay: float
    is_valid: bool


class Experiment(BaseModel):
    experiment_id: str
    hypothesis: str
    strategy_template_id: str
    parameters: Dict[str, Any]
    dataset: str = "synthetic_stock_prices.csv"
    test_window: str = "90d_walk_forward"
    status: ExperimentStatus = ExperimentStatus.CREATED
    commit_hash: Optional[str] = None
    locked_at: Optional[str] = None
    lock_until: Optional[str] = None
    seconds_remaining: int = 0
    backtest_result: Optional[BacktestResult] = None
    validation_result: Optional[ValidationResult] = None
    promotion_status: PromotionStatus = PromotionStatus.PENDING
    explanation: Optional[str] = None
    created_at: str = Field(default_factory=utc_now_iso)


class StrategyPoolEntry(BaseModel):
    strategy_template_id: str
    name: str
    params: Dict[str, Any]
    status: str = "ACTIVE"  # ACTIVE | RETIRED
    promoted_at: str = Field(default_factory=utc_now_iso)
    oos_sharpe: float
    p_value: float


class VaultState(BaseModel):
    experiment_id: str
    state: str  # committing | locked | revealing | verified | rejected | waiting
    seconds_remaining: int
    commit_hash_short: str
    commit_hash_full: str
    oos_sharpe: Optional[float] = None
    p_value: Optional[float] = None
    hardware_connected: bool = False


class ActivityEntry(BaseModel):
    timestamp: str
    title: str
    description: str
    category: str
    phase: int


class DemoState(BaseModel):
    current_phase: int
    phase_name: str
    total_phases: int = 16
    autonomous_mode: bool = True
    active_stock: str = "AAPL"
    voice_enabled: bool = True
    activity_log: List[ActivityEntry] = []

