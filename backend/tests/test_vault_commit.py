from backend.app.schemas.contracts import Experiment, ExperimentStatus
from backend.app.vault.commit import vault_commit_engine
from backend.app.vault.lock_state import vault_lock_state
from backend.app.research_sleeve.experiment import experiment_manager

def test_vault_sha256_and_lock_rejection():
    exp = Experiment(
        experiment_id="exp_test",
        hypothesis="Delay entry test",
        strategy_template_id="v1",
        parameters={"confirmation_delay_sec": 300}
    )
    
    hash1 = vault_commit_engine.compute_experiment_hash(exp.hypothesis, exp.strategy_template_id, exp.parameters)
    hash2 = vault_commit_engine.compute_experiment_hash(exp.hypothesis, exp.strategy_template_id, exp.parameters)
    
    assert len(hash1) == 64
    assert hash1 == hash2  # Deterministic SHA-256
    
    # Start lock
    experiment_manager.start_commit(exp, hash1, lock_duration_sec=10)
    assert exp.status == ExperimentStatus.LOCKED

    
    # Assert configuration change is rejected server-side while locked
    is_rejected = vault_lock_state.reject_configuration_change(exp)
    assert is_rejected is True


def test_hardware_status_reports_a_recent_m5stick_heartbeat():
    vault_lock_state.register_hardware_heartbeat()

    assert vault_lock_state.is_hardware_connected() is True
    assert vault_lock_state.hardware_status_payload() == {
        "connected": True,
        "timeout_sec": 5,
    }
