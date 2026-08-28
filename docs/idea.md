# PROVENANT — Core Concept & Architectural Vision

## Problem Statement
Autonomous AI financial systems often fail because they lack self-assessment of their own trading decisions. Once an AI position is taken, traditional systems hold or exit based on fixed stop-loss triggers without re-evaluating whether the **underlying evidence** that justified the trade in the first place still holds true. Furthermore, when strategy failures occur repeatedly in specific market regimes, traditional systems cannot safely self-optimize without risking over-fitting on live trading capital.

## The PROVENANT Solution: Dual-Loop Autonomous Learning

PROVENANT solves this via two firewalled feedback loops:

### 1. Inner Loop: Decision Validity Engine (DVE)
- **Question Asked:** *"Does this decision still deserve to exist right now?"*
- **Mechanism:** Market events produce weighted `EvidenceNode` instances (News, Momentum, Orderbook, Volatility). Evidence weights exponentially decay over time or drop precipitously when contradicted.
- **Validity Score \(V(t)\):** Computed continuously as \(V(t) = \frac{\sum W_{\text{effective}}}{\sum W_{\text{base}}}\).
- **Autonomous Action:** If \(V(t) < \tau(t)\) (adaptive threshold \(\tau = 0.60\)), the DVE automatically dispatches position management actions (`HOLD`, `REDUCE`, `PAUSE`, `CANCEL`, or `REVERSE`).

### 2. Outer Loop: Research Sleeve & Capital Firewall
- **Question Asked:** *"Does this strategy template still deserve to exist in this market regime?"*
- **Mechanism:** Monitors recurring invalidation patterns. When 3+ failures occur for a strategy in a given regime (e.g. `HIGH_VOLATILITY`), it fires a `ResearchTrigger`.
- **Bounded Hypothesis:** Formulates a parameter variation (e.g., adding a 5-minute confirmation delay `confirmation_delay_sec = 300`).
- **Hardware Vault Lock:** Hashes hypothesis & parameters using SHA-256 and locks the experiment for 60 seconds (mirroring lock state to M5StickC Plus2 ESP32 screen).
- **Validation & Promotion:** Backtests deterministically on historical stock data, performs walk-forward Out-of-Sample (OOS) validation, and evaluates statistical promotion gates (\(p < 0.05\), \(OOS\ Sharpe > 0.8\), \(Decay < 15\%\)).
- **Closed Loop:** Promoted strategies enter the `StrategyPool`, where Track A's `OpportunityGenerator` immediately consumes them for future trade setups.

### Capital Firewall Rule
The Research Sleeve has **ZERO** write permissions to live capital allocation or trade execution. The only path for an experiment to reach live capital is:
`Research Sleeve` \(\rightarrow\) `OOS Validation` \(\rightarrow\) `Promotion Gate` \(\rightarrow\) `StrategyPool` \(\rightarrow\) `Track A`.
