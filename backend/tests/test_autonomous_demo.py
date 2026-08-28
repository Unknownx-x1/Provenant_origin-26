import pytest
import asyncio
from backend.app.config import config
from backend.app.demo.engine import demo_engine, PHASE_NAMES
from backend.app.schemas.contracts import ExperimentStatus
from backend.app.ai.voice import voice_service
from backend.app.audit.ledger import ledger

@pytest.mark.anyio
async def test_stock_market_config():
    assert config.default_asset == "AAPL"
    assert config.default_company_name == "Apple Inc."
    assert config.environment_name == "SYNTHETIC STOCK MARKET — PAPER TRADING"

@pytest.mark.anyio
async def test_16_phase_autonomous_scenario():
    demo_engine.reset_demo()
    assert demo_engine.current_phase == 1
    
    # Test executing phases 1 through 16 sequentially
    for phase in range(1, 17):
        if phase == 12 and demo_engine.current_experiment:
            demo_engine.current_experiment.seconds_remaining = 0
            demo_engine.current_experiment.status = ExperimentStatus.CREATED
        await demo_engine.execute_phase(phase)
        assert demo_engine.current_phase == phase

        
    # Phase 15 & 16 must have promoted strategy to StrategyPool
    assert len(ledger.strategy_pool) >= 2
    assert "news_momentum_v1_delayed" in ledger.strategy_pool or "news_momentum_v1" in ledger.strategy_pool or "news_momentum_v2" in ledger.strategy_pool


@pytest.mark.anyio
async def test_manual_override_and_reset():
    demo_engine.reset_demo()
    assert demo_engine.current_phase == 1
    
    # Manual step to phase 5
    await demo_engine.execute_phase(5)
    assert demo_engine.current_phase == 5
    
    # Reset
    demo_engine.reset_demo()
    assert demo_engine.current_phase == 1

@pytest.mark.anyio
async def test_voice_fallback():
    # Test voice service toggle and fallback behavior when API key is missing
    voice_service.api_key = None
    voice_service.enabled = True
    
    speech = await voice_service.generate_speech("Test announcement")
    assert speech is None  # Triggers Web Speech API browser fallback
