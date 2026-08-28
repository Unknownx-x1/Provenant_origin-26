import uuid

from app.ingestion.event_bus import event_bus
from app.risk.evaluator import evaluate_risk
from app.risk.allocator import allocate_capital
from app.decisions.models import Decision


VALIDITY_THRESHOLD = 0.60


async def decision_creator():
    while True:
        opportunity = await event_bus.opportunity_events.get()

        # 1. Evaluate risk
        risk_result = evaluate_risk(opportunity)

        # 2. Allocate capital
        allocation_result = allocate_capital(
            opportunity,
            risk_result
        )

        # Stop if capital was not allocated
        if not allocation_result["allocated"]:
            print("\nDECISION REJECTED")
            continue

        # 3. Create the Decision
        decision = Decision(
            decision_id=str(uuid.uuid4()),
            opportunity_id=opportunity["opportunity_id"],
            asset=opportunity["asset"],
            action=opportunity["action"],
            evidence_nodes=opportunity["evidence_nodes"],
            validity_score=0.91,
            validity_threshold=VALIDITY_THRESHOLD,
            status="OPEN",
            strategy_template_id=opportunity["strategy_template_id"],
            allocation=allocation_result["allocation"]
        )

        # 4. Send decision to the next stage
        await event_bus.decision_events.put(decision)

        print("\nDECISION CREATED")
        print(f"ID: {decision.decision_id}")
        print(f"Action: {decision.action}")
        print(f"Validity: {decision.validity_score}")
        print(f"Threshold: {decision.validity_threshold}")
        print(f"Allocation: {decision.allocation}")