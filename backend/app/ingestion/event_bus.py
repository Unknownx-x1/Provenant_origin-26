import asyncio

class EventBus:
    def __init__(self):
        self.market_events = asyncio.Queue()
        self.evidence_events = asyncio.Queue()
        self.opportunity_events = asyncio.Queue()
        self.decision_events = asyncio.Queue()
        self.decision_evidence_events = asyncio.Queue()
        self.execution_events = asyncio.Queue()

event_bus = EventBus()
