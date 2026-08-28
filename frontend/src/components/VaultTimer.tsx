import { type ReactNode, useEffect, useState } from "react";

type VaultState = "committing" | "locked" | "revealing" | "verified";

interface VaultStatePayload {
  state: VaultState;
  seconds_remaining: number;
  commit_hash_short: string;
  oos_sharpe: number | null;
  p_value: number | null;
}

interface VaultTimerProps {
  /** The backend experiment identifier to mirror. */
  experimentId: string;
  /** Empty means use the current origin, e.g. `/vault/state/{experimentId}`. */
  apiBaseUrl?: string;
  /** Match the M5StickC Plus2's 1--2 second poll cadence. */
  pollIntervalMs?: number;
}

const DEFAULT_POLL_INTERVAL_MS = 1_500;

function isVaultPayload(value: unknown): value is VaultStatePayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    ["committing", "locked", "revealing", "verified"].includes(
      String(payload.state),
    ) &&
    typeof payload.seconds_remaining === "number" &&
    typeof payload.commit_hash_short === "string" &&
    (typeof payload.oos_sharpe === "number" || payload.oos_sharpe === null) &&
    (typeof payload.p_value === "number" || payload.p_value === null)
  );
}

function formatCountdown(seconds: number): string {
  // The value comes directly from the backend. This formats it but never ticks
  // it down locally, so the UI cannot claim that a server-side lock expired.
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function formatMetric(value: number | null, digits: number): string {
  return value === null ? "--" : value.toFixed(digits);
}

function formatExperimentLabel(experimentId: string): string {
  return experimentId.startsWith("exp-")
    ? `EXP #${experimentId.slice(4)}`
    : `EXP ${experimentId}`;
}

/**
 * Dashboard fallback for the physical Vault. It is intentionally a dumb
 * renderer: the backend decides all Vault lifecycle transitions and the timer
 * only mirrors the most recent successful polling response.
 */
export function VaultTimer({
  experimentId,
  apiBaseUrl = "",
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
}: VaultTimerProps) {
  const [payload, setPayload] = useState<VaultStatePayload | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(true);

  useEffect(() => {
    let disposed = false;
    let inFlight = false;
    let controller: AbortController | undefined;
    const baseUrl = apiBaseUrl.replace(/\/$/, "");
    const stateUrl = `${baseUrl}/vault/state/${encodeURIComponent(experimentId)}`;

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      controller = new AbortController();

      try {
        const response = await fetch(stateUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`Vault state request failed: ${response.status}`);

        const candidate: unknown = await response.json();
        if (!isVaultPayload(candidate)) throw new Error("Vault state response is invalid");

        if (!disposed) {
          setPayload(candidate);
          setIsReconnecting(false);
        }
      } catch (error) {
        if (!disposed && !(error instanceof DOMException && error.name === "AbortError")) {
          // Do not preserve a stale LOCK or VERIFIED display after a failed poll.
          setPayload(null);
          setIsReconnecting(true);
        }
      } finally {
        inFlight = false;
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), pollIntervalMs);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, [apiBaseUrl, experimentId, pollIntervalMs]);

  if (isReconnecting || payload === null) {
    return <VaultFrame color="#f59e0b" title="RECONNECTING">
      <p>WiFi/poll unavailable</p>
      <p>Retrying backend...</p>
    </VaultFrame>;
  }

  switch (payload.state) {
    case "committing":
      return <VaultFrame color="#eab308" title="NEW EXPERIMENT">
        <p>{formatExperimentLabel(experimentId)}</p>
        <p>COMMITTING...</p>
      </VaultFrame>;
    case "locked":
      return <VaultFrame color="#ef4444" title="EXPERIMENT LOCKED">
        <strong style={{ fontSize: "2.4rem" }}>{formatCountdown(payload.seconds_remaining)}</strong>
        <p>DO NOT MODIFY</p>
        <small>Hypothesis ✓ Params ✓ Dataset ✓</small>
        <small>HASH {payload.commit_hash_short}</small>
      </VaultFrame>;
    case "revealing":
      return <VaultFrame color="#22c55e" title="LOCK EXPIRED">
        <p>REVEALING...</p>
        <p>OOS Sharpe: {formatMetric(payload.oos_sharpe, 2)}</p>
        <p>p-value: {formatMetric(payload.p_value, 3)}</p>
      </VaultFrame>;
    case "verified":
      return <VaultFrame color="#22c55e" title="VERIFIED">
        <p>COMMIT ✓ &nbsp; RESULT ✓</p>
        <p>VERIFIED</p>
        <p>OOS Sharpe: {formatMetric(payload.oos_sharpe, 2)}</p>
        <p>p-value: {formatMetric(payload.p_value, 3)}</p>
      </VaultFrame>;
  }
}

function VaultFrame({
  color,
  title,
  children,
}: {
  color: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-live="polite"
      aria-label="Vault status"
      style={{
        background: "#09090b",
        border: `2px solid ${color}`,
        borderRadius: "0.75rem",
        color,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        minWidth: "16rem",
        padding: "1rem",
        textAlign: "center",
      }}
    >
      <h3 style={{ color, margin: "0 0 0.75rem" }}>{title}</h3>
      <div style={{ display: "grid", gap: "0.4rem" }}>{children}</div>
    </section>
  );
}
