from app.ingestion.event_bus import event_bus


async def decision_executor():
    while True:
        execution = await event_bus.execution_events.get()

        print("\n⚡ EXECUTION RECEIVED")
        print("Decision:", execution["decision_id"])
        print("Asset:", execution["asset"])
        print("Action:", execution["action"])
        print("Allocation:", execution["allocation"])

        print("\n✅ EXECUTION COMPLETED")