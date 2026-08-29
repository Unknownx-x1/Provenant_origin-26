# PROVENANT - API Contract & Data Schemas (Frozen)

This document specifies the exact JSON schemas and Pydantic models shared between Track A (Decision Validity Engine) and Track B (Research Sleeve & Dashboard).

---

## 1. Decision Schema (Emitted by Track A, Consumed by Track B)

```json
{
  "decision_id": "uuid-v4-string",
  "opportunity_id": "uuid-v4-string",
  "asset": "BTC-USD",
  "action": "BUY",
  "evidence_nodes": [
    {
      "id": "uuid-v4-string",
      "type": "news",
      "weight": 0.35,
      "source": "Bloomberg API",
      "captured_at": "2026-08-28T16:00:00Z",
      "freshness": "FRESH"
    },
    {
      "id": "uuid-v4-string",
      "type": "momentum",
      "weight": 0.25,
      "source": "RSI_14",
      "captured_at": "2026-08-28T16:00:00Z",
      "freshness": "FRESH"
    }
  ],
  "validity_score": 0.91,
  "validity_threshold": 0.60,
  "status": "open",
  "strategy_template_id": "news_momentum_v1",
  "created_at": "2026-08-28T16:00:00Z"
}
```

---

## 2. FailureEvent Schema (Emitted by Outcome Monitor, Consumed by Pattern Detector)

```json
{
  "failure_id": "uuid-v4-string",
  "decision_id": "uuid-v4-string",
  "strategy_template_id": "news_momentum_v1",
  "regime": "high_vol",
  "invalidation_cause": "evidence_contradicted",
  "dominant_evidence_type": "news",
  "timestamp": "2026-08-28T16:01:30Z"
}
```

---

## 3. ResearchTrigger Schema (Emitted by Pattern Detector, Consumed by Hypothesis Engine)

```json
{
  "trigger_id": "uuid-v4-string",
  "strategy_template_id": "news_momentum_v1",
  "regime": "high_vol",
  "dominant_evidence_type": "news",
  "failure_count": 3,
  "window_sec": 300,
  "timestamp": "2026-08-28T16:02:00Z"
}
```

---

## 4. Experiment Schema (Canonical Research Sleeve Object)

```json
{
  "experiment_id": "exp_0187",
  "hypothesis": "Delay entry by 5 minutes after high-impact news + high volatility to allow liquidity recovery.",
  "strategy_template_id": "news_momentum_v1",
  "parameters": {
    "confirmation_delay_sec": 300
  },
  "dataset": "asset_prices.csv",
  "test_window": "90d_walk_forward",
  "status": "COMMITTING",
  "commit_hash": "a81f9c80d24e12e3...",
  "lock_until": "2026-08-28T16:03:00Z",
  "backtest_result": {
    "total_return": 0.18,
    "max_drawdown": 0.05
  },
  "validation_result": {
    "oos_sharpe": 1.42,
    "p_value": 0.018,
    "decay": 0.11
  },
  "promotion_status": "PENDING"
}
```

---

## 5. StrategyPool Entry Schema (Emitted by Promotion Gate, Consumed by Track A Opportunity Generator)

```json
{
  "strategy_template_id": "news_momentum_v2_delayed",
  "params": {
    "confirmation_delay_sec": 300
  },
  "status": "active",
  "promoted_at": "2026-08-28T16:03:15Z",
  "oos_sharpe": 1.42,
  "p_value": 0.018
}
```

---

## 6. Market News WebSocket Event

The backend emits a `MARKET_NEWS` WebSocket message as soon as a news item is
injected, whether it comes from the autonomous demo or `POST /api/market/inject-news`.

```json
{
  "type": "MARKET_NEWS",
  "data": {
    "type": "news",
    "asset": "AAPL",
    "headline": "Apple cuts revenue guidance amid weaker iPhone demand",
    "source": "Reuters (Simulated)",
    "sentiment": "negative",
    "timestamp": "2026-08-29T16:00:00+00:00",
    "contradicts": "dec_123abc",
    "decision_id": "dec_123abc"
  }
}
```

`source`, `contradicts`, and `decision_id` are optional. The `INITIAL_STATE`
payload provides `latest_market_news` (or `null`) and newest-first
`market_news_history`; reset clears this history before emitting `RESET`.
