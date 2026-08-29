import time
import asyncio
from typing import Optional
from backend.app.schemas.contracts import Experiment, ExperimentStatus, VaultState
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.audit.ledger import ledger

class VaultLockState:
    def __init__(self):
        self.last_hardware_heartbeat: float = 0.0

    def register_hardware_heartbeat(self):
        self.last_hardware_heartbeat = time.time()

    def is_hardware_connected(self) -> bool:
        # Physical device is considered CONNECTED only if polled within 5 seconds
        return (time.time() - self.last_hardware_heartbeat) < 5.0

    def hardware_status_payload(self) -> dict:
        return {
            "connected": self.is_hardware_connected(),
            "timeout_sec": 5,
        }

    def check_lock(self, experiment_id: str) -> Optional[VaultState]:
        experiment = experiment_manager.update_countdown(experiment_id)
        if not experiment:
            return None
            
        short_hash = experiment.commit_hash[:6] + "..." + experiment.commit_hash[-4:] if experiment.commit_hash else "NONE"
        full_hash = experiment.commit_hash or "NONE"
        
        oos_sharpe = experiment.validation_result.oos_sharpe if experiment.validation_result else None
        p_val = experiment.validation_result.p_value if experiment.validation_result else None
        
        return VaultState(
            experiment_id=experiment.experiment_id,
            state=experiment.status.value.lower(),
            seconds_remaining=experiment.seconds_remaining,
            commit_hash_short=short_hash,
            commit_hash_full=full_hash,
            oos_sharpe=oos_sharpe,
            p_value=p_val,
            hardware_connected=self.is_hardware_connected()
        )

    def reject_configuration_change(self, experiment: Experiment) -> bool:
        """
        Anti-p-hacking rule:
        If experiment is in LOCKED state, any attempt to modify parameters or restart
        backtest with tweaked window is strictly rejected server-side.
        """
        if experiment.status == ExperimentStatus.LOCKED and experiment.seconds_remaining > 0:
            return True  # Configuration change REJECTED
        return False

vault_lock_state = VaultLockState()


async def hardware_status_monitor() -> None:
    """Broadcast presence transitions without affecting Vault lock semantics."""
    from backend.app.ws.broadcaster import broadcaster

    previous_status = None
    while True:
        try:
            status = vault_lock_state.hardware_status_payload()
            if status["connected"] != previous_status:
                await broadcaster.broadcast("HARDWARE_STATUS", status)
                previous_status = status["connected"]
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            break
