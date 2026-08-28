import pytest
import asyncio
from datetime import datetime, timezone

from backend.app.schemas.contracts import (
    DecisionStatus, EvidenceType, ExperimentStatus, PromotionStatus
)
from backend.app.ingestion.simulator import (
    simulate_price_step, set_market_interval, current_market_tick, calculate_rsi
)

from backend.app.ingestion.news_injector import inject_news
from backend.app.evidence.processor import evidence_processor
from backend.app.decisions.engine import decision_engine
from backend.app.decisions.validity_engine import update_decision_validity, calculate_adaptive_threshold
from backend.app.decisions.actions import determine_action
from backend.app.outcomes.monitor import outcome_monitor
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.research_sleeve.hypothesis import hypothesis_engine
from backend.app.vault.commit import vault_commit_engine
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.research_sleeve.backtest import backtest_engine
from backend.app.research_sleeve.validation import validation_engine
from backend.app.research_sleeve.promotion_gate import promotion_gate
from backend.app.research_sleeve.strategy_pool import strategy_pool_manager
from backend.app.opportunities.generator import opportunity_generator, reset_opportunity_state, latest_evidence
from backend.app.ingestion.event_bus import event_bus
from backend.app.audit.ledger import ledger

@pytest.mark.anyio
async def test_full_autonomous_closed_loop_workflow():

    # 0. Reset state for clean deterministic execution
    ledger.reset()
    reset_opportunity_state()

    # ---------------------------------------------------------
    # 1. MARKET DATA & DYNAMIC TECHNICAL INDICATORS
    # ---------------------------------------------------------
    set_market_interval(5.0)
    assert current_market_tick["interval_sec"] == 5.0

    # Generate dynamic price steps
    tick1 = simulate_price_step()
    assert "price" in tick1
    assert "rsi" in tick1
    assert "bid" in tick1 and "ask" in tick1
    assert tick1["ask"] > tick1["bid"]

    # ---------------------------------------------------------
    # 2. RICH NEWS EVIDENCE INGESTION & PROCESSING
    # ---------------------------------------------------------
    news_item = await inject_news(
        asset="AAPL",
        headline="Apple reports record iPhone revenue and AI integration roadmap",
        source="Reuters (Simulated)",
        sentiment="positive",
        confidence=0.92,
        weight=0.35,
        impact="SUPPORTS BUY AAPL",
        status="ACTIVE"
    )
    assert news_item["headline"] == "Apple reports record iPhone revenue and AI integration roadmap"
    assert news_item["sentiment"] == "positive"
    assert news_item["confidence"] == 0.92

    node = await evidence_processor.process_market_event(news_item)
    assert node.headline == news_item["headline"]
    assert node.freshness == "FRESH"
    assert not node.contradicted

    # ---------------------------------------------------------
    # 3. INNER LOOP: DECISION GENERATION & PAPER EXECUTION
    # ---------------------------------------------------------
    # Feed momentum and orderbook evidence to fulfill opportunity prerequisites
    await evidence_processor.process_market_event({"type": "price", "asset": "AAPL", "rsi": 64.2})
    await evidence_processor.process_market_event({"type": "orderbook", "asset": "AAPL", "bid_volume": 9000, "ask_volume": 4000})

    # Run opportunity generator step
    gen_task = asyncio.create_task(opportunity_generator())
    await asyncio.sleep(0.05)
    
    # Retrieve generated opportunity from queue
    opp = await asyncio.wait_for(event_bus.opportunity_events.get(), timeout=2.0)
    gen_task.cancel()

    assert opp["asset"] == "AAPL"
    assert opp["action"] == "BUY"
    assert len(opp["evidence_nodes"]) >= 3

    # Formulate Decision
    decision = await decision_engine.handle_opportunity(opp)
    assert decision is not None
    assert decision.status == DecisionStatus.OPEN
    assert decision.validity_score >= decision.validity_threshold
    assert decision.strategy_template_id == "news_momentum_v1"
    assert decision.allocation > 0

    # ---------------------------------------------------------
    # 4. CONTRADICTORY EVIDENCE & AUTONOMOUS REVERSAL
    # ---------------------------------------------------------
    contradiction_news = await inject_news(
        asset="AAPL",
        headline="Apple pauses AI server deployment amid component bottlenecks",
        source="Reuters (Simulated)",
        sentiment="negative",
        confidence=0.91,
        weight=0.35,
        impact="CONTRADICTS BUY AAPL",
        status="CONTRADICTED",
        contradicts="latest"
    )
    contra_node = await evidence_processor.process_market_event(contradiction_news)
    assert contra_node.contradicted is True

    # Handle contradictory evidence in decision engine
    reversed_decision = await decision_engine.handle_contradictory_evidence(contra_node)
    assert reversed_decision is not None
    assert reversed_decision.status == DecisionStatus.REVERSED
    assert reversed_decision.validity_score < reversed_decision.validity_threshold
    assert ("reversed" in reversed_decision.explanation.lower() or "invalid" in reversed_decision.explanation.lower())


    # ---------------------------------------------------------
    # 5. FAILURE EVENT & RECURRING PATTERN DETECTION
    # ---------------------------------------------------------
    assert len(ledger.failure_events) >= 1
    
    # Trigger 2 additional failures to reach pattern detector threshold (3)
    f2 = await failure_analysis_helper(decision_id="dec_test_2")
    f3 = await failure_analysis_helper(decision_id="dec_test_3")
    
    trigger = await pattern_detector.register_failure(f3)
    assert trigger is not None
    assert trigger.failure_count >= 3
    assert trigger.strategy_template_id == "news_momentum_v1"

    # ---------------------------------------------------------
    # 6. BOUNDED HYPOTHESIS & SHA-256 VAULT PRE-COMMIT
    # ---------------------------------------------------------
    experiment = hypothesis_engine.create_experiment_from_trigger(trigger)
    assert experiment.parameters["confirmation_delay_sec"] == 300
    assert experiment.status == ExperimentStatus.CREATED

    # Compute SHA-256 Hash BEFORE running backtest
    commit_hash = vault_commit_engine.compute_experiment_hash(
        experiment.hypothesis,
        experiment.strategy_template_id,
        experiment.parameters
    )
    assert len(commit_hash) == 64  # Valid SHA-256 hex string

    locked_exp = experiment_manager.start_commit(experiment, commit_hash, lock_duration_sec=60)
    assert locked_exp.status == ExperimentStatus.LOCKED
    assert locked_exp.commit_hash == commit_hash
    assert locked_exp.seconds_remaining == 60

    # ---------------------------------------------------------
    # 7. CALCULATED WALK-FORWARD BACKTEST & OOS VALIDATION
    # ---------------------------------------------------------
    # Fast-forward lock timer for testing
    locked_exp.seconds_remaining = 0
    locked_exp.status = ExperimentStatus.TESTING

    backtest_res = backtest_engine.run_backtest(locked_exp.dataset, locked_exp.parameters)
    assert backtest_res.trades_count > 0
    assert backtest_res.win_rate > 0.50
    assert backtest_res.total_return > 0

    val_res = validation_engine.validate_oos(backtest_res, locked_exp.parameters)
    assert val_res.oos_sharpe >= 0.80
    assert val_res.p_value <= 0.05
    assert val_res.decay <= 0.15
    assert val_res.is_valid is True

    locked_exp.backtest_result = backtest_res
    locked_exp.validation_result = val_res

    # ---------------------------------------------------------
    # 8. PROMOTION GATE & STRATEGY POOL INTEGRATION
    # ---------------------------------------------------------
    promoted_strategy = promotion_gate.evaluate_and_promote(locked_exp)
    assert promoted_strategy is not None
    assert promoted_strategy.strategy_template_id == "news_momentum_v2"
    assert promoted_strategy.status == "active"
    assert locked_exp.status == ExperimentStatus.VERIFIED
    assert locked_exp.promotion_status == PromotionStatus.PROMOTED

    # ---------------------------------------------------------
    # 9. CLOSED-LOOP: TRACK A PICKS UP PROMOTED STRATEGY
    # ---------------------------------------------------------
    reset_opportunity_state()
    
    # Re-inject positive news and market signals
    news_item_2 = await inject_news(
        asset="AAPL",
        headline="Apple unveils next-generation M-series silicon with 35% efficiency gains",
        source="Bloomberg (Simulated)",
        sentiment="positive",
        confidence=0.94,
        weight=0.35,
        impact="SUPPORTS BUY AAPL",
        status="ACTIVE"
    )
    await evidence_processor.process_market_event(news_item_2)
    await evidence_processor.process_market_event({"type": "price", "asset": "AAPL", "rsi": 62.5})
    await evidence_processor.process_market_event({"type": "orderbook", "asset": "AAPL", "bid_volume": 7500, "ask_volume": 3200})

    gen_task_2 = asyncio.create_task(opportunity_generator())
    await asyncio.sleep(0.05)
    
    new_opp = await asyncio.wait_for(event_bus.opportunity_events.get(), timeout=2.0)
    gen_task_2.cancel()

    # Verify that the new opportunity is powered by the promoted strategy!
    assert new_opp["strategy_template_id"] == "news_momentum_v2"

    new_decision = await decision_engine.handle_opportunity(new_opp)
    assert new_decision is not None
    assert new_decision.strategy_template_id == "news_momentum_v2"
    assert new_decision.status == DecisionStatus.OPEN

async def failure_analysis_helper(decision_id: str):
    from backend.app.schemas.contracts import FailureEvent, InvalidationCause, RegimeType
    fail = FailureEvent(
        failure_id=f"fail_{decision_id}",
        decision_id=decision_id,
        strategy_template_id="news_momentum_v1",
        regime=RegimeType.HIGH_VOL,
        invalidation_cause=InvalidationCause.EVIDENCE_CONTRADICTED,
        dominant_evidence_type=EvidenceType.NEWS,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    ledger.log_failure(fail)
    return fail
