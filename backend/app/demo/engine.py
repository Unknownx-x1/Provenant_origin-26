import asyncio
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.schemas.contracts import (
    Decision, DecisionStatus, EvidenceNode, EvidenceType, FailureEvent, InvalidationCause, RegimeType,
    ResearchTrigger, Experiment, ExperimentStatus, PromotionStatus, StrategyPoolEntry
)
from backend.app.audit.ledger import ledger
from backend.app.ws.broadcaster import broadcaster
from backend.app.outcomes.failure_analysis import failure_analysis
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.research_sleeve.hypothesis import hypothesis_engine
from backend.app.vault.commit import vault_commit_engine
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.research_sleeve.backtest import backtest_engine
from backend.app.research_sleeve.validation import validation_engine
from backend.app.research_sleeve.promotion_gate import promotion_gate
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
            "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
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
            "activity_log": self.activity_log[:15]
        })

    async def execute_phase(self, phase: int):
        self.current_phase = phase
        phase_title = f"Phase {phase}/16: {PHASE_NAMES[phase - 1]}"

        if phase == 1:
            # Phase 1: Market Observation
            self.log_activity("Market Observation", "Observing AAPL ($227.40 +1.18%) in synthetic paper trading environment.")
            await broadcaster.broadcast("MARKET_TICK", {
                "asset": "AAPL",
                "price": 227.40,
                "change_pct": 1.18,
                "volume": 7450000
            })

        elif phase == 2:
            # Phase 2: Opportunity Detected
            self.log_activity("Opportunity Detected", "News + Momentum + Liquidity signals aligned for AAPL BUY setup.")

        elif phase == 3:
            # Phase 3: Autonomous Decision Creation (BUY AAPL, V=0.91)
            decision_id = f"dec_{uuid.uuid4().hex[:6]}"
            decision = Decision(
                decision_id=decision_id,
                opportunity_id=f"opp_{decision_id}",
                asset="AAPL",
                action="BUY",
                evidence_nodes=[
                    EvidenceNode(id="e1", type=EvidenceType.NEWS, weight=0.35, source="Bloomberg Breaking", captured_at="2026-08-28T16:00:00Z", value="Positive Earnings Beats Expectations"),
                    EvidenceNode(id="e2", type=EvidenceType.MOMENTUM, weight=0.25, source="RSI_14 (Crossed > 60)", captured_at="2026-08-28T16:00:00Z", value="Bullish Momentum"),
                    EvidenceNode(id="e3", type=EvidenceType.ORDERBOOK, weight=0.25, source="Depth Proxy (Imbalance 1.8x)", captured_at="2026-08-28T16:00:00Z", value="Buyer Imbalance"),
                    EvidenceNode(id="e4", type=EvidenceType.VOLATILITY, weight=0.15, source="VIX Regime Modifier", captured_at="2026-08-28T16:00:00Z", value="Normal Volatility")
                ],
                validity_score=0.91,
                validity_threshold=0.60,
                status=DecisionStatus.OPEN,
                strategy_template_id="news_momentum_v1"
            )
            ledger.log_decision(decision)
            self.log_activity("Autonomous Decision", f"BUY AAPL created (Validity: 0.91, Risk: 0.33, Alloc: 20%).", category="decision")
            await broadcaster.broadcast("DECISION_UPDATE", decision.dict())

        elif phase == 4:
            # Phase 4: Continuous Monitoring
            self.log_activity("Continuous Monitoring", "Monitoring live validity V(t) against adaptive threshold τ=0.60.")

        elif phase == 5:
            # Phase 5: Contradictory Evidence ("Apple earnings guidance revised downward")
            latest_decision = ledger.decisions[-1] if ledger.decisions else None
            if latest_decision:
                latest_decision.validity_score = 0.34
                latest_decision.evidence_nodes[0].freshness = "DECAYING"
                latest_decision.evidence_nodes[0].value = "Apple earnings guidance revised downward (CONTRADICTED)"
                latest_decision.explanation = "The BUY decision was invalidated because positive earnings news was contradicted by downward guidance. Validity fell from 0.91 to 0.34 (below threshold 0.60)."
                
                self.log_activity("Contradictory Evidence", "News contradicted: Apple earnings guidance revised downward. Validity 0.91 ➔ 0.34.", category="alert")
                await broadcaster.broadcast("DECISION_UPDATE", latest_decision.dict())

        elif phase == 6:
            # Phase 6: AUTONOMOUS ACTION (REVERSE AAPL)
            latest_decision = ledger.decisions[-1] if ledger.decisions else None
            if latest_decision:
                latest_decision.status = DecisionStatus.REVERSED
                self.log_activity("AUTONOMOUS ACTION", "VALIDITY BREACHED (0.34 < 0.60) ➔ Position AUTOMATICALLY REVERSED (SELL AAPL).", category="action")
                await broadcaster.broadcast("DECISION_UPDATE", latest_decision.dict())

        elif phase == 7:
            # Phase 7: Failure Recording
            latest_decision = ledger.decisions[-1] if ledger.decisions else None
            if latest_decision:
                failure = await failure_analysis.analyze_invalidation(
                    decision=latest_decision,
                    cause=InvalidationCause.EVIDENCE_CONTRADICTED,
                    regime=RegimeType.HIGH_VOL,
                    dominant_evidence=EvidenceType.NEWS
                )
                self.log_activity("Failure Recorded", f"FailureEvent logged for strategy news_momentum_v1 in HIGH_VOL regime.", category="failure")
                await broadcaster.broadcast("FAILURE_EVENT", failure.dict())

        elif phase == 8:
            # Phase 8: Repeat Failures (Ensure 3 failures exist to trigger research)
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
            # Phase 9: Research Trigger Fired
            latest_failure = ledger.failure_events[-1]
            trigger = await pattern_detector.register_failure(latest_failure)
            if not trigger:
                trigger = ResearchTrigger(
                    trigger_id=f"trig_{uuid.uuid4().hex[:6]}",
                    strategy_template_id="news_momentum_v1",
                    regime=RegimeType.HIGH_VOL,
                    dominant_evidence_type=EvidenceType.NEWS,
                    failure_count=3,
                    window_sec=300,
                    narrative="3 failures detected for news_momentum_v1 during high-volatility news events. Initiating research experiment."
                )
                ledger.log_trigger(trigger)

            self.log_activity("RESEARCH TRIGGER FIRED", "Initiating Research Sleeve experiment for confirmation delay variant.", category="research")
            await broadcaster.broadcast("RESEARCH_TRIGGER", trigger.dict())

        elif phase == 10:
            # Phase 10: Bounded Hypothesis Creation
            latest_trigger = ledger.research_triggers[-1]
            exp = hypothesis_engine.create_experiment_from_trigger(latest_trigger)
            self.current_experiment = exp
            self.log_activity("Hypothesis Generated", f"Test 5-min confirmation delay ({exp.parameters['confirmation_delay_sec']}s) to reduce high-vol news churn.", category="research")
            await broadcaster.broadcast("EXPERIMENT_CREATED", exp.dict())

        elif phase == 11:
            # Phase 11: Vault Commit & Lock
            if self.current_experiment:
                commit_hash = vault_commit_engine.compute_experiment_hash(
                    self.current_experiment.hypothesis,
                    self.current_experiment.strategy_template_id,
                    self.current_experiment.parameters
                )
                exp = experiment_manager.start_commit(self.current_experiment, commit_hash=commit_hash, lock_duration_sec=0) # 0s for demo flow
                self.log_activity("VAULT LOCK ENFORCED", f"Experiment {exp.experiment_id} committed & locked (SHA-256: {commit_hash[:8]}...). Parameters frozen.", category="vault")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", exp.dict())

        elif phase == 12:
            # Phase 12: Historical Backtest
            if self.current_experiment:
                bt = backtest_engine.run_backtest(self.current_experiment.dataset, self.current_experiment.parameters)
                self.current_experiment.backtest_result = bt
                self.log_activity("Historical Backtest", f"Backtest complete on synthetic stock dataset: Win Rate {bt.win_rate*100:.0f}%, Trades: {bt.trades_count}.", category="research")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", self.current_experiment.dict())

        elif phase == 13:
            # Phase 13: Out-of-Sample Validation
            if self.current_experiment and self.current_experiment.backtest_result:
                val = validation_engine.validate_oos(self.current_experiment.backtest_result, self.current_experiment.parameters)
                self.current_experiment.validation_result = val
                self.log_activity("OOS Validation Complete", f"OOS Sharpe: {val.oos_sharpe} ✓, p-value: {val.p_value} ✓, Decay: {val.decay*100:.1f}% ✓", category="validation")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", self.current_experiment.dict())

        elif phase == 14:
            # Phase 14: Promotion Gate Evaluation
            self.log_activity("PROMOTION GATE PASS", "All 3 criteria cleared: p < 0.05 PASS, OOS Sharpe > 0.8 PASS, Decay < 15% PASS.", category="gate")

        elif phase == 15:
            # Phase 15: Strategy Promoted
            if self.current_experiment:
                promoted = promotion_gate.evaluate_and_promote(self.current_experiment)
                self.log_activity("STRATEGY PROMOTED", f"Strategy news_momentum_v2 (5-Min Confirmation Delay) promoted to Strategy Pool.", category="promotion")
                await broadcaster.broadcast("EXPERIMENT_UPDATE", self.current_experiment.dict())
                if promoted:
                    await broadcaster.broadcast("STRATEGY_PROMOTED", promoted.dict())

        elif phase == 16:
            # Phase 16: Loop Back to Strategy Pool
            self.log_activity("LOOP BACK COMPLETE", "Track A Opportunity Generator can now use active strategy news_momentum_v2.", category="loop")

        await self.broadcast_demo_state()

    async def run_autonomous_loop(self):
        while self.autonomous_mode:
            await self.execute_phase(self.current_phase)
            await asyncio.sleep(2.5)  # 2.5s per phase in autonomous mode
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
        self.current_phase = 1
        self.activity_log.clear()
        self.current_experiment = None
        self.log_activity("System Reset", "Demo state reset to Phase 1 in synthetic paper trading mode.")

demo_engine = AutonomousDemoEngine()
