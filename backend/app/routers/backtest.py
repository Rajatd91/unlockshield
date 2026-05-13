"""
API routes for historical backtesting.
Proves UnlockShield's strategy works on real data.
"""
from fastapi import APIRouter, Query
from typing import Optional, List
from app.services.backtester import run_backtest, get_backtest_summary

router = APIRouter()


@router.get("/run")
async def run_historical_backtest(
    portfolio_value: float = Query(default=10000, description="Portfolio value to simulate"),
    tokens: Optional[str] = Query(default=None, description="Comma-separated token filter, e.g. ARB,TIA")
):
    """
    Run full backtest on 13 real historical unlock events (2024-2025).
    Shows what would have happened if UnlockShield had been active.
    """
    token_list = [t.strip().upper() for t in tokens.split(",")] if tokens else None
    result = run_backtest(portfolio_value, token_list)
    return result


@router.get("/summary")
async def get_backtest_headline():
    """Quick summary for the dashboard — one-liner proof that the strategy works."""
    return get_backtest_summary()
