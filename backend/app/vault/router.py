"""FastAPI routes for the backend-authoritative Vault commit--reveal contract."""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from .commit import ResultVerificationError, create_commitment
from .lock_state import (
    ExperimentNotFoundError,
    RevealNotReadyError,
    VaultExperiment,
    VaultLockStore,
)


class CommitRequest(BaseModel):
    """The complete, immutable experiment inputs committed before testing."""

    experiment_id: str | None = None
    hypothesis: object
    params: dict[str, object]
    dataset_window: object


class CommitResponse(BaseModel):
    """The identifier and immutable commitment data returned after committing."""

    experiment_id: str
    commit_hash: str
    locked_at: datetime
    unlock_at: datetime


class RevealRequest(BaseModel):
    """The post-lock validation metrics that are bound to a stored commitment."""

    oos_sharpe: float
    p_value: float


class VaultStateResponse(BaseModel):
    """The exact polling payload rendered by the device and dashboard."""

    state: str
    seconds_remaining: int = Field(ge=0)
    commit_hash_short: str
    oos_sharpe: float | None
    p_value: float | None


router = APIRouter(prefix="/vault", tags=["vault"])
vault_store = VaultLockStore()


@router.post("/commit", response_model=CommitResponse, status_code=status.HTTP_201_CREATED)
def commit_experiment(request: CommitRequest) -> CommitResponse:
    """Commit an experiment and begin its 60-second server-side lock."""

    experiment_id = request.experiment_id or str(uuid4())
    commitment = create_commitment(
        request.hypothesis, request.params, request.dataset_window, now=vault_store.now()
    )
    try:
        vault_store.create(experiment_id, commitment)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    return CommitResponse(
        experiment_id=experiment_id,
        commit_hash=commitment.commit_hash,
        locked_at=commitment.locked_at,
        unlock_at=commitment.unlock_at,
    )


@router.get("/state/{experiment_id}", response_model=VaultStateResponse)
def get_vault_state(experiment_id: str) -> VaultStateResponse:
    """Return the backend-authoritative state that hardware polls every 1--2 seconds."""

    try:
        experiment = vault_store.get(experiment_id)
    except ExperimentNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="experiment not found") from error
    return _state_response(experiment)


@router.post("/reveal/{experiment_id}", response_model=VaultStateResponse)
def reveal_experiment(experiment_id: str, request: RevealRequest) -> VaultStateResponse:
    """Reveal and verify validation metrics after the lock window expires."""

    try:
        experiment = vault_store.reveal(
            experiment_id, oos_sharpe=request.oos_sharpe, p_value=request.p_value
        )
    except ExperimentNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="experiment not found") from error
    except RevealNotReadyError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except ResultVerificationError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(error)) from error
    return _state_response(experiment)


def _state_response(experiment: VaultExperiment) -> VaultStateResponse:
    return VaultStateResponse(
        state=experiment.state.value,
        seconds_remaining=vault_store.seconds_remaining(experiment),
        commit_hash_short=_short_hash(experiment.commitment.commit_hash),
        oos_sharpe=experiment.oos_sharpe,
        p_value=experiment.p_value,
    )


def _short_hash(commit_hash: str) -> str:
    """Fit a meaningful verifier on the M5StickC Plus2 lock screen."""

    return f"{commit_hash[:6]}…{commit_hash[-4:]}"
