import pytest
from backend.app.schemas.contracts import Experiment, ExperimentStatus, BacktestResult, ValidationResult
from backend.app.research_sleeve.promotion_gate import promotion_gate

def test_promotion_gate_evaluation_pass():
    exp = Experiment(
        experiment_id="exp_test_gate_pass",
        hypothesis="Test 5-min confirmation delay",
        strategy_template_id="news_momentum_v1",
        parameters={"confirmation_delay_sec": 300},
        status=ExperimentStatus.VERIFIED,
        backtest_result=BacktestResult(total_return=0.18, max_drawdown=0.04, win_rate=0.68, trades_count=142),
        validation_result=ValidationResult(oos_sharpe=1.42, p_value=0.018, decay=0.112, is_valid=True)
    )
    
    promoted = promotion_gate.evaluate_and_promote(exp)
    assert promoted is not None
    assert promoted.strategy_template_id == "news_momentum_v1_delayed" or promoted.strategy_template_id == "news_momentum_v2"

def test_promotion_gate_evaluation_fail():
    exp = Experiment(
        experiment_id="exp_test_gate_fail",
        hypothesis="Test invalid tweak",
        strategy_template_id="news_momentum_v1",
        parameters={"confirmation_delay_sec": 10},
        status=ExperimentStatus.VERIFIED,
        backtest_result=BacktestResult(total_return=-0.05, max_drawdown=0.12, win_rate=0.42, trades_count=80),
        validation_result=ValidationResult(oos_sharpe=0.40, p_value=0.150, decay=0.350, is_valid=False)
    )
    
    promoted = promotion_gate.evaluate_and_promote(exp)
    assert promoted is None
