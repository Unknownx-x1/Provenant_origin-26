from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.app.schemas.contracts import VaultState, ExperimentStatus, PromotionStatus
from backend.app.vault.commit import vault_commit_engine
from backend.app.vault.lock_state import vault_lock_state
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.research_sleeve.backtest import backtest_engine
from backend.app.research_sleeve.validation import validation_engine
from backend.app.research_sleeve.promotion_gate import promotion_gate
from backend.app.audit.ledger import ledger
from backend.app.ws.broadcaster import broadcaster

router = APIRouter(prefix="/vault", tags=["Vault"])

class CommitRequest(BaseModel):
    experiment_id: str
    lock_duration_sec: Optional[int] = None

@router.post("/commit")
async def commit_experiment(req: CommitRequest):
    experiment = ledger.get_experiment(req.experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    if vault_lock_state.reject_configuration_change(experiment):
        raise HTTPException(status_code=400, detail="Experiment locked! Parameter change rejected by Vault.")
        
    commit_hash = vault_commit_engine.compute_experiment_hash(
        experiment.hypothesis,
        experiment.strategy_template_id,
        experiment.parameters
    )
    
    lock_sec = req.lock_duration_sec if req.lock_duration_sec is not None else config.experiment_lock_duration_sec
    experiment_manager.start_commit(experiment, commit_hash=commit_hash, lock_duration_sec=lock_sec)

    
    state = vault_lock_state.check_lock(experiment.experiment_id)
    await broadcaster.broadcast("VAULT_STATE", state.dict())
    return {"status": "COMMITTED", "commit_hash": commit_hash, "lock_until": experiment.lock_until}

@router.get("/state/{experiment_id}", response_model=VaultState)
async def get_vault_state(experiment_id: str):
    # Hardware heartbeat is registered whenever hardware polls this endpoint
    vault_lock_state.register_hardware_heartbeat()
    await broadcaster.broadcast("HARDWARE_STATUS", vault_lock_state.hardware_status_payload())

    target_id = experiment_id
    if target_id == "latest" or target_id not in ledger.experiments:
        if ledger.experiments:
            target_id = list(ledger.experiments.keys())[-1]
            
    state = vault_lock_state.check_lock(target_id)
    if not state:
        return VaultState(
            experiment_id=experiment_id,
            state="waiting",
            seconds_remaining=0,
            commit_hash_short="WAITING",
            commit_hash_full="WAITING FOR EXPERIMENT",
            oos_sharpe=None,
            p_value=None,
            hardware_connected=vault_lock_state.is_hardware_connected()
        )
    return state

@router.post("/reveal/{experiment_id}")
async def reveal_experiment(experiment_id: str):
    experiment = ledger.get_experiment(experiment_id)
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
        
    if experiment.seconds_remaining > 0:
        raise HTTPException(status_code=400, detail=f"Vault lock active! {experiment.seconds_remaining}s remaining.")
        
    # Execute backtest & OOS validation after unlock
    experiment.status = ExperimentStatus.TESTING
    await broadcaster.broadcast("EXPERIMENT_UPDATE", experiment.dict())
    
    backtest = backtest_engine.run_backtest(experiment.dataset, experiment.parameters)
    experiment.backtest_result = backtest
    
    validation = validation_engine.validate_oos(backtest, experiment.parameters)
    experiment.validation_result = validation
    
    experiment.status = ExperimentStatus.REVEALING
    await broadcaster.broadcast("EXPERIMENT_UPDATE", experiment.dict())
    
    promoted = promotion_gate.evaluate_and_promote(experiment)
    
    state = vault_lock_state.check_lock(experiment.experiment_id)
    await broadcaster.broadcast("VAULT_STATE", state.dict())
    await broadcaster.broadcast("EXPERIMENT_UPDATE", experiment.dict())
    
    if promoted:
        await broadcaster.broadcast("STRATEGY_PROMOTED", promoted.dict())
        return {"status": "VERIFIED", "promoted": True, "strategy": promoted}
    else:
        return {"status": "REJECTED", "promoted": False}
