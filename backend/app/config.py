import os
from pydantic import BaseModel

class BoundaryConfig(BaseModel):
    environment_name: str = "SYNTHETIC STOCK MARKET — PAPER TRADING"
    default_asset: str = "AAPL"
    default_company_name: str = "Apple Inc."
    default_stock_price: float = 227.40
    default_stock_change_pct: float = 1.18
    
    max_capital: float = 100000.0  # USD paper capital
    max_exposure_per_asset: float = 25000.0  # USD max position limit
    risk_limit_max_downside: float = 0.05  # 5% max downside limit
    max_transaction_cost_pct: float = 0.002  # 20 bps
    
    # Statistical Promotion Gate Thresholds
    min_oos_sharpe: float = 0.8
    max_p_value: float = 0.05
    max_decay_pct: float = 0.15
    experiment_lock_duration_sec: int = 10  # 10 seconds lock for hardware demo

config = BoundaryConfig()
