"""Canonicalize Vault experiments and create their immutable SHA-256 commits."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import json
from math import erfc, isfinite, sqrt
from typing import Any, Mapping


LOCK_DURATION_SECONDS = 60


@dataclass(frozen=True, slots=True)
class Commitment:
    """The canonical experiment payload and its timed Vault commitment."""

    canonical_experiment: str
    commit_hash: str
    locked_at: datetime
    unlock_at: datetime


@dataclass(frozen=True, slots=True)
class RecomputedMetrics:
    """Metrics calculated by the backend from data frozen at commit time."""

    oos_sharpe: float
    p_value: float


class ResultVerificationError(ValueError):
    """Raised when a reveal cannot be reproduced from the committed inputs."""


def canonical_experiment_json(
    hypothesis: Any, params: Mapping[str, Any], dataset_window: Any
) -> str:
    """Return a deterministic JSON representation of the experiment inputs."""

    payload = {
        "dataset_window": dataset_window,
        "hypothesis": hypothesis,
        "params": dict(params),
    }
    return json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )


def create_commitment(
    hypothesis: Any,
    params: Mapping[str, Any],
    dataset_window: Any,
    *,
    now: datetime | None = None,
    lock_duration_seconds: int = LOCK_DURATION_SECONDS,
) -> Commitment:
    """Commit a canonical experiment and set its server-authoritative lock window."""

    if lock_duration_seconds <= 0:
        raise ValueError("lock_duration_seconds must be positive")

    locked_at = now or datetime.now(timezone.utc)
    if locked_at.tzinfo is None:
        raise ValueError("now must be timezone-aware")

    canonical = canonical_experiment_json(hypothesis, params, dataset_window)
    return Commitment(
        canonical_experiment=canonical,
        commit_hash=sha256(canonical.encode("utf-8")).hexdigest(),
        locked_at=locked_at,
        unlock_at=locked_at + timedelta(seconds=lock_duration_seconds),
    )


def result_hash(commit_hash: str, result: Mapping[str, Any]) -> str:
    """Hash a revealed result against its immutable experiment commitment."""

    canonical_result = json.dumps(
        dict(result),
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    )
    return sha256(f"{commit_hash}:{canonical_result}".encode("utf-8")).hexdigest()


def recompute_metrics(commitment: Commitment) -> RecomputedMetrics:
    """Recompute OOS metrics from the return series frozen in the commitment.

    `dataset_window.oos_returns` is a demo-safe stand-in for the server-owned
    OOS dataset. In the full Research Sleeve it is replaced by the committed
    dataset fingerprint plus the server-side backtest runner.
    """

    payload = json.loads(commitment.canonical_experiment)
    dataset_window = payload.get("dataset_window")
    if not isinstance(dataset_window, dict):
        raise ResultVerificationError("dataset_window must be an object")
    values = dataset_window.get("oos_returns")
    if not isinstance(values, list) or len(values) < 2:
        raise ResultVerificationError("committed dataset_window requires 2+ oos_returns")
    try:
        returns = [float(value) for value in values]
        periods_per_year = float(dataset_window.get("periods_per_year", 252))
    except (TypeError, ValueError) as error:
        raise ResultVerificationError("committed returns must be numeric") from error
    if not all(isfinite(value) for value in returns) or not isfinite(periods_per_year):
        raise ResultVerificationError("committed returns and periods_per_year must be finite")
    if periods_per_year <= 0:
        raise ResultVerificationError("periods_per_year must be positive")

    mean = sum(returns) / len(returns)
    variance = sum((value - mean) ** 2 for value in returns) / (len(returns) - 1)
    if variance == 0:
        raise ResultVerificationError("committed returns must have non-zero variance")
    sample_std = sqrt(variance)
    sharpe = mean / sample_std * sqrt(periods_per_year)
    t_statistic = mean / (sample_std / sqrt(len(returns)))
    # Two-sided normal approximation for the OOS mean-return significance.
    p_value = erfc(abs(t_statistic) / sqrt(2))
    return RecomputedMetrics(oos_sharpe=sharpe, p_value=p_value)
