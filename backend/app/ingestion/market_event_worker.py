import asyncio

from backend.app.evidence.processor import evidence_processor
from backend.app.ingestion.event_bus import event_bus


async def market_event_worker() -> None:
    """Convert the established market-event stream into evidence nodes.

    News is broadcast when injected; this worker only advances the existing
    ingestion/evidence pipeline for queued news, price, and orderbook events.
    """
    while True:
        try:
            event = await event_bus.market_events.get()
            await evidence_processor.process_market_event(event)
        except asyncio.CancelledError:
            break
        except Exception:
            # Preserve the simulator's resilient background-worker behavior.
            await asyncio.sleep(0.1)
