import asyncio


class EventBus:
    def __init__(self):
        self.market_events = asyncio.Queue()

        # Evidence used to generate opportunities
        self.evidence_events = asyncio.Queue()

        # Opportunities waiting for decision creation
        self.opportunity_events = asyncio.Queue()

        # Newly created decisions
        self.decision_events = asyncio.Queue()

        # New evidence that can affect active decisions
        self.decision_evidence_events = asyncio.Queue()

        # Actions waiting for execution
        self.execution_events = asyncio.Queue()


event_bus = EventBus()