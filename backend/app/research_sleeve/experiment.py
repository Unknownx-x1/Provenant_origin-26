from datetime import datetime, timezone, timedelta
from typing import Optional
from backend.app.schemas.contracts import Experiment, ExperimentStatus, PromotionStatus
from backend.app.audit.ledger import ledger

class ExperimentManager:
    def start_commit(self, experiment: Experiment, commit_hash: str, lock_duration_sec: int = 60) -> Experiment:
        now = datetime.now(timezone.utc)
        until = now + timedelta(seconds=lock_duration_sec)
        
        experiment.commit_hash = commit_hash
        experiment.locked_at = now.isoformat()
        experiment.lock_until = until.isoformat()
        experiment.seconds_remaining = lock_duration_sec
        experiment.status = ExperimentStatus.LOCKED
        
        ledger.save_experiment(experiment)
        return experiment

    def update_countdown(self, experiment_id: str) -> Optional[Experiment]:
        experiment = ledger.get_experiment(experiment_id)
        if not experiment or not experiment.lock_until:
            return experiment
            
        try:
            until_dt = datetime.fromisoformat(experiment.lock_until.replace("Z", "+00:00"))
        except Exception:
            until_dt = datetime.now(timezone.utc)

        if until_dt.tzinfo is None:
            until_dt = until_dt.replace(tzinfo=timezone.utc)

        now_dt = datetime.now(timezone.utc)
        remaining = int((until_dt - now_dt).total_seconds())
        
        if remaining <= 0:
            experiment.seconds_remaining = 0
            if experiment.status == ExperimentStatus.LOCKED:
                experiment.status = ExperimentStatus.TESTING
        else:
            experiment.seconds_remaining = remaining
            
        ledger.save_experiment(experiment)
        return experiment

experiment_manager = ExperimentManager()

