import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

from backend.app.config import config
from backend.app.schemas.contracts import (
    Decision, DecisionStatus, EvidenceNode, EvidenceType, ExperimentStatus
)
from backend.app.vault.router import router as vault_router
from backend.app.ws.broadcaster import broadcaster
from backend.app.ingestion.simulator import (
    market_simulator, set_market_interval, current_market_tick, market_price_history, market_update_interval_sec
)
from backend.app.ingestion.news_injector import inject_news
from backend.app.opportunities.generator import opportunity_generator
from backend.app.decisions.engine import decision_engine
from backend.app.outcomes.monitor import outcome_monitor
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.research_sleeve.hypothesis import hypothesis_engine
from backend.app.vault.commit import vault_commit_engine
from backend.app.vault.lock_state import vault_lock_state
from backend.app.research_sleeve.experiment import experiment_manager

from backend.app.research_sleeve.strategy_pool import strategy_pool_manager
from backend.app.audit.ledger import ledger
from backend.app.demo.engine import demo_engine, PHASE_NAMES
from backend.app.ai.voice import voice_service

app = FastAPI(title="PROVENANT - Autonomous Stock Market Agent Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vault_router)

@app.on_event("startup")
async def startup_event():
    # 1. Launch real background event pipeline workers
    asyncio.create_task(market_simulator())
    asyncio.create_task(opportunity_generator())
    asyncio.create_task(decision_engine.run_decision_worker())

    # 2. Start autonomous scenario loop
    demo_engine.start_autonomous()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": {
                "active_strategies": [s.model_dump() for s in strategy_pool_manager.get_active_pool()],
                "decisions": [d.model_dump() for d in ledger.decisions],
                "experiments": [e.model_dump() for e in ledger.experiments.values()],
                "triggers": [t.model_dump() for t in ledger.research_triggers],
                "market_tick": current_market_tick,
                "price_history": market_price_history,
                "market_interval": current_market_tick.get("interval_sec", 10.0),
                "hardware_connected": vault_lock_state.is_hardware_connected(),
                "demo_state": {
                    "current_phase": demo_engine.current_phase,
                    "phase_name": PHASE_NAMES[demo_engine.current_phase - 1],
                    "total_phases": 16,
                    "autonomous_mode": demo_engine.autonomous_mode,
                    "active_stock": demo_engine.active_stock,
                    "voice_enabled": voice_service.enabled,
                    "activity_log": demo_engine.activity_log[:20]
                }
            }
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)


@app.get("/api/health")
async def get_health():
    is_hw = vault_lock_state.is_hardware_connected()
    return {
        "backend_status": "ONLINE",
        "websocket_status": "LIVE" if len(broadcaster.active_connections) > 0 else "IDLE",
        "market_status": "ACTIVE",
        "hardware_status": "ONLINE" if is_hw else "OFFLINE",
        "hardware_connected": is_hw,
        "agent_status": "RUNNING" if demo_engine.autonomous_mode else "IDLE",
        "current_phase": demo_engine.current_phase,
        "phase_name": PHASE_NAMES[demo_engine.current_phase - 1],
        "active_stock": demo_engine.active_stock,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/config")
async def get_config():
    return config.dict()

class MarketIntervalRequest(BaseModel):
    interval_sec: float

@app.post("/api/market/interval")
async def update_market_interval(req: MarketIntervalRequest):
    new_interval = set_market_interval(req.interval_sec)
    await broadcaster.broadcast("MARKET_TICK", current_market_tick)
    return {"status": "SUCCESS", "interval_sec": new_interval}

@app.get("/api/market/state")
async def get_market_state():
    return {
        "market_tick": current_market_tick,
        "price_history": market_price_history,
        "interval_sec": current_market_tick.get("interval_sec", 10.0)
    }

class InjectNewsRequest(BaseModel):
    headline: Optional[str] = "Apple raises Q3 guidance"
    sentiment: Optional[str] = "positive"
    contradicts: Optional[str] = None

@app.post("/api/market/inject-news")
async def inject_news_endpoint(req: InjectNewsRequest):
    news_ev = await inject_news(
        asset="AAPL",
        headline=req.headline or "Apple corporate update",
        sentiment=req.sentiment or "positive",
        contradicts=req.contradicts
    )
    return {"status": "INJECTED", "news": news_ev}

@app.get("/api/demo/state")
async def get_demo_state():
    return {
        "current_phase": demo_engine.current_phase,
        "phase_name": PHASE_NAMES[demo_engine.current_phase - 1],
        "total_phases": 16,
        "autonomous_mode": demo_engine.autonomous_mode,
        "active_stock": demo_engine.active_stock,
        "voice_enabled": voice_service.enabled,
        "activity_log": demo_engine.activity_log[:20]
    }

class StepRequest(BaseModel):
    phase: Optional[int] = None

@app.post("/api/demo/auto-step")
async def step_demo(req: Optional[StepRequest] = None):
    # If Vault is LOCKED, reject manual step progression past phase 11 until countdown reaches 0
    if demo_engine.current_experiment:
        exp = experiment_manager.update_countdown(demo_engine.current_experiment.experiment_id)
        if exp and exp.status == ExperimentStatus.LOCKED and exp.seconds_remaining > 0:
            target_phase = req.phase if (req and req.phase) else (demo_engine.current_phase % 16) + 1
            if target_phase > 11:
                return {
                    "status": "VAULT_LOCKED",
                    "message": f"Vault lock active! 00:{exp.seconds_remaining:02d} remaining. Experiment parameters are frozen.",
                    "current_phase": 11,
                    "phase_name": PHASE_NAMES[10],
                    "seconds_remaining": exp.seconds_remaining
                }

    demo_engine.autonomous_mode = False
    target_phase = req.phase if (req and req.phase) else (demo_engine.current_phase % 16) + 1
    await demo_engine.execute_phase(target_phase)
    return {"status": "SUCCESS", "current_phase": demo_engine.current_phase, "phase_name": PHASE_NAMES[demo_engine.current_phase - 1]}


@app.post("/api/demo/toggle-auto")
async def toggle_auto():
    if demo_engine.autonomous_mode:
        demo_engine.pause_autonomous()
    else:
        demo_engine.start_autonomous()
    await demo_engine.broadcast_demo_state()
    return {"autonomous_mode": demo_engine.autonomous_mode}

@app.post("/api/demo/reset")
@app.post("/api/reset")
async def reset_demo():
    demo_engine.reset_demo()
    await broadcaster.broadcast("RESET", {})
    await demo_engine.broadcast_demo_state()
    return {"status": "SUCCESS", "message": "Demo state reset"}

class VoiceRequest(BaseModel):
    text: str

@app.post("/api/demo/voice/speak")
async def speak_voice(req: VoiceRequest):
    audio_data = await voice_service.generate_speech(req.text)
    if audio_data:
        return Response(content=audio_data, media_type="audio/mpeg")
    return {"status": "FALLBACK_TO_SPEECH_SYNTHESIS", "text": req.text}

@app.post("/api/demo/voice/toggle")
async def toggle_voice():
    enabled = voice_service.toggle_voice()
    await demo_engine.broadcast_demo_state()
    return {"voice_enabled": enabled}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

