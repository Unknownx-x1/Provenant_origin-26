# PROVENANT
### An Autonomous Financial Agent That Tests Two Questions: "Does this decision still deserve to exist?" and "Does this strategy still deserve to exist?" — Enforced in Software, and Physically Sealed in Hardware.

**CSI ORIGIN 2026 — Problem Statement 3: Autonomous AI Agents for Real-Time Financial Markets**

---

## 1. ONE-PARAGRAPH CONCEPT

Provenant is an autonomous financial agent built around two connected feedback loops instead of one prediction model. The **Inner Loop** (Decision Validity Engine) makes trading decisions from explicit, typed evidence — price, liquidity/order-book, volatility, news — and continuously recomputes a live Validity score as that evidence decays, gets contradicted, or loses source trust; when Validity breaks an adaptive threshold, the agent autonomously holds, reduces, pauses, cancels, or reverses the position and explains exactly which evidence broke. The **Outer Loop** (Research Sleeve) watches for *recurring* invalidation patterns ("news+momentum decisions keep failing during high-volatility earnings windows"), and in response autonomously generates a new hypothesis from a structured, bounded template space, backtests it, walk-forward validates it, paper-trades it, and only promotes it into the live strategy pool if it clears a statistical gate — all inside a capital firewall so an experimental idea can never touch real allocation until proven. The connective tissue between the two loops — and the part a normal AI agent has none of — is physically enforced by an **M5StickC Plus2** acting as a temporal commit–reveal lock: before the Research Sleeve is allowed to see a candidate strategy's backtest result, the exact hypothesis, parameters, and test window must be SHA-256 committed and locked on the device for a fixed window, so the agent cannot see a bad result and quietly retry with tweaked parameters (p-hacking). This makes both the *individual decision* and the *research process that produces new decisions* auditable, adaptive, and honest — not a bigger prediction model, but a different architecture for how belief is formed, revised, and improved.

---

## 2. PRODUCT NAME

**PROVENANT** — provenance (every decision traces to its evidence) + covenant (the hard boundaries humans set and the commitment the agent can't wriggle out of). Sounds like a real fintech infra product, not a generic "AI-something" name. Subsystems keep the brand consistent:

| Component | Name |
|---|---|
| Inner loop (decision-level) | **Decision Validity Engine (DVE)** |
| Outer loop (strategy-level) | **Research Sleeve** |
| Hardware commit–reveal device | **The Vault** (running on M5StickC Plus2) |

---

## 3. THE TWO-LEVEL LEARNING SYSTEM, IN PLAIN TERMS

**Decision-Level Learning (Inner Loop) — "Do I still believe this trade?"**
Every decision is not a verdict, it's a claim backed by evidence, and the claim has an expiry condition. If the evidence that justified a BUY decays, gets contradicted, or its source turns out to be unreliable, the system stops believing the decision *before* a stop-loss would ever trigger — and says exactly why ("40% of this decision depended on liquidity conditions that no longer exist, 35% on news that's now contradicted").

**Strategy-Level Learning (Outer Loop) — "Does my current playbook still work?"**
A single bad trade is not a research signal. But if the *same kind* of decision keeps getting invalidated under the *same* conditions (e.g., news+momentum entries during high-vol earnings windows), that's a pattern worth investigating. The Research Sleeve treats this as a hypothesis-generation trigger: it proposes a bounded, structured alternative (not a blank-slate "invent any strategy"), tests it rigorously offline, and only if it survives out-of-sample validation does it get promoted into the live strategy pool — completely isolated from real capital until then.

**Why connecting them is more powerful than either alone:**
A system with only the Inner Loop gets better at *exiting* bad trades but never gets better at *avoiding* them — it will make the same mistake forever, just cut losses faster each time. A system with only the Outer Loop (periodic strategy re-optimization) has no fast, real-time defense against an individual decision going bad *right now* — it's too slow to react intraday. Chaining them means individual failures aren't just absorbed and forgotten, they *accumulate into evidence* that drives a structured self-improvement process — and only rigorously-tested improvements make it back into live decisions, which the Inner Loop will then, again, hold to the same standard of continuous justification.

---

## 4. THE ONE-LINE DIFFERENTIATOR

- **Technical:** "A decision-validity graph with per-evidence decay drives real-time invalidation, and recurring invalidation patterns trigger a capital-isolated, commit-reveal-locked hypothesis testing pipeline before any strategy is promoted."
- **Judge-friendly:** "The agent doesn't just trade — it continuously checks whether it still believes its own trades, and when it notices it keeps being wrong for the same reason, it runs a locked, tamper-proof experiment to find something better, before ever risking real capital on the idea."
- **Extremely simple:** "It asks 'should I still believe this?' about every trade, and 'should I still trust this strategy?' about its whole playbook — and it can't cheat on either answer."

---

## 5. HOW THIS MAPS TO THE OFFICIAL PROBLEM STATEMENT

The CSI ORIGIN 2026 brief (Problem Statement 3) asks for a continuous OBSERVE → INTERPRET → REASON → EVALUATE RISK → ALLOCATE → EXECUTE → OBSERVE OUTCOME → ADAPT loop, explicitly rejecting price-prediction-only systems and fixed-rule bots. Provenant satisfies this at both levels:

- The **Inner Loop is the "continuously reassess decisions" requirement**, made architectural rather than a polling timer.
- The **Outer Loop is the "adapt / incorporate outcomes into subsequent decision-making" requirement**, made rigorous rather than "retrain occasionally."
- The **Vault is the enforcement layer for "dynamic decision-making rather than a fixed strategy"** — it's what stops the outer loop itself from degenerating into the exact fixed/overfit-strategy trap the brief is warning against.

Full requirement-by-requirement mapping is in Section 7.

---

## 6. COMPLETE SYSTEM ARCHITECTURE

```
                                    ┌───────────────────────────────────────┐
                                    │        HUMAN-DEFINED BOUNDARIES         │
                                    │ max capital · max exposure · risk      │
                                    │ limit · max txn cost · promotion bar   │
                                    │ · experimentation budget · kill switch │
                                    └───────────────┬─────────────────────────┘
                                                     │ enforced at every stage below
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                         REAL-TIME DATA INGESTION                            │
        │   price ticks · order-book/liquidity proxy · volatility · news/events       │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                       MARKET INTERPRETATION                                 │
        │        regime detection · feature synthesis · freshness tagging             │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                  EVIDENCE / ASSUMPTION LAYER                                │
        │   EvidenceNode{type, source, timestamp, decay_fn, trust_score}              │
        │   FRESH / DEGRADING / STALE classification per evidence type                │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                     OPPORTUNITY GENERATION                                  │
        │      draws from current STRATEGY POOL (bottom of diagram) + live evidence    │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │  RISK EVALUATION → CAPITAL ALLOCATION → DECISION CREATION                    │
        │  return / downside / liquidity / vol / exec cost / capital / exposure       │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
   ══════════════════════════════════════════════════════════════════════════════════════
   ║                    ★ INNER LOOP — DECISION VALIDITY ENGINE ★                        ║
   ║  Live Validity(t) from evidence decay + contradiction + source trust                ║
   ║  Adaptive threshold τ(t) by volatility regime                                       ║
   ║  On breach → targeted reassessment → HOLD / REDUCE / PAUSE / CANCEL / REVERSE       ║
   ══════════════════════════════════════════╤═══════════════════════════════════════════
                                              ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │        EXECUTION VALIDATION → PAPER / SIMULATED EXECUTION                    │
        │   liquidity re-check · slippage estimate · cost vs limit · still valid?      │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                       OUTCOME MONITORING                                    │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                       FAILURE ANALYSIS                                      │
        │        tags WHY a decision was invalidated (evidence type, source)          │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
        ┌────────────────────────────────────────────────────────────────────────────┐
        │                  RECURRING PATTERN DETECTION                                │
        │   groups failures by {evidence type × regime × strategy template}           │
        │   crosses threshold (e.g. 3+ similar failures) → RESEARCH TRIGGER           │
        └───────────────────────────────┬──────────────────────────────────────────────┘
                                         ▼
   ╔══════════════════════════════════════════════════════════════════════════════════╗
   ║              ★ OUTER LOOP — RESEARCH SLEEVE (CAPITAL-FIREWALLED) ★                ║
   ║                                                                                    ║
   ║   HYPOTHESIS GENERATION (structured template space, not open-ended)               ║
   ║              ▼                                                                    ║
   ║   ┌──────────────────────────────────────────────────────┐                       ║
   ║   │        🔒 THE VAULT — M5StickC Plus2 COMMIT-REVEAL      │                       ║
   ║   │  canonical experiment → SHA-256 commit → LOCKED 60s     │                       ║
   ║   │  backend independently enforces lock (device is a       │                       ║
   ║   │  physical witness, not the source of truth)             │                       ║
   ║   └───────────────────────┬──────────────────────────────┘                       ║
   ║              ▼ (only after lock expires)                                          ║
   ║   BACKTEST → OUT-OF-SAMPLE VALIDATION → PAPER TEST                                ║
   ║              ▼                                                                    ║
   ║   REVEAL: result_hash = SHA256(commit + result); verify vs stored commit          ║
   ║              ▼                                                                    ║
   ║   STATISTICAL VALIDATION → PROMOTION GATE                                         ║
   ║              ▼                                                                    ║
   ║        REJECT  ──────────────────  PROMOTE                                        ║
   ╚═══════════════════════════════════════════╤══════════════════════════════════════╝
                                                ▼
                              ┌──────────────────────────┐
                              │       STRATEGY POOL       │──────► feeds back into
                              │  (only proven strategies) │        OPPORTUNITY GENERATION
                              └──────────────────────────┘        (top of diagram)
                                                │
                                                ▼
                              ┌──────────────────────────┐
                              │   DECISION MEMORY / AUDIT  │  (immutable log of every
                              │         TRAIL              │   decision, validity curve,
                              └──────────────────────────┘   experiment, and promotion)
```

**Firewall:** the Research Sleeve reads market data and decision-failure history, but has **no write access to live Allocation or Execution**. A promoted strategy only becomes usable by writing one row to `StrategyPool` — which the live Opportunity Generation stage reads on its next cycle. There is no code path from "experiment result" to "live order" that skips the Promotion Gate.

**Human boundaries** are enforced in exactly three places: (1) Capital Allocation (max capital/exposure), (2) Execution Validation (max txn cost / slippage), (3) Promotion Gate (statistical bar, max experimentation budget). Everything else is autonomous.

---

## 7. STEP-BY-STEP END-TO-END FLOW

1. **Market data arrives** — a price tick, an order-book snapshot, and a news headline stream in.
2. **Opportunity created** — using the current Strategy Pool's "momentum + news confirmation" template, the system proposes: *BUY Asset X — positive earnings news, strong momentum, high liquidity, buyer imbalance.*
3. **Risk evaluated** — volatility-adjusted downside, liquidity-adjusted slippage estimate, exposure impact.
4. **Capital allocated** — sized within max-capital/max-exposure limits, ranked against other open candidates.
5. **Decision created, evidence recorded** — a Decision Node cites the 4 EvidenceNodes above with explicit weights (e.g., news 35%, momentum 25%, liquidity 20%, imbalance 20%) and invalidation conditions.
6. **Conditions change** — 90 seconds later, a corrected headline contradicts the earnings news, and order-book imbalance normalizes.
7. **Decision becomes invalid** — Validity recomputes from 0.91 to 0.34 (below adaptive threshold τ); Failure Analysis tags this as "news-contradiction-driven, high-vol regime."
8. **Autonomous corrective action** — position is REVERSED; the dashboard shows the exact evidence breakdown.
9. **Similar failures recur** — over the session, 3+ decisions using the "news + momentum" template fail the same way during high-volatility windows.
10. **Research Sleeve activates** — Recurring Pattern Detection fires a Research Trigger: *"news+momentum entries underperform in high-vol regimes — test a confirmation-delay variant."*
11. **Hypothesis generated** — from the structured template space: *"Wait 5 minutes after high-impact news + high volatility + liquidity recovery before entering, vs. immediate entry."*
12. **Commit → Vault → Test** — the canonical experiment object is hashed, sent to the M5StickC Plus2, which displays COMMIT LOCKED and counts down 60s; the backend independently refuses any parameter change during the lock; only after the timer expires does the backtest + walk-forward + paper-test run.
13. **Reveal & validate** — result hash is computed and checked against the stored commit; if it matches and p-value/Sharpe/decay clear the statistical bar, the device shows VERIFIED / PROMOTABLE.
14. **Promotion or rejection** — a losing/overfit hypothesis is rejected and logged (still useful — it rules out an idea); a validated one is promoted into the Strategy Pool.
15. **Future decisions improve** — the next high-vol news event now triggers Opportunity Generation to consider *both* the old template and the new delayed-entry template, and the Inner Loop holds the new template's decisions to the exact same continuous-validity standard.

---

## 8. CONSTRAINT COVERAGE (mapped to the official CSI ORIGIN 2026 brief)

| Problem Statement Requirement | System Component | Exactly How It's Satisfied |
|---|---|---|
| Continuously process heterogeneous real-time information (prices, liquidity, news, signals) | Real-Time Data Ingestion + Evidence Layer | Parallel ingestion of price, order-book/liquidity proxy, volatility, and news streams, each converted to typed EvidenceNodes |
| Distinguish current vs. no-longer-representative information | Evidence/Assumption Layer | Per-evidence-type decay function classifies FRESH / DEGRADING / STALE continuously, not on a global timer |
| Evaluate opportunities on return, liquidity, execution cost, volatility, capital, risk | Risk Evaluation + Capital Allocation | Explicit multi-factor scoring before any opportunity is eligible for allocation |
| Dynamic decisions, not a fixed strategy | Opportunity Generation + Strategy Pool | Opportunities are drawn from a live, evolving Strategy Pool, not a static rule set; the pool itself only changes via validated promotion |
| Explicit constraints on capital, exposure, risk, transaction cost | Human-Defined Boundaries block | Enforced at Capital Allocation, Execution Validation, and Promotion Gate — the only 3 human touchpoints |
| End-to-end loop: observe → interpret → reason → risk → allocate → execute → observe outcome → adapt | Full architecture (Section 6) | Traced concretely in Section 7, steps 1–15, with no human step in between |
| Continuously reassess decisions as conditions/information change | Decision Validity Engine (Inner Loop) | Live Validity(t) recomputation triggers automatic reassessment on decay, contradiction, or trust change |
| Opportunity ≠ executable action; consider liquidity, slippage, cost, impact | Execution Validation stage | Independent pre-fill re-check of liquidity, slippage, and cost limits, can defer/block even an approved decision |
| Incorporate outcomes of previous actions into subsequent decision-making | Outcome Monitoring → Failure Analysis → Research Sleeve | Every outcome (success, invalidation, execution failure) feeds both immediate learning (trust/decay updates) and long-run learning (strategy promotion) |
| Minimise human intervention; only human-defined boundaries govern behavior | Entire loop | Humans configure limits once; every HOLD/REDUCE/CANCEL/REVERSE, every hypothesis, every promotion decision is autonomous |
| System must not be a fixed/overfit strategy dressed up as adaptive (implicit anti-p-hacking requirement of "dynamic, not fixed") | The Vault (commit–reveal hardware) | Physically and cryptographically prevents the one failure mode that turns "autonomous experimentation" into a fixed strategy discovered by cheating — parameter-tweaking after seeing results |

---

## 9. THE WOW DEMO (12 phases, ~2.5 minutes)

1. Dashboard shows live prices for 2–3 assets; a BUY decision is created with 4 visible evidence nodes, Validity = 0.91.
2. Injected event: a corrected/contradicting headline fires.
3. Validity gauge visibly collapses (0.91 → 0.34) live on screen.
4. System autonomously REVERSES the position; audit panel explains why, citing the exact evidence node.
5. This is fast-forwarded (pre-seeded history) to show 2 more similar failures under the same regime.
6. Recurring Pattern Detection panel lights up: *"3 failures: news+momentum, high-vol regime."*
7. Research Sleeve activates — a hypothesis card appears: *"Test: 5-min confirmation delay vs. immediate entry."*
8. **The M5StickC Plus2 physically shows COMMIT LOCKED**, hash, and a visible 60-second countdown — the room watches the device, not just the screen.
9. Timer hits zero → device flips to REVEALING → backend runs the backtest/OOS/paper-test.
10. Device shows the verification: COMMIT ✓ / RESULT ✓ / VERIFIED — with OOS Sharpe and p-value.
11. Dashboard shows PROMOTED — the new strategy enters the pool.
12. A new high-vol news event is (re-)injected; the dashboard shows the *new* delayed-entry template being used instead of the old one — closing the loop live.

---

## 10. WHAT MAKES THIS DIFFERENT

| | Traditional Trading Bot | Typical "AI Agent" | Provenant |
|---|---|---|---|
| Who creates strategies? | Human, fixed at design time | Human-authored agent prompts | Agent, from a bounded template space, only after passing the Vault + statistical gate |
| Can decisions be invalidated? | Only via stop-loss/take-profit | Rarely, usually a timer-based re-run | Continuously, via live Validity(t) |
| Remembers why it acted? | No | Sometimes logs output, not reasoning | Full evidence-weighted causal trail per decision |
| Detects recurring reasoning failures? | No | No | Yes — Recurring Pattern Detection is a first-class stage |
| Can it autonomously experiment? | No | Rarely, and usually unconstrained | Yes, from a structured hypothesis space only |
| How are experiments isolated? | N/A | Usually not isolated | Architectural firewall — no code path from experiment to live capital except the Promotion Gate |
| Anti-p-hacking guarantee? | N/A | None | Physically enforced commit–reveal lock (M5StickC Plus2 + backend-independent enforcement) |
| How does learning happen? | Doesn't | Retrain on schedule | Two connected loops: fast (evidence trust/decay updates) + slow (strategy promotion) |

---

## 11. NOVELTY SELF-CHECK

**"Could a judge say this is just an AI trading bot with extra features?"**
No — the two things that would make it "just a bot with a validity score" or "just a bot that backtests" are (a) treating invalidation as a bolt-on monitor rather than the gate every decision must pass through, and (b) treating research as free-form and un-firewalled. Both are explicitly prevented architecturally here: no decision exists outside the Validity Engine, and no experiment can influence capital without clearing the Vault's tamper-evident commit–reveal and the Promotion Gate.

**Strongest anticipated criticism:** *"Isn't the hardware just a gimmick bolted onto a software idea?"*
**Answer:** No — remove the Vault and the Research Sleeve has a real, specific weakness: nothing stops the agent (or a human debugging it live) from seeing a bad backtest and re-running with tweaked parameters, which is exactly the p-hacking failure mode that makes "autonomous strategy discovery" untrustworthy. The M5StickC Plus2 is the one component that makes that failure mode *physically impossible to hide*, not just logically discouraged — which is precisely why it's demoed as a standalone, visible moment (Phase 8–10) rather than a background detail.
