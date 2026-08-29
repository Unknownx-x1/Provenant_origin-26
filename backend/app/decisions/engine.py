import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from backend.app.schemas.contracts import Decision, DecisionStatus, EvidenceNode, EvidenceType
from backend.app.ingestion.event_bus import event_bus
from backend.app.risk.evaluator import evaluate_risk
from backend.app.risk.allocator import allocate_capital
from backend.app.decisions.validity_engine import update_decision_validity, calculate_adaptive_threshold
from backend.app.decisions.actions import determine_action
from backend.app.execution.validator import execution_validator
from backend.app.execution.executor import executor
from backend.app.config import config
from backend.app.audit.ledger import ledger
from backend.app.ws.broadcaster import broadcaster
from backend.app.outcomes.monitor import outcome_monitor
from backend.app.opportunities.generator import set_opportunity_active

class DecisionEngine:
    def __init__(self):
        self.active_decision: Optional[Decision] = None

    async def handle_opportunity(self, opp: dict) -> Optional[Decision]:
        initial_action = str(opp.get("action", "HOLD")).upper()
        if initial_action not in {"BUY", "SELL"}:
            return None
        # 1. Risk Evaluation
        risk_res = evaluate_risk(opp)
        if not risk_res.get("approved"):
            return None

        # 2. Capital Allocation
        alloc_res = allocate_capital(opp, risk_res)
        if not alloc_res.get("allocated"):
            return None

        allocation = alloc_res["allocation"]
        decision_id = f"dec_{uuid.uuid4().hex[:6]}"
        nodes: List[EvidenceNode] = opp.get("evidence_nodes", [])

        # 3. Create Decision
        decision = Decision(
            decision_id=decision_id,
            opportunity_id=opp.get("opportunity_id", f"opp_{decision_id}"),
            asset=opp.get("asset", "AAPL"),
            action=initial_action,
            evidence_nodes=nodes,
            validity_score=0.0,
            validity_threshold=calculate_adaptive_threshold("HIGH_VOLATILITY"),
            status=DecisionStatus.OPEN,
            strategy_template_id=opp.get("strategy_template_id", "news_momentum_v1"),
            allocation=allocation,
            explanation=f"Autonomous {initial_action} decision formulated from aligned news, momentum, and orderbook evidence."
        )

        # Initial validity score recompute
        update_decision_validity(decision, "HIGH_VOLATILITY")

        # 4. Execution Validation & Simulation
        requested_amount_usd = allocation * config.max_capital
        val_res = execution_validator.validate_execution(decision, requested_amount_usd)
        if not val_res.get("valid"):
            decision.status = DecisionStatus.CANCELLED
            ledger.log_decision(decision)
            await broadcaster.broadcast("DECISION_UPDATE", decision.model_dump())
            return decision

        exec_res = await executor.execute_trade_action({
            "decision_id": decision.decision_id,
            "action": decision.action,
            "asset": decision.asset,
            "allocation": allocation
        })

        ledger.log_decision(decision)
        self.active_decision = decision

        await broadcaster.broadcast("DECISION_UPDATE", decision.model_dump())
        await broadcaster.broadcast("EXECUTION_UPDATE", {
            "decision_id": decision.decision_id,
            "action": decision.action,
            "asset": decision.asset,
            "allocation": allocation,
            "status": "EXECUTED",
            "slippage_bps": exec_res.get("slippage_bps", 5)
        })
        await event_bus.execution_events.put(exec_res)

        await event_bus.decision_events.put(decision)
        return decision

    async def handle_contradictory_evidence(self, node: Any) -> Optional[Decision]:
        if not self.active_decision or self.active_decision.status not in {DecisionStatus.OPEN, DecisionStatus.REDUCED}:
            # Check latest decision in ledger if active_decision is not set
            if ledger.decisions and ledger.decisions[-1].status in {DecisionStatus.OPEN, DecisionStatus.REDUCED}:
                self.active_decision = ledger.decisions[-1]
            else:
                return None

        decision = self.active_decision

        # Find and update matching news evidence node
        updated = False
        headline = getattr(node, "headline", getattr(node, "value", "Contradictory News"))
        for n in decision.evidence_nodes:
            if n.type == EvidenceType.NEWS or "NEWS" in str(n.type):
                n.freshness = "CONTRADICTED"
                n.status = "CONTRADICTED"
                n.contradicted = True
                n.headline = headline
                n.value = f"{headline} (CONTRADICTED)"
                n.impact = "CONTRADICTS BUY AAPL"
                updated = True
                break

        if not updated:
            decision.evidence_nodes.insert(0, EvidenceNode(
                id=getattr(node, "id", f"ev_{uuid.uuid4().hex[:6]}"),
                type=EvidenceType.NEWS,
                weight=0.35,
                source=getattr(node, "source", "Reuters (Simulated)"),
                headline=headline,
                freshness="CONTRADICTED",
                status="CONTRADICTED",
                contradicted=True,
                impact="CONTRADICTS BUY AAPL",
                value=f"{headline} (CONTRADICTED)"
            ))

        # Recompute validity score
        old_score = decision.validity_score
        new_score = update_decision_validity(decision, "HIGH_VOLATILITY")
        action = determine_action(decision)

        if action == "REDUCE":
            exec_res = await executor.execute_trade_action({
                "decision_id": decision.decision_id,
                "action": "REDUCE",
                "asset": decision.asset,
                "current_action": decision.action,
                "current_allocation": decision.allocation,
            })
            decision.allocation = exec_res["filled_allocation"]
            decision.status = DecisionStatus.REDUCED
            decision.explanation = f"Exposure reduced after validity fell from {old_score:.2f} to {new_score:.2f}."
            await broadcaster.broadcast("DECISION_UPDATE", decision.model_dump())
            await broadcaster.broadcast("EXECUTION_UPDATE", {**exec_res, "status": "REDUCED"})
            await event_bus.execution_events.put(exec_res)
        elif action == "REVERSE":
            decision.status = DecisionStatus.REVERSED
            decision.explanation = (
                f"The {decision.action} decision was invalidated because supporting news evidence was contradicted "
                f"by: '{headline}'. Validity dropped from {old_score:.2f} to {new_score:.2f} "
                f"(below adaptive threshold {decision.validity_threshold:.2f}). "
                f"Position was automatically REVERSED."
            )

            # Execute reversal paper trade
            exec_res = await executor.execute_trade_action({
                "decision_id": decision.decision_id,
                "action": "REVERSE",
                "asset": decision.asset,
                "current_action": decision.action,
                "current_allocation": decision.allocation,
                "allocation": decision.allocation,
            })
            decision.action = exec_res["resulting_action"]
            decision.allocation = exec_res["filled_allocation"]

            ledger.log_decision(decision)
            self.active_decision = None
            set_opportunity_active(False)  # Release opportunity lock for future cycles

            await broadcaster.broadcast("DECISION_UPDATE", decision.model_dump())
            await broadcaster.broadcast("EXECUTION_UPDATE", {
                "decision_id": decision.decision_id,
                "action": decision.action,
                "asset": decision.asset,
                "allocation": decision.allocation,
                "status": "REVERSED",
                "slippage_bps": exec_res.get("slippage_bps", 5)
            })
            await event_bus.execution_events.put(exec_res)

            # Process invalidation outcome -> triggers FailureEvent and PatternDetector
            outcome_res = await outcome_monitor.process_decision_update(decision)
            if outcome_res and outcome_res.get("failure"):
                await event_bus.failure_events.put(outcome_res["failure"])
        else:
            await broadcaster.broadcast("DECISION_UPDATE", decision.model_dump())

        return decision

    async def run_decision_worker(self):
        while True:
            try:
                # Listen to opportunities and contradictory evidence
                opp_task = asyncio.create_task(event_bus.opportunity_events.get())
                ev_task = asyncio.create_task(event_bus.decision_evidence_events.get())

                done, pending = await asyncio.wait(
                    [opp_task, ev_task],
                    return_when=asyncio.FIRST_COMPLETED
                )

                for task in pending:
                    task.cancel()

                for task in done:
                    res = task.result()
                    if isinstance(res, dict) and "opportunity_id" in res:
                        await self.handle_opportunity(res)
                    else:
                        await self.handle_contradictory_evidence(res)

            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(0.1)

decision_engine = DecisionEngine()
