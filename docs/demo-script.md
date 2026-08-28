# PROVENANT — Hackathon Pitch & Demo Script (12-Phase WOW Demo)

## Presentation Objective
Demonstrate to judges that PROVENANT is an **Autonomous Stock Market Agent** capable of evaluating its own decision validity, autonomously correcting position errors, and safely self-optimizing via a hardware-locked research sleeve.

---

## 12-Phase Presentation Script

### Phase 1: Market Observation & Dashboard Setup
- **Presenter Narrative:** *"Welcome to PROVENANT. Here we observe AAPL stock ($227.40, +1.18%) in a synthetic paper-trading environment."*
- **UI State:** Dashboard displays live market ticks, $20,000 paper capital allocation, and clean initial slate.

### Phase 2: Opportunity & Decision Creation
- **Presenter Narrative:** *"Positive earnings news, RSI momentum, and orderbook imbalance align. Provenant creates a BUY decision in AAPL with an initial Decision Validity Score of 0.91."*
- **UI State:** Inner Loop displays `BUY AAPL` decision card, 20% capital allocation, and $V(t) = 0.91$ green gauge.

### Phase 3: Contradictory Evidence Ingestion
- **Presenter Narrative:** *"Now, a contradictory headline is breaking: Apple earnings guidance revised downward."*
- **UI State:** News evidence badge changes to `CONTRADICTED`.

### Phase 4: Validity Collapse & Autonomous Reversal (The FIRST WOW Moment)
- **Presenter Narrative:** *"Watch the Decision Validity Engine. Because the supporting news evidence was contradicted, validity collapses from 0.91 down to 0.34, breaching our 0.60 adaptive threshold. Without human intervention, Provenant automatically dispatches a REVERSE position order to SELL AAPL!"*
- **UI State:** Validity Hero banner flashes `⚠ VALIDITY BREACHED`, score collapses to 0.34, execution panel fills `REVERSE AAPL` fill.

### Phase 5: Failure Analysis & Pattern Detection
- **Presenter Narrative:** *"Provenant records a FailureEvent. Over time, when 3 similar failures occur during high volatility, our pattern detector fires a ResearchTrigger."*
- **UI State:** Outer Loop Stage 1 activates `RECURRING FAILURE DETECTED (3 Failures)`.

### Phase 6: Bounded Hypothesis Generation
- **Presenter Narrative:** *"Provenant formulates a bounded research hypothesis: test a 5-minute confirmation delay (`confirmation_delay_sec = 300`) to avoid high-volatility news churn."*
- **UI State:** Stage 2 displays hypothesis card.

### Phase 7: Hardware Vault Commitment (The SECOND WOW Moment)
- **Presenter Narrative:** *"To prevent parameter tampering, the experiment is committed to the Vault via SHA-256 hash and locked for 60 seconds."*
- **UI State:** Stage 3 Vault card locks (`SHA-256: 254ea81b...`). Physical M5StickC Plus2 ESP32 screen mirrors lock state.

### Phase 8: Out-of-Sample Backtest & Validation
- **Presenter Narrative:** *"Once locked, Provenant executes a fast walk-forward backtest on historical stock data."*
- **UI State:** Stage 4 displays $OOS\ Sharpe = 1.42$, $p = 0.018$, $Decay = 11.2\%$.

### Phase 9: Promotion Gate Evaluation
- **Presenter Narrative:** *"All three statistical promotion gates pass: p < 0.05 PASS, OOS Sharpe > 0.8 PASS, Decay < 15% PASS."*
- **UI State:** Stage 5 flashes `🟢 STRATEGY PROMOTED (news_momentum_v2)`.

### Phase 10: Closed-Loop Strategy Pool Update
- **Presenter Narrative:** *"The promoted strategy enters the active Strategy Pool, which is read-only by Track A."*
- **UI State:** Strategy Pool table updates with `news_momentum_v2`.

### Phase 11: Future Decision Consumption
- **Presenter Narrative:** *"Track A's Opportunity Generator reads the updated Strategy Pool and applies the 5-minute confirmation delay to future trade setups."*
- **UI State:** Activity Feed logs strategy pool update.

### Phase 12: Summary & Wrap-Up
- **Presenter Narrative:** *"Provenant has observed, adapted, reversed a failing trade, learned from repeated failures, locked parameters in hardware, validated out-of-sample, and promoted an improved strategy to live trading."*
