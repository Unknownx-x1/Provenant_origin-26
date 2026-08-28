import asyncio
from fastapi import FastAPI

from app.opportunities.generator import opportunity_generator
from app.ingestion.news_injector import inject_news
from app.ingestion.simulator import market_simulator
from app.evidence.processor import evidence_processor
from app.decisions.creator import decision_creator
from app.decisions.monitor import decision_monitor
from app.execution.executor import decision_executor


app = FastAPI(title="Provenant")


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(market_simulator())
    asyncio.create_task(evidence_processor())
    asyncio.create_task(opportunity_generator())
    asyncio.create_task(decision_creator())
    asyncio.create_task(decision_monitor())
    asyncio.create_task(decision_executor())


@app.post("/inject-news")
async def inject_positive_news():
    await inject_news(
        asset="ASSET_A",
        headline="ASSET_A reports strong earnings",
        sentiment="positive"
    )

    return {
        "status": "news injected"
    }


@app.post("/inject-negative-news")
async def inject_negative_news():
    await inject_news(
        asset="ASSET_A",
        headline="ASSET_A faces major negative developments",
        sentiment="negative"
    )

    return {
        "status": "negative news injected"
    }


@app.get("/")
def health_check():
    return {
        "status": "running",
        "service": "Provenant"
    }