# PROVENANT — Autonomous Financial Agent
> **CSI ORIGIN 2026 — Problem Statement 3**  
> *Synthetic Stock Market — Autonomous Learning & Decision Validity Engine*

---

## 📌 Executive Summary

**PROVENANT** is an autonomous financial agent engineered for continuous stock market observation, dynamic decision validity monitoring, and automated self-healing strategy optimization. 

Unlike traditional algorithmic trading systems that rely on static rules or black-box models, PROVENANT splits its architecture into two distinct, firewalled operating loops:
1. **The Inner Loop (Decision Validity Engine — DVE):** Continuously evaluates whether an active trade decision remains justified as market evidence decays or is contradicted. If validity falls below an adaptive threshold, the system autonomously reverses the position.
2. **The Outer Loop (Research Sleeve):** Analyzes recurring failure patterns, formulates bounded hypotheses, locks experiment parameters in a hardware vault, validates strategies using out-of-sample statistical tests, and promotes improved strategies back to the live strategy pool.

---

## 🏗️ System Architecture & Dual-Loop Mechanics

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   INNER LOOP (Track A)                                 │
 │  [ Market Data ] ──► [ Evidence Nodes ] ──► [ Opportunity ] ──► [ Risk & Capital ]     │
 │                                                                      │                 │
 │  [ Action Reversal ] ◄── [ Validity Breach V(t)<τ ] ◄── [ Decision Validity Engine ]    │
 └───────────────────────────────────────────────────┬────────────────────────────────────┘
                                                     │ Failure Event Stream
                                                     ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   OUTER LOOP (Track B)                                 │
 │  [ Recurring Failure ] ──► [ Hypothesis ] ──► [ Hardware Vault Lock ] ──► [ OOS Check ] │
 │                                                                      │                 │
 │  [ Track A Strategy Pool ] ◄─────── [ Promoted Strategy ] ◄────── [ Statistical Gate ] │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Environment & Paper Trading Specification

* **Environment Name:** `SYNTHETIC STOCK MARKET — PAPER TRADING`
* **Primary Stock Ticker:** `AAPL` (Apple Inc., `$227.40`, `+1.18%`)
* **Watchlist Stocks:** `NVDA`, `TSLA`, `MSFT`, `AMZN`, `GOOGL`
* **Capital Boundary:** `$100,000` Paper Capital limit, max `$25,000` (25%) single-asset exposure cap, 5% max downside limit.
* **Deterministic Design:** Designed for hackathons and live pitch demonstrations with 100% reproducible scenario execution.

---

## 🔄 The 16-Phase Autonomous Scenario Workflow

When the system boots or when **`▶ START AUTONOMOUS DEMO`** is activated, PROVENANT runs through a complete 16-phase autonomous demonstration cycle without requiring any manual clicking:

| Phase # | Phase Name | System Action & Description |
|:---:|:---|:---|
| **Phase 1** | **Market Observation** | Observes real-time synthetic market ticks for **AAPL** ($227.40, +1.18%, 7.45M volume). |
| **Phase 2** | **Opportunity Detection** | Aligns News, Momentum, and Orderbook signals for strategy `news_momentum_v1`. |
| **Phase 3** | **Autonomous Decision** | Instantiates `BUY AAPL` decision ($V(t) = 0.91$, Risk Score = $0.33$, Capital Allocation = $20\%$). |
| **Phase 4** | **Continuous Monitoring** | Monitors live Decision Validity Score $V(t)$ against adaptive threshold $\tau = 0.60$. |
| **Phase 5** | **Contradictory Evidence** | Simulates negative event (*"Apple earnings guidance revised downward"*), causing News evidence to decay/contradict ($V(t): 0.91 \rightarrow 0.34$). |
| **Phase 6** | **AUTONOMOUS ACTION** | **Validity Breach Triggered** ($0.34 < 0.60$). Automatically dispatches `REVERSE AAPL` position (`SELL AAPL`). |
| **Phase 7** | **Failure Recording** | Emits a structured `FailureEvent` categorizing invalidation cause (`EVIDENCE_CONTRADICTED`) and regime (`HIGH_VOLATILITY`). |
| **Phase 8** | **Repeat Failures** | Automatically processes 3 similar failure events to hit pattern threshold (`RECURRING FAILURE DETECTED`). |
| **Phase 9** | **Research Trigger** | Fires `ResearchTrigger` requesting a confirmation-delay research experiment. |
| **Phase 10** | **Hypothesis Creation** | Generates bounded hypothesis: *"Test 5-minute confirmation delay (`confirmation_delay_sec = 300`) to reduce high-volatility news churn."* |
| **Phase 11** | **Vault Commit & Lock** | Hashes hypothesis and parameters using SHA-256 (`SHA-256: 254ea81b...`) and locks experiment in the hardware Vault for 60 seconds. |
| **Phase 12** | **Historical Backtest** | Runs walk-forward backtest on historical stock dataset (Win Rate: 68%, 142 trades). |
| **Phase 13** | **Out-of-Sample Validation** | Computes OOS metrics: $OOS\ Sharpe = 1.42$, $p\text{-value} = 0.018$, Performance Decay = $11.2\%$. |
| **Phase 14** | **Promotion Gate** | Evaluates 3 statistical gates: $p < 0.05$ **PASS**, $OOS\ Sharpe > 0.8$ **PASS**, $Decay < 15\%$ **PASS**. |
| **Phase 15** | **Strategy Promotion** | Promotes new strategy variant `news_momentum_v2` (*"5-Minute Confirmation Delay"*). |
| **Phase 16** | **Loop Back to Strategy Pool** | Returns `news_momentum_v2` to active Strategy Pool where Track A decision engine immediately consumes it for future trade setups. |

---

## 🔒 Capital Firewall Security Specification

PROVENANT enforces a strict capital firewall rule at the code level:

> **Firewall Rule:** The Research Sleeve (Outer Loop) possesses **ZERO** write permissions to live trade execution engines or capital allocation routers.

```text
       ┌─────────────────────────────────────────────────┐
       │                 RESEARCH SLEEVE                 │
       │  ├── READ Market Data                           │
       │  ├── READ FailureEvents                         │
       │  ├── WRITE Experiments                          │
       │  └── ❌ CANNOT WRITE Live Allocation / Orders   │
       └────────────────────────┬────────────────────────┘
                                │
                                ▼
                       [ PROMOTION GATE ]
                                │ (Only statistical pass)
                                ▼
                      [ ACTIVE STRATEGY POOL ]
                                │ (Read-only by Track A)
                                ▼
                   [ TRACK A DECISION ENGINE ]
                                │
                                ▼
                      [ CAPITAL ALLOCATION ]
```

---

## 🔐 Hardware Vault Integration (M5StickC Plus2)

The experiment lifecycle is physically locked using an **M5StickC Plus2** ESP32 hardware device:
* **Commit Protocol:** When an experiment is proposed, its parameters and hypothesis are hashed via **SHA-256**.
* **Lock State Machine:** The server enters a immutable lock state for 60 seconds (`state="locked"`).
* **Hardware Screen Mirror:** The M5StickC Plus2 screen displays real-time countdown, hash snippet, and lock status via HTTP polling (`GET /vault/state/{experiment_id}`).
* **Tamper Protection:** Any attempt to alter parameters during the lock window calls `reject_configuration_change()` and fails instantly.

---

## 🎙️ AI Explanation & ElevenLabs Voice Layer

* **Groq / Claude LLM Integration ([backend/app/ai/](file:///c:/Users/SHIVANSH/Provenant_origins/backend/app/ai/)):** Synthesizes concise, auditable, event-driven explanations for position reversals and research triggers.
* **ElevenLabs Text-to-Speech ([backend/app/ai/voice.py](file:///c:/Users/SHIVANSH/Provenant_origins/backend/app/ai/voice.py)):** Announces major autonomous events (Decision Creation, Validity Collapse, Research Trigger, Vault Lock, Strategy Promotion).
* **Web Speech API Fallback:** If `ELEVENLABS_API_KEY` is not present, the system automatically uses browser-native Web Speech API or silent narration without breaking execution.
* **`🔊 LISTEN` Audio Buttons:** Available directly on explanation cards in the frontend dashboard.

---

## 🗂️ Project Directory Structure

```text
Provenant_origins/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── client.py                 # Groq LLM Client setup
│   │   │   ├── decision_explainer.py     # Decision reversal explanations
│   │   │   ├── hypothesis_explainer.py   # Research trigger explanations
│   │   │   └── voice.py                  # ElevenLabs TTS Client & fallback
│   │   ├── audit/
│   │   │   └── ledger.py                 # Persistent in-memory decision ledger
│   │   ├── decisions/
│   │   │   ├── actions.py                # Action dispatch (HOLD/REDUCE/REVERSE)
│   │   │   ├── models.py                 # DecisionInternal schemas
│   │   │   └── validity_engine.py        # Live V(t) score calculation engine
│   │   ├── demo/
│   │   │   └── engine.py                 # 16-Phase Autonomous Scenario Machine
│   │   ├── evidence/
│   │   │   ├── decay.py                  # Per-evidence exponential decay curves
│   │   │   ├── models.py                 # EvidenceNodeInternal schemas
│   │   │   └── processor.py              # Market event to evidence node converter
│   │   ├── execution/
│   │   │   └── executor.py               # Trade order fill & slippage simulator
│   │   ├── ingestion/
│   │   │   ├── event_bus.py              # In-process asyncio event queues
│   │   │   ├── news_injector.py          # Scriptable news headline injector
│   │   │   └── simulator.py              # Market price tick generator
│   │   ├── opportunities/
│   │   │   └── generator.py              # Strategy opportunity detector
│   │   ├── outcomes/
│   │   │   ├── failure_analysis.py       # Failure categorization & logging
│   │   │   └── monitor.py                # Decision outcome tracker
│   │   ├── research_sleeve/
│   │   │   ├── backtest.py               # Deterministic historical backtester
│   │   │   ├── experiment.py             # Canonical experiment state machine
│   │   │   ├── hypothesis.py             # Bounded hypothesis creation engine
│   │   │   ├── pattern_detector.py       # Recurring failure pattern detector
│   │   │   ├── promotion_gate.py         # Statistical promotion gate (p < 0.05)
│   │   │   ├── strategy_pool.py          # Active strategy pool manager
│   │   │   └── validation.py             # Walk-forward OOS validation engine
│   │   ├── risk/
│   │   │   ├── allocator.py              # Capital exposure allocator
│   │   │   └── evaluator.py              # Downside risk evaluator
│   │   ├── schemas/
│   │   │   └── contracts.py              # Canonical Pydantic schemas (Decision, Experiment, etc.)
│   │   ├── vault/
│   │   │   ├── commit.py                 # SHA-256 hashing engine
│   │   │   ├── lock_state.py             # Hardware server lock manager
│   │   │   └── router.py                 # REST endpoints for M5StickC Plus2 ESP32
│   │   ├── ws/
│   │   │   └── broadcaster.py            # Asyncio WebSocket broadcaster
│   │   ├── config.py                     # Stock market AAPL boundary parameters
│   │   └── main.py                       # FastAPI application & WebSocket server
│   ├── tests/
│   │   ├── test_autonomous_demo.py       # 16-Phase scenario & stock market tests
│   │   ├── test_experiment_lifecycle.py  # End-to-end experiment lifecycle tests
│   │   ├── test_firewall.py              # Capital firewall security tests
│   │   └── test_vault_commit.py          # SHA-256 and Vault lock rejection tests
│   └── requirements.txt                  # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EvidenceNodeCard.tsx      # Evidence node badge card
│   │   │   ├── ValidityGauge.tsx         # Live V(t) validity progress bar
│   │   │   └── VaultTimer.tsx            # M5StickC screen mirror & timer
│   │   ├── views/
│   │   │   ├── DashboardShell.tsx        # Top status bar, Demo controls & Activity feed
│   │   │   ├── InnerLoopView.tsx         # 7-Stage pipeline & Hero Validity Collapse UI
│   │   │   └── OuterLoopView.tsx         # 5-Stage research flow & Strategy Pool UI
│   │   ├── ws/
│   │   │   └── useLiveFeed.ts            # Auto-reconnecting WebSocket hook
│   │   ├── App.tsx                       # Main React App entry
│   │   └── main.tsx                      # Vite React mounting
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts                    # Vite dev server & proxy settings
├── hardware/
│   ├── firmware/
│   │   └── vault_device/
│   │       ├── vault_device.ino          # M5StickC Plus2 ESP32 Arduino sketch
│   │       └── vault_config.h            # Wi-Fi & server endpoint header configuration
│   ├── docs/
│   │   └── display_states.md             # Hardware display screen layout docs
│   └── README.md                         # Hardware setup guide
├── docs/
│   └── api-contract.md                   # Canonical REST & WebSocket API specification
├── .env                                  # Environment keys (GROQ_API_KEY, ELEVENLABS_API_KEY)
├── .gitignore
└── README.md
```

---

## ⚡ Quickstart Guide

### 1. Prerequisites
* **Python:** 3.10+
* **Node.js:** v18+ & `npm`

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 3. Backend Launch
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Start FastAPI Server (Port 8000)
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### 4. Frontend Launch
```bash
# Navigate to frontend
cd frontend

# Install packages
npm install

# Start Vite Dev Server (Port 3000)
npm run dev
```

Open **[http://localhost:3000/](http://localhost:3000/)** in your browser to view the interactive dashboard.

---

## 🧪 Running Unit Tests

To run the complete automated test suite (covering 16-phase scenario transitions, capital firewall enforcement, SHA-256 Vault hashing, and voice fallbacks):

```bash
python -m pytest backend/tests
```

**Expected Output:**
```text
======================= 7 passed in 11.03s =======================
backend/tests/test_autonomous_demo.py ....                               [ 57%]
backend/tests/test_experiment_lifecycle.py .                             [ 71%]
backend/tests/test_firewall.py .                                         [ 85%]
backend/tests/test_vault_commit.py .                                     [100%]
```

---

## 📜 License & Hackathon Context

Built for **CSI ORIGIN 2026 — Problem Statement 3 (Autonomous Financial Agent)**.
All financial models, market ticks, and order executions operate in a **deterministic paper trading environment**.
