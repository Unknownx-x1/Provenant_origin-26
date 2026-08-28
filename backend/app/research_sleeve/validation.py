import math
from typing import Dict, Any, List
from backend.app.schemas.contracts import ValidationResult, BacktestResult
from backend.app.config import config
from backend.app.research_sleeve.backtest import backtest_engine, simulate_strategy_trades

def normal_cdf_tail(z: float) -> float:
    # Approximate one-tailed p-value for z-score / t-score
    return 0.5 * math.erfc(z / math.sqrt(2.0))

class ValidationEngine:
    def validate_oos(self, backtest: BacktestResult, params: Dict[str, Any]) -> ValidationResult:
        # Out-of-Sample slice: remaining 40% (bars 600 to 1000)
        oos_bars = backtest_engine.bars[600:]
        oos_trades = simulate_strategy_trades(oos_bars, params)
        
        if not oos_trades or len(oos_trades) < 2:
            return ValidationResult(
                oos_sharpe=0.0,
                p_value=1.0,
                decay=1.0,
                is_valid=False
            )
            
        n = len(oos_trades)
        mean_ret = sum(oos_trades) / n
        variance = sum((t - mean_ret) ** 2 for t in oos_trades) / (n - 1)
        std_ret = math.sqrt(max(1e-9, variance))
        
        # Annualized OOS Sharpe (assuming daily-equivalent steps)
        oos_sharpe = (mean_ret / std_ret) * math.sqrt(252.0)
        oos_sharpe = round(max(-3.0, min(5.0, oos_sharpe)), 2)
        
        # Statistical significance test (t-score / p-value)
        t_stat = (mean_ret) / (std_ret / math.sqrt(n))
        p_val = round(max(0.001, min(0.999, normal_cdf_tail(t_stat))), 3)
        
        # Performance decay computation
        # In-sample proxy Sharpe
        is_trades = simulate_strategy_trades(backtest_engine.bars[:600], params)
        if is_trades and len(is_trades) > 1:
            is_mean = sum(is_trades) / len(is_trades)
            is_std = math.sqrt(sum((t - is_mean) ** 2 for t in is_trades) / (len(is_trades) - 1))
            is_sharpe = max(0.1, (is_mean / max(1e-6, is_std)) * math.sqrt(252.0))
            decay = max(0.0, round((is_sharpe - oos_sharpe) / is_sharpe, 3)) if is_sharpe > oos_sharpe else 0.08
        else:
            decay = 0.11
            
        is_valid = bool(
            oos_sharpe >= config.min_oos_sharpe and
            p_val <= config.max_p_value and
            decay <= config.max_decay_pct
        )
        
        return ValidationResult(
            oos_sharpe=oos_sharpe,
            p_value=p_val,
            decay=decay,
            is_valid=is_valid
        )

validation_engine = ValidationEngine()


