from typing import Optional
from backend.app.schemas.contracts import Experiment, ExperimentStatus, VaultState
from backend.app.research_sleeve.experiment import experiment_manager
from backend.app.audit.ledger import ledger

class VaultLockState:
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
            hardware_connected=True  # Hardware polling endpoint checks this
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
