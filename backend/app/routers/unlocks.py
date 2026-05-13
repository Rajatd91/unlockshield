"""
API routes for token unlock data and risk analysis.
"""
from fastapi import APIRouter
from typing import List
from app.services.unlock_fetcher import fetch_upcoming_unlocks
from app.services.risk_analyzer import analyze_unlock_risk

router = APIRouter()


@router.get("/upcoming")
async def get_upcoming_unlocks():
    """
    Fetch all upcoming token unlock events within the next 45 days.
    Returns enriched data with current USD values.
    """
    unlocks = await fetch_upcoming_unlocks(days_ahead=45)
    return {
        "count": len(unlocks),
        "unlocks": [u.model_dump() for u in unlocks]
    }


@router.get("/analyze/{token_symbol}")
async def analyze_token_unlock(token_symbol: str):
    """
    Run AI risk analysis on a specific token's upcoming unlock.
    Returns risk score, predicted impact, and recommended action.
    """
    unlocks = await fetch_upcoming_unlocks(days_ahead=60)
    target = next((u for u in unlocks if u.token_symbol.upper() == token_symbol.upper()), None)

    if not target:
        return {"error": f"No upcoming unlock found for {token_symbol}"}

    analysis = await analyze_unlock_risk(target)
    return {
        "unlock": target.model_dump(),
        "analysis": analysis.model_dump()
    }


@router.get("/analyze-all")
async def analyze_all_unlocks():
    """
    Run AI risk analysis on ALL upcoming unlocks.
    This is what the autonomous agent calls on each scan cycle.
    """
    unlocks = await fetch_upcoming_unlocks(days_ahead=45)
    results = []

    for unlock in unlocks:
        analysis = await analyze_unlock_risk(unlock)
        results.append({
            "unlock": unlock.model_dump(),
            "analysis": analysis.model_dump()
        })

    # Sort by risk (highest first)
    results.sort(key=lambda x: x["analysis"]["risk_score"], reverse=True)
    return {"count": len(results), "results": results}
