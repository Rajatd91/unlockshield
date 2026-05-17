"""
Market Intelligence API — Full Coverage (250+ Tokens)
Powers the Bloomberg-style dashboard with real-time market data.
"""
from fastapi import APIRouter, Query
from typing import Optional
from app.services.market_data import (
    fetch_market_overview,
    fetch_token_detail,
    detect_volume_anomalies,
    get_supported_tokens,
    get_unlock_relevant_tokens,
    get_sector_heatmap,
    get_fear_greed_index,
)
from app.services.data_providers import (
    defillama_tvl_overview,
    compute_correlation_risk,
)

router = APIRouter()


@router.get("/overview")
async def get_market_overview():
    """
    Full market intelligence package — global stats, 300+ tokens,
    regime detection, sector heatmap, fear/greed, TVL.
    Powers the main dashboard.
    """
    return await fetch_market_overview()


@router.get("/token/{symbol}")
async def get_token_detail(symbol: str):
    """
    Deep-dive on any token — price, 30d history, volatility,
    volume trend, sector classification, and on-chain metrics.
    """
    return await fetch_token_detail(symbol.upper())


@router.get("/anomalies")
async def get_volume_anomalies():
    """
    Real-time volume anomaly detection — flags tokens where 24h volume
    exceeds 12% of market cap. Indicates whale activity, pre-unlock
    positioning, or unusual market events.
    """
    return await detect_volume_anomalies()


@router.get("/tokens")
async def list_supported_tokens(
    unlock_relevant: Optional[bool] = Query(default=False)
):
    """List all supported tokens (100+ with direct mapping, 300+ via API)"""
    if unlock_relevant:
        tokens = get_unlock_relevant_tokens()
        return {"tokens": tokens, "count": len(tokens), "note": "Tokens with known vesting/unlock schedules"}
    all_tokens = get_supported_tokens()
    return {"tokens": all_tokens, "count": len(all_tokens), "note": "Directly mapped tokens. API covers 300+ dynamically."}


@router.get("/regime")
async def get_market_regime():
    """
    Multi-signal market regime detection: BULL / BEAR / SIDEWAYS.
    Signals: market breadth, Fear & Greed, BTC dominance, momentum, altcoin strength.
    Risk engine adjusts hedge sizing based on regime.
    """
    overview = await fetch_market_overview()
    return overview.get("market_regime", {"regime": "UNKNOWN"})


@router.get("/sectors")
async def get_sector_performance():
    """
    Sector performance heatmap across 1h, 24h, 7d, 30d timeframes.
    Sectors: L1, L2, DeFi, Gaming, Infra, Meme, Stable.
    """
    return await get_sector_heatmap()


@router.get("/fear-greed")
async def get_fear_greed():
    """
    Crypto Fear & Greed Index (0-100).
    0 = Extreme Fear, 100 = Extreme Greed.
    Critical for regime-adjusted hedge sizing.
    """
    return await get_fear_greed_index()


@router.get("/tvl")
async def get_defi_tvl():
    """
    DeFi Total Value Locked from DeFiLlama.
    TVL health signals protocol demand — declining TVL before
    an unlock = higher probability of sell pressure.
    """
    return await defillama_tvl_overview()


@router.get("/correlations")
async def get_correlation_analysis():
    """
    Sector correlation analysis — when one token dumps from an unlock,
    how much do correlated sector tokens move? Used for contagion modeling.
    """
    overview = await fetch_market_overview()
    tokens = overview.get("all_tokens", [])
    return compute_correlation_risk(tokens)
