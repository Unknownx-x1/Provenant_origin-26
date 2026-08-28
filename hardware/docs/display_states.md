# Vault display states and integration checklist

The physical M5StickC Plus2 and dashboard fallback mirror the same
backend-authoritative payload from `GET /vault/state/{experiment_id}`:
`state`, `seconds_remaining`, `commit_hash_short`, `oos_sharpe`, and `p_value`.
Neither renderer owns a timer or decides that a lock may be revealed.

| Backend state | Display text / colour |
|---|---|
| `committing` | Yellow: `NEW EXPERIMENT` / `EXP #0187` / `COMMITTING...` |
| `locked` | Red: `EXPERIMENT LOCKED` / server countdown / `DO NOT MODIFY` / `Hypothesis ✓ Params ✓ Dataset ✓` / short hash |
| `revealing` | Green: `LOCK EXPIRED` / `REVEALING...` / metrics when supplied |
| `verified` | Green: `COMMIT ✓` / `RESULT ✓` / `VERIFIED` / OOS Sharpe and p-value |
| poll or WiFi failure | Orange: `RECONNECTING` rather than a stale state |

## Integration checklist

- [x] The backend Vault router is available before hardware integration and
  serves `POST /vault/commit`, `GET /vault/state/{experiment_id}`, and
  `POST /vault/reveal/{experiment_id}`; its commit--lock--reveal lifecycle is
  covered by the backend test.
- [ ] Before wiring the device, point the dashboard `VaultTimer` at the backend
  and confirm it renders each server state and switches to `RECONNECTING` when
  the backend is stopped.
- [ ] Flash/restart the M5StickC Plus2 during an active lock, then confirm it
  repolls the backend and resumes the current display without corrupting Vault
  state. The device holds no lock state locally.
- [ ] At the Hour-5 handoff, create a real commit, leave the device untouched
  beside the laptop, observe the 60-second server countdown, then confirm the
  visible `REVEALING` and `VERIFIED` transition with OOS Sharpe and p-value.
- [ ] Repeat the full commit → lock → reveal → verify flow with the dashboard
  fallback visible, then test a WiFi drop to confirm the backend flow continues
  and the device changes to `RECONNECTING`.

## Assumptions and gaps

- No frontend shell, WebSocket hook, test runner, or API proxy exists yet, so
  `VaultTimer` uses the specified HTTP endpoint and accepts `apiBaseUrl` for a
  separately hosted backend.
- The current backend store is in memory. Reflashing or restarting the device
  is safe because it repolls; restarting the backend itself currently clears
  experiments and would require persistence for a production demo reset.
- The physical-device checks remain manual because no M5StickC Plus2 is
  connected to this workspace.
