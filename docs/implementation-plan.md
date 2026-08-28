# PROVENANT — Technical Implementation Specification

## System Architecture

```text
               +-------------------------------------------------------+
               |                  INNER LOOP (Track A)                 |
               | Market Data -> Evidence -> Opportunity -> Risk        |
               |                                 |                     |
               | Action Reversal <- Validity Breach V(t)<0.60 <- DVE   |
               +---------------------------+---------------------------+
                                           | Failure Event Stream
                                           v
               +-------------------------------------------------------+
               |                  OUTER LOOP (Track B)                 |
               | Recurring Failure -> Hypothesis -> Hardware Vault Lock|
               |                                 |                     |
               | Strategy Pool <- Promoted Strategy <- Promotion Gate  |
               +-------------------------------------------------------+
```

## Core Modules & Data Schemas

1. **`Decision`**:
   - `decision_id`: String UUID
   - `asset`: "AAPL"
   - `action`: "BUY" | "SELL"
   - `validity_score`: Float [0.0, 1.0]
   - `validity_threshold`: Float (default 0.60)
   - `status`: "OPEN" | "REVERSED" | "CLOSED"

2. **`FailureEvent`**:
   - `failure_id`: String UUID
   - `decision_id`: String UUID
   - `strategy_template_id`: String
   - `regime`: "HIGH_VOLATILITY" | "NORMAL"
   - `invalidation_cause`: "evidence_contradicted" | "evidence_decayed"

3. **`ResearchTrigger`**:
   - `trigger_id`: String UUID
   - `strategy_template_id`: String
   - `failure_count`: Int (3+)
   - `narrative`: String explanation

4. **`Experiment`**:
   - `experiment_id`: String UUID
   - `hypothesis`: String
   - `parameters`: Dict (e.g. `{"confirmation_delay_sec": 300}`)
   - `commit_hash`: SHA-256 string
   - `status`: "CREATED" | "LOCKED" | "VERIFIED" | "PROMOTED"

5. **`VaultState`**:
   - `experiment_id`: String
   - `state`: "locked" | "verified" | "waiting"
   - `seconds_remaining`: Int
   - `hardware_connected`: Bool
