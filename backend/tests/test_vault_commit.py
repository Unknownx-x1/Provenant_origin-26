"""Vault commit--reveal lifecycle tests."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from backend.app.vault.lock_state import ConfigurationLockedError, VaultLockStore
from backend.app.vault import router as vault_router
from backend.app.vault.commit import recompute_metrics


class MutableClock:
    def __init__(self, now: datetime) -> None:
        self.now = now

    def __call__(self) -> datetime:
        return self.now


def test_commit_lock_reject_and_reveal_after_unlock() -> None:
    clock = MutableClock(datetime(2026, 8, 28, tzinfo=timezone.utc))
    previous_store = vault_router.vault_store
    vault_router.vault_store = VaultLockStore(clock=clock)
    try:
        commit = vault_router.commit_experiment(
            vault_router.CommitRequest(**{
                "experiment_id": "exp-0187",
                "hypothesis": {"template": "delayed_entry"},
                "params": {"confirmation_delay_sec": 300},
                "dataset_window": {
                    "start": "2026-05-01",
                    "end": "2026-07-31",
                    "oos_returns": [0.011, -0.004, 0.008, 0.006, -0.002, 0.009],
                },
            })
        )
        committed = commit.model_dump(mode="json")
        assert committed["experiment_id"] == "exp-0187"
        assert len(committed["commit_hash"]) == 64

        locked = vault_router.get_vault_state("exp-0187").model_dump()
        assert locked["state"] == "locked"
        assert locked["seconds_remaining"] == 60
        assert set(locked) == {
            "state",
            "seconds_remaining",
            "commit_hash_short",
            "oos_sharpe",
            "p_value",
        }

        with pytest.raises(ConfigurationLockedError):
            vault_router.vault_store.reject_configuration_change("exp-0187")
        metrics = recompute_metrics(vault_router.vault_store.get("exp-0187").commitment)
        with pytest.raises(HTTPException) as error:
            vault_router.reveal_experiment(
                "exp-0187", vault_router.RevealRequest(
                    oos_sharpe=metrics.oos_sharpe, p_value=metrics.p_value
                )
            )
        assert error.value.status_code == 409

        clock.now += timedelta(seconds=60)
        assert vault_router.get_vault_state("exp-0187").state == "revealing"
        with pytest.raises(HTTPException) as mismatch:
            vault_router.reveal_experiment(
                "exp-0187", vault_router.RevealRequest(oos_sharpe=1.42, p_value=0.018)
            )
        assert mismatch.value.status_code == 422
        revealed = vault_router.reveal_experiment(
            "exp-0187", vault_router.RevealRequest(
                oos_sharpe=metrics.oos_sharpe, p_value=metrics.p_value
            )
        )
        assert revealed.model_dump() == {
            "state": "verified",
            "seconds_remaining": 0,
            "commit_hash_short": revealed.commit_hash_short,
            "oos_sharpe": metrics.oos_sharpe,
            "p_value": metrics.p_value,
        }
    finally:
        vault_router.vault_store = previous_store
