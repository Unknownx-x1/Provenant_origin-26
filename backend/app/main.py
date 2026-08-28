import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from backend.app.config import config
from backend.app.schemas.contracts import (
    Decision, DecisionStatus, EvidenceNode, EvidenceType
)
from backend.app.vault.router import router as vault_router
from backend.app.ws.broadcaster import broadcaster
from backend.app.outcomes.monitor import outcome_monitor
from backend.app.research_sleeve.pattern_detector import pattern_detector
from backend.app.research_sleeve.hypothesis import hypothesis_engine
from backend.app.vault.commit import vault_commit_engine
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
    # Start autonomous demo engine loop on startup
    demo_engine.start_autonomous()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "data": {
                "active_strategies": [s.dict() for s in strategy_pool_manager.get_active_pool()],
                "decisions": [d.dict() for d in ledger.decisions],
                "experiments": [e.dict() for e in ledger.experiments.values()],
                "triggers": [t.dict() for t in ledger.research_triggers],
                "demo_state": {
                    "current_phase": demo_engine.current_phase,
                    "phase_name": PHASE_NAMES[demo_engine.current_phase - 1],
                    "total_phases": 16,
                    "autonomous_mode": demo_engine.autonomous_mode,
                    "active_stock": demo_engine.active_stock,
                    "voice_enabled": voice_service.enabled,
                    "activity_log": demo_engine.activity_log[:15]
                }
            }
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(websocket)

@app.get("/api/config")
async def get_config():
    return config.dict()

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
    # Manual override control
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
