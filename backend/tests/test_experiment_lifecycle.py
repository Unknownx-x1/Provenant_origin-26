import pytest
import asyncio
from backend.app.schemas.contracts import (
    FailureEvent, RegimeType, InvalidationCause, EvidenceType, ExperimentStatus, PromotionStatus
)
from backend.app.outcomes.failure_analysis import failure_analysis
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.research_sleeve.hypothesis import hypothesis_engine
from backend.app.vault.commit import vault_commit_engine
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.research_sleeve.backtest import backtest_engine
from backend.app.research_sleeve.validation import validation_engine
from backend.app.research_sleeve.promotion_gate import promotion_gate
from backend.app.audit.ledger import ledger

@pytest.mark.anyio
async def test_full_experiment_lifecycle():
    ledger.reset()
    
    # 1. Simulate 3 consecutive failures
    trigger = None
    for i in range(3):
        fail = FailureEvent(
            failure_id=f"f_{i}",
            decision_id=f"d_{i}",
            strategy_template_id="news_momentum_v1",
            regime=RegimeType.HIGH_VOL,
            invalidation_cause=InvalidationCause.EVIDENCE_CONTRADICTED,
            dominant_evidence_type=EvidenceType.NEWS
        )
        ledger.log_failure(fail)
        trigger = await pattern_detector.register_failure(fail)
        
    assert trigger is not None
    assert trigger.failure_count == 3
    
    # 2. Hypothesis generation
    exp = hypothesis_engine.create_experiment_from_trigger(trigger)
    assert exp.status == ExperimentStatus.CREATED
    assert exp.parameters["confirmation_delay_sec"] == 300
    
    # 3. Vault Commit
    commit_hash = vault_commit_engine.compute_experiment_hash(exp.hypothesis, exp.strategy_template_id, exp.parameters)
    exp = experiment_manager.start_commit(exp, commit_hash=commit_hash, lock_duration_sec=0) # 0s for instant test unlock
    assert exp.commit_hash == commit_hash
    
    # 4. Backtest & Validation
    backtest = backtest_engine.run_backtest(exp.dataset, exp.parameters)
    validation = validation_engine.validate_oos(backtest, exp.parameters)
    exp.backtest_result = backtest
    exp.validation_result = validation
    
    assert validation.is_valid is True
    assert validation.oos_sharpe >= 0.80
    assert validation.p_value <= 0.05
    assert validation.decay <= 0.15
    
    # 5. Promotion Gate
    promoted = promotion_gate.evaluate_and_promote(exp)
    assert promoted is not None
    assert exp.promotion_status == PromotionStatus.PROMOTED
    assert ("news_momentum_v1_delayed" in ledger.strategy_pool or "news_momentum_v2" in ledger.strategy_pool)

