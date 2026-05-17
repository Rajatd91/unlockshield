"""
Stress Testing API — RS-GARCH Monte Carlo Simulation
═════════════════════════════════════════════════════════
Powers the Stress Test tab in the frontend.
Runs full multi-scenario simulations on any token with upcoming unlocks.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.stress_engine import (
    run_full_stress_test,
    run_stress_simulation,
    SimulationConfig,
    detect_regime_from_data,
)
from app.services.market_data import fetch_token_detail, get_fear_greed_index

router = APIRouter()


@router.get("/run/{symbol}")
async def stress_test_token(
    symbol: str,
    unlock_pct: float = Query(default=2.0, description="% of supply being unlocked"),
    unlock_days: int = Query(default=7, ge=1, le=30, description="Days until unlock"),
    recipient: str = Query(default="investor", description="Recipient type"),
    is_cliff: bool = Query(default=False, description="Cliff unlock?"),
    lp_range: float = Query(default=0.10, ge=0.01, le=0.50, description="LP range width (±%)"),
    n_paths: int = Query(default=2000, ge=500, le=10000, description="Monte Carlo paths"),
):
    """
    Full stress test on a token with upcoming unlock.

    Runs Regime-Switching GARCH(1,1) Monte Carlo with Jump-Diffusion.
    Returns multi-scenario analysis (base/bull/bear/no-unlock),
    LP impermanent loss stress test, and hedge recommendations.

    Example: /api/stress/run/ARB?unlock_pct=2.65&unlock_days=5&recipient=investor/team&is_cliff=true
    """
    symbol = symbol.upper()

    # Fetch current market data for the token
    token_data = await fetch_token_detail(symbol)
    if not token_data or token_data.get("price", 0) == 0:
        raise HTTPException(status_code=404, detail=f"Token {symbol} not found or has no price data")

    # Get fear & greed
    fg_data = await get_fear_greed_index()
    fear_greed = fg_data.get("value", 50) if fg_data else 50

    # Extract 30-day returns from price history
    price_history = token_data.get("price_history_30d", [])
    if len(price_history) >= 2:
        returns_30d = []
        for i in range(1, len(price_history)):
            if price_history[i-1] > 0:
                import math
                r = math.log(price_history[i] / price_history[i-1])
                returns_30d.append(r)
    else:
        # Fallback: generate synthetic returns from volatility
        vol = token_data.get("volatility_30d", 0.04)
        import numpy as np
        rng = np.random.default_rng(42)
        returns_30d = list(rng.normal(0, vol, 30))

    current_price = token_data.get("price", 1.0)

    # Run full stress test
    result = await run_full_stress_test(
        token_symbol=symbol,
        current_price=current_price,
        returns_30d=returns_30d,
        unlock_pct_supply=unlock_pct,
        unlock_recipient=recipient,
        unlock_is_cliff=is_cliff,
        unlock_day=unlock_days,
        fear_greed=fear_greed,
        lp_range_pct=lp_range,
    )

    return result


@router.get("/quick/{symbol}")
async def quick_stress_test(
    symbol: str,
    unlock_pct: float = Query(default=2.0),
    unlock_days: int = Query(default=7, ge=1, le=30),
):
    """
    Quick stress test — fewer paths, faster response.
    Good for scanning multiple tokens rapidly.
    Returns just the key metrics (VaR, CVaR, IL, recommendation).
    """
    symbol = symbol.upper()

    token_data = await fetch_token_detail(symbol)
    if not token_data or token_data.get("price", 0) == 0:
        raise HTTPException(status_code=404, detail=f"Token {symbol} not found")

    fg_data = await get_fear_greed_index()
    fear_greed = fg_data.get("value", 50) if fg_data else 50

    price_history = token_data.get("price_history_30d", [])
    if len(price_history) >= 2:
        import math
        returns_30d = [
            math.log(price_history[i] / price_history[i-1])
            for i in range(1, len(price_history))
            if price_history[i-1] > 0
        ]
    else:
        import numpy as np
        vol = token_data.get("volatility_30d", 0.04)
        returns_30d = list(np.random.default_rng(42).normal(0, vol, 30))

    current_price = token_data.get("price", 1.0)

    # Quick simulation (500 paths)
    config = SimulationConfig(n_paths=500, n_days=14, seed=42)
    result = run_stress_simulation(
        current_price=current_price,
        returns_30d=returns_30d,
        config=config,
        unlock_day=unlock_days,
        unlock_pct_supply=unlock_pct,
        fear_greed=fear_greed,
        lp_range_lower=current_price * 0.9,
        lp_range_upper=current_price * 1.1,
    )

    return {
        "token": symbol,
        "price": current_price,
        "regime": result.current_regime,
        "var_95": result.var_95,
        "cvar_95": result.cvar_95,
        "prob_loss_gt_10pct": result.prob_loss_gt_10pct,
        "il_95th": result.il_95th,
        "max_drawdown_mean": result.max_drawdown_mean,
        "mean_return": result.mean_final_return,
        "skewness": result.skewness,
        "kurtosis": result.kurtosis,
    }


@router.get("/regime")
async def get_current_regime():
    """
    Detect current market regime from live data.
    Uses BTC 30-day returns + Fear & Greed as primary signals.
    """
    # Use BTC as the regime indicator
    btc_data = await fetch_token_detail("BTC")
    fg_data = await get_fear_greed_index()

    fear_greed = fg_data.get("value", 50) if fg_data else 50

    price_history = btc_data.get("price_history_30d", []) if btc_data else []
    if len(price_history) >= 2:
        import math
        returns_30d = [
            math.log(price_history[i] / price_history[i-1])
            for i in range(1, len(price_history))
            if price_history[i-1] > 0
        ]
    else:
        returns_30d = [0.001] * 30  # Neutral fallback

    vol_30d = float(__import__('numpy').std(returns_30d)) if returns_30d else 0.03

    regime, confidence = detect_regime_from_data(
        returns_30d=returns_30d,
        volatility_30d=vol_30d,
        fear_greed=fear_greed,
    )

    return {
        "regime": regime,
        "confidence": round(confidence, 3),
        "fear_greed": fear_greed,
        "btc_30d_return": round(sum(returns_30d) * 100, 2),
        "btc_30d_volatility": round(vol_30d * 100, 2),
        "interpretation": {
            "BULL": "Risk-on environment — unlocks absorbed better, reduce hedge sizing by ~20%",
            "BEAR": "Risk-off — thin liquidity amplifies unlock dumps by ~25%, increase hedges",
            "SIDEWAYS": "Neutral — standard hedge sizing applies",
        }.get(regime, "Unknown"),
    }


@router.get("/scan")
async def stress_scan_upcoming():
    """
    Scan all upcoming unlocks and run quick stress tests.
    Returns a ranked list by risk severity — powers the alerts dashboard.
    """
    from app.services.unlock_fetcher import fetch_upcoming_unlocks

    unlocks = await fetch_upcoming_unlocks()
    if not unlocks:
        return {"scanned": 0, "results": [], "note": "No upcoming unlocks found"}

    results = []
    for unlock in unlocks[:10]:  # Limit to top 10 for performance
        try:
            symbol = unlock.get("token_symbol", "").upper()
            pct = unlock.get("total_supply_percent", 1.0)

            token_data = await fetch_token_detail(symbol)
            if not token_data or token_data.get("price", 0) == 0:
                continue

            price_history = token_data.get("price_history_30d", [])
            if len(price_history) >= 2:
                import math
                returns_30d = [
                    math.log(price_history[i] / price_history[i-1])
                    for i in range(1, len(price_history))
                    if price_history[i-1] > 0
                ]
            else:
                import numpy as np
                vol = token_data.get("volatility_30d", 0.04)
                returns_30d = list(np.random.default_rng(42).normal(0, vol, 30))

            from datetime import datetime
            unlock_date = unlock.get("unlock_date")
            if isinstance(unlock_date, str):
                unlock_date = datetime.fromisoformat(unlock_date.replace('Z', '+00:00'))
            days_until = max(1, (unlock_date.replace(tzinfo=None) - datetime.utcnow()).days) if unlock_date else 7

            config = SimulationConfig(n_paths=500, n_days=14, seed=42)
            sim = run_stress_simulation(
                current_price=token_data.get("price", 1.0),
                returns_30d=returns_30d,
                config=config,
                unlock_day=min(days_until, 14),
                unlock_pct_supply=pct,
            )

            results.append({
                "token": symbol,
                "unlock_pct": pct,
                "days_until": days_until,
                "var_95": sim.var_95,
                "cvar_95": sim.cvar_95,
                "prob_loss_gt_10pct": sim.prob_loss_gt_10pct,
                "regime": sim.current_regime,
                "risk_tier": (
                    "CRITICAL" if sim.cvar_95 < -25 else
                    "HIGH" if sim.cvar_95 < -15 else
                    "MODERATE" if sim.cvar_95 < -8 else
                    "LOW"
                ),
            })
        except Exception as e:
            continue

    # Sort by severity (most negative CVaR first)
    results.sort(key=lambda x: x.get("cvar_95", 0))

    return {
        "scanned": len(results),
        "results": results,
        "methodology": "RS-GARCH(1,1) MC with Jump-Diffusion, 500 paths, 14-day horizon",
    }
