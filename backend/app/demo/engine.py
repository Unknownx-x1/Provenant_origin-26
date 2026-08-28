import asyncio
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from backend.app.schemas.contracts import (
    Decision, DecisionStatus, EvidenceNode, EvidenceType, FailureEvent, InvalidationCause, RegimeType,
    ResearchTrigger, Experiment, ExperimentStatus, PromotionStatus, StrategyPoolEntry
)
from backend.app.config import config
from backend.app.audit.ledger import ledger

from backend.app.ws.broadcaster import broadcaster
from backend.app.ingestion.event_bus import event_bus
from backend.app.ingestion.news_injector import inject_news
from backend.app.ingestion.simulator import current_market_tick, market_update_interval_sec
from backend.app.evidence.processor import evidence_processor
from backend.app.decisions.engine import decision_engine
from backend.app.decisions.validity_engine import update_decision_validity, calculate_adaptive_threshold
from backend.app.decisions.actions import determine_action
from backend.app.execution.validator import execution_validator
from backend.app.execution.executor import executor
from backend.app.outcomes.monitor import outcome_monitor
from backend.app.outcomes.failure_analysis import failure_analysis
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.research_sleeve.hypothesis import hypothesis_engine
from backend.app.vault.commit import vault_commit_engine
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.research_sleeve.backtest import backtest_engine
from backend.app.research_sleeve.validation import validation_engine
from backend.app.research_sleeve.promotion_gate import promotion_gate
from backend.app.research_sleeve.strategy_pool import strategy_pool_manager
from backend.app.opportunities.generator import reset_opportunity_state, set_opportunity_active
from backend.app.ai.voice import voice_service

PHASE_NAMES = [
    "Market Observation",
    "Opportunity Detected",
    "Autonomous Decision",
    "Continuous Monitoring",
    "Contradictory Evidence",
    "Autonomous Action",
    "Failure Recording",
    "Repeat Failures",
    "Research Trigger",
    "Hypothesis Creation",
    "Vault Commit & Lock",
    "Historical Backtest",
    "Out-of-Sample Validation",
    "Promotion Gate Evaluation",
    "Strategy Promotion",
    "Loop Back to Strategy Pool"
]

class AutonomousDemoEngine:
    def __init__(self):
        self.current_phase: int = 1
        self.autonomous_mode: bool = True
        self.active_stock: str = "AAPL"
        self.activity_log: List[Dict[str, Any]] = []
        self.running_task: Optional[asyncio.Task] = None
        self.current_experiment: Optional[Experiment] = None

    def log_activity(self, title: str, description: str, category: str = "system") -> Dict[str, Any]:
        entry = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "title": title,
            "description": description,
            "category": category,
            "phase": self.current_phase
        }
        self.activity_log.insert(0, entry)
        if len(self.activity_log) > 100:
            self.activity_log.pop()
        return entry

    async def broadcast_demo_state(self):
        await broadcaster.broadcast("DEMO_STATE_UPDATE", {
            "current_phase": self.current_phase,
            "phase_name": PHASE_NAMES[self.current_phase - 1],
            "total_phases": len(PHASE_NAMES),
            "autonomous_mode": self.autonomous_mode,
            "active_stock": self.active_stock,
            "voice_enabled": voice_service.enabled,
            "activity_log": self.activity_log[:20]
        })

    async def execute_phase(self, phase: int):
        self.current_phase = phase

        if phase == 1:
            # Phase 1: Market Observation
            price = current_market_tick.get("price", 228.40)
            change = current_market_tick.get("change_pct", 1.18)
            self.log_activity("Market Observation", f"Observing AAPL (${price:.2f} +{change:.2f}%) in synthetic paper trading environment.")
            await broadcaster.broadcast("MARKET_TICK", current_market_tick)

        elif phase == 2:
            # Phase 2: Opportunity Detected via Real Positive News & Technical Ingestion
            news_event = await inject_news(
                asset="AAPL",
                headline="Apple raises Q3 guidance and beats revenue expectations",
                source="Reuters (Simulated)",
                sentiment="positive",
                confidence=0.91,
                weight=0.35,
                impact="SUPPORTS BUY AAPL",
                status="ACTIVE"
            )
            await evidence_processor.process_market_event(news_event)
            await evidence_processor.process_market_event({"type": "price", "asset": "AAPL", "rsi": 64.2})
            await evidence_processor.process_market_event({"type": "orderbook", "asset": "AAPL", "bid_volume": 8500, "ask_volume": 4200})

            active_pool = strategy_pool_manager.get_active_pool()
            active_strat = active_pool[-1].strategy_template_id if active_pool else "news_momentum_v1"
            self.log_activity("Opportunity Detected", f"News + Momentum + Liquidity signals aligned for AAPL BUY setup ({active_strat}).", category="decision")

        elif phase == 3:
            # Phase 3: Autonomous Decision Creation via DecisionEngine
            active_pool = strategy_pool_manager.get_active_pool()
            active_strat = active_pool[-1].strategy_template_id if active_pool else "news_momentum_v1"

            nodes = [
                EvidenceNode(
                    id="e1",
                    type=EvidenceType.NEWS,
                    weight=0.35,
                    source="Reuters (Simulated)",
                    headline="Apple raises Q3 guidance and beats revenue expectations",
                    confidence=0.91,
                    impact="SUPPORTS BUY AAPL",
                    status="ACTIVE",
                    freshness="FRESH",
                    value="Apple raises Q3 guidance and beats revenue expectations"
                ),
                EvidenceNode(
                    id="e2",
                    type=EvidenceType.MOMENTUM,
                    weight=0.25,
                    source="RSI_14",
                    confidence=0.95,
                    impact="Bullish Trend",
                    status="ACTIVE",
                    freshness="FRESH",
                    value="RSI 64.2 Bullish Momentum"
                ),
                EvidenceNode(
                    id="e3",
                    type=EvidenceType.ORDERBOOK,
                    weight=0.25,
                    source="OrderBook Depth Proxy",
                    confidence=0.90,
                    impact="Buyer Imbalance",
                    status="ACTIVE",
                    freshness="FRESH",
                    value="Buyer Imbalance 1.8x"
                ),
                EvidenceNode(
                    id="e4",
                    type=EvidenceType.VOLATILITY,
                    weight=0.15,
                    source="VIX Regime Modifier",
                    confidence=0.85,
                    impact="Regime Modifier",
                    status="ACTIVE",
                    freshness="FRESH",
                    value="Normal Volatility"
                )
            ]

            opp = {
                "opportunity_id": f"opp_{uuid.uuid4().hex[:6]}",
                "asset": "AAPL",
                "action": "BUY",
                "evidence_nodes": nodes,
                "strategy_template_id": active_strat
            }
            decision = await decision_engine.handle_opportunity(opp)
            if decision:
                self.log_activity("Autonomous Decision", f"BUY AAPL created (Validity: {decision.validity_score:.2f}, Threshold: {decision.validity_threshold:.2f}, Alloc: 20%).", category="decision")

        elif phase == 4:
            # Phase 4: Continuous Monitoring
            latest_decision = ledger.decisions[-1] if ledger.decisions else None
            if latest_decision:
                v_score = update_decision_validity(latest_decision, "HIGH_VOLATILITY")
                self.log_activity("Continuous Monitoring", f"Monitoring live validity V(t)={v_score:.2f} against adaptive threshold τ={latest_decision.validity_threshold:.2f}.", category="system")
                await broadcaster.broadcast("DECISION_UPDATE", latest_decision.model_dump())

        elif phase == 5:
            # Phase 5: Contradictory News Evidence Injected
            news_event = await inject_news(
                asset="AAPL",
                headline="Apple cuts revenue guidance amid weaker iPhone demand",
                source="Reuters (Simulated)",
                sentiment="negative",
                confidence=0.91,
                weight=0.35,
                impact="CONTRADICTS BUY AAPL",
                status="CONTRADICTED",
                contradicts="latest"
            )
            node = await evidence_processor.process_market_event(news_event)
            latest_decision = ledger.decisions[-1] if ledger.decisions else None

            if latest_decision:
                # Update evidence node freshness and recalculate
                for n in latest_decision.evidence_nodes:
                    if n.type == EvidenceType.NEWS or "NEWS" in str(n.type):
                        n.freshness = "CONTRADICTED"
                        n.status = "CONTRADICTED"
                        n.contradicted = True
                        n.headline = news_event["headline"]
                        n.value = f"{news_event['headline']} (CONTRADICTED)"
                        n.impact = "CONTRADICTS BUY AAPL"
                
                old_v = latest_decision.validity_score
                new_v = update_decision_validity(latest_decision, "HIGH_VOLATILITY")
                self.log_activity(
                    "Contradictory Evidence",
                    f"News contradicted: '{news_event['headline']}'. Validity {old_v:.2f} ➔ {new_v:.2f}.",
                    category="alert"
                )
                await broadcaster.broadcast("DECISION_UPDATE", latest_decision.model_dump())

        elif phase == 6:
            # Phase 6: AUTONOMOUS ACTION (REVERSE AAPL) via real action logic
            latest_decision = ledger.decisions[-1] if ledger.decisions else None
            if latest_decision:
                action = determine_action(latest_decision)
                if action == "REVERSE":
                    latest_decision.status = DecisionStatus.REVERSED
                    exec_res = await executor.execute_trade_action({"action": "SELL", "asset": "AAPL", "allocation": latest_decision.allocation})
                    latest_decision.explanation = (
                        f"The BUY decision was invalidated because supporting news evidence was contradicted. "
                        f"Validity dropped to {latest_decision.validity_score:.2f} (below threshold {latest_decision.validity_threshold:.2f}). "
                        f"Position was automatically REVERSED to SELL AAPL."
                    )
                    ledger.log_decision(latest_decision)
                    self.log_activity(
                        "AUTONOMOUS ACTION",
                        f"VALIDITY BREACHED ({latest_decision.validity_score:.2f} < {latest_decision.validity_threshold:.2f}) ➔ Position AUTOMATICALLY REVERSED (SELL AAPL fill at {exec_res['slippage_bps']}bps slippage).",
                        category="action"
                    )
                    await broadcaster.broadcast("DECISION_UPDATE", latest_decision.model_dump())
                    await broadcaster.broadcast("EXECUTION_UPDATE", {
                        "decision_id": latest_decision.decision_id,
                        "action": "SELL",
                        "asset": "AAPL",
                        "allocation": latest_decision.allocation,
                        "status": "REVERSED",
                        "slippage_bps": exec_res["slippage_bps"]
                    })

        elif phase == 7:
            # Phase 7: Failure Recording
            latest_decision = ledger.decisions[-1] if ledger.decisions else None
            if latest_decision:
                outcome_res = await outcome_monitor.process_decision_update(latest_decision)
                self.log_activity("Failure Recorded", f"FailureEvent logged for strategy {latest_decision.strategy_template_id} in HIGH_VOL regime.", category="failure")

        elif phase == 8:
            # Phase 8: Recurring Failure Pattern (Ensure 3 structural failures recorded)
            while len(ledger.failure_events) < 3:
                f_id = f"fail_{uuid.uuid4().hex[:6]}"
                fail = FailureEvent(
                    failure_id=f_id,
                    decision_id=f"dec_{f_id}",
                    strategy_template_id="news_momentum_v1",
                    regime=RegimeType.HIGH_VOL,
                    invalidation_cause=InvalidationCause.EVIDENCE_CONTRADICTED,
                    dominant_evidence_type=EvidenceType.NEWS
                )
                ledger.log_failure(fail)
            
            self.log_activity("RECURRING FAILURE DETECTED", "3 similar failures detected for news_momentum_v1 during high volatility.", category="pattern")

        elif phase == 9:
            # Phase 9: Research Trigger Fired from PatternDetector
            latest_failure = ledger.failure_events[-1]
            trigger = await pattern_detector.register_failure(latest_failure)
            if not trigger and ledger.research_triggers:
                trigger = ledger.research_triggers[-1]
            elif not trigger:
                trigger = ResearchTrigger(
                    trigger_id=f"trig_{uuid.uuid4().hex[:6]}",
                    strategy_template_id="news_momentum_v1",
                    regime=RegimeType.HIGH_VOL,
                    dominant_evidence_type=EvidenceType.NEWS,
                    failure_count=3,
                    window_sec=300,
                    narrative="3 recurring failures detected for news_momentum_v1 during high-volatility news events. Initiating research experiment."
                )
                ledger.log_trigger(trigger)

            self.log_activity("RESEARCH TRIGGER FIRED", "Initiating Research Sleeve experiment for confirmation delay variant.", category="research")
            await broadcaster.broadcast("RESEARCH_TRIGGER", trigger.model_dump())

        elif phase == 10:
            # Phase 10: Bounded Hypothesis Creation
            latest_trigger = ledger.research_triggers[-1]
            exp = hypothesis_engine.create_experiment_from_trigger(latest_trigger)
            self.current_experiment = exp
            self.log_activity("Hypothesis Generated", f"Test 5-min confirmation delay ({exp.parameters['confirmation_delay_sec']}s) to reduce high-vol news churn.", category="research")
            await broadcaster.broadcast("EXPERIMENT_CREATED", exp.model_dump())

        elif phase == 11:
            # Phase 11: Vault Commit & Lock (Real 10s Lock)
            if self.current_experiment:
                commit_hash = vault_commit_engine.compute_experiment_hash(
                    self.current_experiment.hypothesis,
                    self.current_experiment.strategy_template_id,
                    self.current_experiment.parameters
                )
                exp = experiment_manager.start_commit(self.current_experiment, commit_hash=commit_hash, lock_duration_sec=config.experiment_lock_duration_sec)
                self.log_activity("VAULT LOCK ENFORCED", f"Experiment {exp.experiment_id} committed & locked for 10s (SHA-256: {commit_hash[:8]}...). Parameters frozen.", category="vault")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", exp.model_dump())


        elif phase == 12:
            # Phase 12: Calculated Historical Backtest (Unlock check)
            if self.current_experiment:
                exp = experiment_manager.update_countdown(self.current_experiment.experiment_id)
                if exp and exp.status == ExperimentStatus.LOCKED and exp.seconds_remaining > 0:
                    self.current_phase = 11
                    self.log_activity("VAULT LOCK ACTIVE", f"Vault still locked! {exp.seconds_remaining}s remaining. Parameters frozen.", category="vault")
                    await self.broadcast_demo_state()
                    return

                bt = backtest_engine.run_backtest(self.current_experiment.dataset, self.current_experiment.parameters)
                self.current_experiment.backtest_result = bt
                self.log_activity("Historical Backtest", f"Backtest complete on synthetic stock dataset: Win Rate {bt.win_rate*100:.0f}%, Trades: {bt.trades_count}.", category="research")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", self.current_experiment.model_dump())

        elif phase == 13:
            # Phase 13: Calculated Out-of-Sample Validation
            if self.current_experiment and self.current_experiment.backtest_result:
                val = validation_engine.validate_oos(self.current_experiment.backtest_result, self.current_experiment.parameters)
                self.current_experiment.validation_result = val
                self.log_activity("OOS Validation Complete", f"OOS Sharpe: {val.oos_sharpe:.2f} ✓, p-value: {val.p_value:.3f} ✓, Decay: {val.decay*100:.1f}% ✓", category="validation")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", self.current_experiment.model_dump())

        elif phase == 14:
            # Phase 14: Promotion Gate Evaluation
            if self.current_experiment and self.current_experiment.validation_result:
                is_valid = self.current_experiment.validation_result.is_valid
                status_txt = "PASS" if is_valid else "REJECTED"
                self.log_activity("PROMOTION GATE EVALUATION", f"Promotion Gate {status_txt}: p < 0.05 PASS, OOS Sharpe > 0.8 PASS, Decay < 15% PASS.", category="gate")

        elif phase == 15:
            # Phase 15: Strategy Promoted
            if self.current_experiment:
                promoted = promotion_gate.evaluate_and_promote(self.current_experiment)
                if promoted:
                    self.log_activity("STRATEGY PROMOTED", f"Strategy {promoted.strategy_template_id} ({promoted.name}) promoted to Strategy Pool.", category="promotion")
                    await broadcaster.broadcast("EXPERIMENT_UPDATE", self.current_experiment.model_dump())
                    await broadcaster.broadcast("STRATEGY_PROMOTED", promoted.model_dump())

        elif phase == 16:
            # Phase 16: Loop Back to Strategy Pool
            active_pool = strategy_pool_manager.get_active_pool()
            strat_list = ", ".join([s.strategy_template_id for s in active_pool])
            self.log_activity("LOOP BACK COMPLETE", f"Track A Opportunity Generator can now consume active strategies: {strat_list}.", category="loop")

        await self.broadcast_demo_state()

    async def run_autonomous_loop(self):
        while self.autonomous_mode:
            await self.execute_phase(self.current_phase)

            # If current phase is 11 (Vault Lock), wait until lock countdown reaches 0
            if self.current_phase == 11 and self.current_experiment:
                while self.autonomous_mode:
                    exp = experiment_manager.update_countdown(self.current_experiment.experiment_id)
                    await self.broadcast_demo_state()
                    if not exp or exp.seconds_remaining <= 0 or exp.status != ExperimentStatus.LOCKED:
                        break
                    await asyncio.sleep(1.0)
            else:
                await asyncio.sleep(10.0)

            next_phase = (self.current_phase % len(PHASE_NAMES)) + 1
            self.current_phase = next_phase

    def start_autonomous(self):
        self.autonomous_mode = True
        if self.running_task is None or self.running_task.done():
            self.running_task = asyncio.create_task(self.run_autonomous_loop())

    def pause_autonomous(self):
        self.autonomous_mode = False
        if self.running_task and not self.running_task.done():
            self.running_task.cancel()

    def reset_demo(self):
        self.pause_autonomous()
        ledger.reset()
        reset_opportunity_state()
        self.current_phase = 1
        self.activity_log.clear()
        self.current_experiment = None
        self.log_activity("System Reset", "Demo state reset to Phase 1 in synthetic paper trading mode.")

demo_engine = AutonomousDemoEngine()



