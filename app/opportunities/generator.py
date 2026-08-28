import uuid

from app.ingestion.event_bus import event_bus


latest_evidence = {}

# Prevent repeated opportunities while one setup is active
opportunity_active = False


async def opportunity_generator():
    global opportunity_active

    while True:
        evidence = await event_bus.evidence_events.get()

        print(f"\nOPPORTUNITY GENERATOR RECEIVED: {evidence.type}")

        # Store latest evidence of each type
        latest_evidence[evidence.type] = evidence

        print(
            "CURRENT EVIDENCE:",
            list(latest_evidence.keys())
        )

        required_evidence = [
            "news",
            "momentum",
            "orderbook"
        ]

        # Do not create another opportunity while one setup is active
        if opportunity_active:
            print("OPPORTUNITY ALREADY ACTIVE")
            continue

        # Check that all required evidence exists
        if all(
            evidence_type in latest_evidence
            for evidence_type in required_evidence
        ):

            news_evidence = latest_evidence["news"]

            # Only POSITIVE news can support a BUY opportunity
            if getattr(news_evidence, "sentiment", None) != "positive":
                print(
                    "OPPORTUNITY BLOCKED: "
                    "News sentiment is not positive"
                )
                continue

            opportunity = {
                "opportunity_id": str(uuid.uuid4()),
                "asset": "ASSET_A",
                "action": "BUY",
                "evidence_nodes": [
                    latest_evidence["news"],
                    latest_evidence["momentum"],
                    latest_evidence["orderbook"]
                ],
                "strategy_template_id": "news_momentum_immediate"
            }

            opportunity_active = True

            await event_bus.opportunity_events.put(opportunity)

            print("\nOPPORTUNITY CREATED")
            print("Action: BUY")
            print(
                "Evidence:",
                [e.type for e in opportunity["evidence_nodes"]]
            )

        else:
            missing = [
                evidence_type
                for evidence_type in required_evidence
                if evidence_type not in latest_evidence
            ]

            print("WAITING FOR:", missing)