import asyncio

from app.ingestion.event_bus import event_bus
from app.decisions.validity_engine import update_decision_validity
from app.decisions.actions import apply_action


active_decisions = []


async def decision_monitor():
    while True:

        while not event_bus.decision_events.empty():
            decision = await event_bus.decision_events.get()

            active_decisions.append(decision)

            print(
                f"\nDECISION NOW MONITORED: "
                f"{decision.decision_id}"
            )

        while not event_bus.decision_evidence_events.empty():
            evidence = await event_bus.decision_evidence_events.get()

            print("\n⚠️ CONTRADICTORY EVIDENCE RECEIVED")
            print(f"Type: {evidence.type}")
            print(
                f"Sentiment: "
                f"{getattr(evidence, 'sentiment', 'unknown')}"
            )

            for decision in active_decisions:
                if (
                    decision.status == "OPEN"
                    and decision.action == "BUY"
                ):
                    old_validity = decision.validity_score

                    decision.validity_score = round(
                        decision.validity_score * 0.5,
                        2
                    )

                    print(
                        f"\nCONTRADICTION PENALTY: "
                        f"{old_validity} → "
                        f"{decision.validity_score}"
                    )

                    action = apply_action(decision)

                    if action:
                        await event_bus.execution_events.put({
                            "decision_id": decision.decision_id,
                            "asset": decision.asset,
                            "action": action,
                            "allocation": decision.allocation
                        })

        for decision in active_decisions:
            if decision.status == "OPEN":
                update_decision_validity(decision)

                action = apply_action(decision)

                if action:
                    await event_bus.execution_events.put({
                        "decision_id": decision.decision_id,
                        "asset": decision.asset,
                        "action": action,
                        "allocation": decision.allocation
                    })

        await asyncio.sleep(1)