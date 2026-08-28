"""Backend-authoritative in-memory state for Vault commit--reveal experiments."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from math import ceil, isclose
from threading import RLock
from typing import Callable

from .commit import Commitment, ResultVerificationError, recompute_metrics, result_hash


class VaultState(StrEnum):
    COMMITTING = "committing"
    LOCKED = "locked"
    REVEALING = "revealing"
    VERIFIED = "verified"


class VaultError(Exception):
    """Base exception for Vault lifecycle failures."""


class ExperimentNotFoundError(VaultError):
    """Raised when an operation refers to an unknown experiment."""


class ConfigurationLockedError(VaultError):
    """Raised when a caller tries to alter an experiment during its lock window."""


class RevealNotReadyError(VaultError):
    """Raised when a result is revealed before the server-side lock expires."""


@dataclass(slots=True)
class VaultExperiment:
    """A committed experiment and its current commit--reveal lifecycle data."""

    experiment_id: str
    commitment: Commitment
    state: VaultState = VaultState.COMMITTING
    oos_sharpe: float | None = None
    p_value: float | None = None
    result_hash: str | None = None


class VaultLockStore:
    """Keep experiment locks in memory; no hardware connection is required."""

    def __init__(self, *, clock: Callable[[], datetime] | None = None) -> None:
        self._clock = clock or (lambda: datetime.now(timezone.utc))
        self._experiments: dict[str, VaultExperiment] = {}
        self._lock = RLock()

    def create(self, experiment_id: str, commitment: Commitment) -> VaultExperiment:
        """Store a new commitment in the initial committing state."""

        with self._lock:
            if experiment_id in self._experiments:
                raise ValueError(f"experiment already exists: {experiment_id}")
            experiment = VaultExperiment(experiment_id=experiment_id, commitment=commitment)
            self._experiments[experiment_id] = experiment
            return experiment

    def get(self, experiment_id: str) -> VaultExperiment:
        """Return the experiment after advancing time-derived lifecycle transitions."""

        with self._lock:
            try:
                experiment = self._experiments[experiment_id]
            except KeyError as error:
                raise ExperimentNotFoundError(experiment_id) from error
            self._advance(experiment)
            return experiment

    def reject_configuration_change(self, experiment_id: str) -> None:
        """Reject a change while locked, independently of any connected device."""

        experiment = self.get(experiment_id)
        if experiment.state in (VaultState.COMMITTING, VaultState.LOCKED):
            raise ConfigurationLockedError(
                f"experiment {experiment_id} is locked until "
                f"{experiment.commitment.unlock_at.isoformat()}"
            )

    def reveal(
        self, experiment_id: str, *, oos_sharpe: float, p_value: float
    ) -> VaultExperiment:
        """Record a result only after the backend-authoritative lock has expired."""

        with self._lock:
            experiment = self.get(experiment_id)
            if experiment.state in (VaultState.COMMITTING, VaultState.LOCKED):
                raise RevealNotReadyError("the Vault lock has not expired")
            if experiment.state is VaultState.VERIFIED:
                return experiment

            metrics = recompute_metrics(experiment.commitment)
            if not (
                isclose(oos_sharpe, metrics.oos_sharpe, rel_tol=1e-9, abs_tol=1e-9)
                and isclose(p_value, metrics.p_value, rel_tol=1e-9, abs_tol=1e-9)
            ):
                raise ResultVerificationError(
                    "claimed metrics do not match the backend-recomputed result"
                )
            experiment.state = VaultState.REVEALING
            result = {"oos_sharpe": metrics.oos_sharpe, "p_value": metrics.p_value}
            experiment.oos_sharpe = metrics.oos_sharpe
            experiment.p_value = metrics.p_value
            experiment.result_hash = result_hash(experiment.commitment.commit_hash, result)
            experiment.state = VaultState.VERIFIED
            return experiment

    def seconds_remaining(self, experiment: VaultExperiment) -> int:
        """Return a non-negative countdown for a device or frontend renderer."""

        self._advance(experiment)
        if experiment.state not in (VaultState.COMMITTING, VaultState.LOCKED):
            return 0
        return max(0, ceil((experiment.commitment.unlock_at - self._now()).total_seconds()))

    def now(self) -> datetime:
        """Expose the store clock so commitments and lifecycle transitions agree."""

        return self._now()

    def _advance(self, experiment: VaultExperiment) -> None:
        if experiment.state is VaultState.COMMITTING:
            experiment.state = VaultState.LOCKED
        if (
            experiment.state is VaultState.LOCKED
            and self._now() >= experiment.commitment.unlock_at
        ):
            experiment.state = VaultState.REVEALING

    def _now(self) -> datetime:
        now = self._clock()
        if now.tzinfo is None:
            raise ValueError("clock must return a timezone-aware datetime")
        return now
