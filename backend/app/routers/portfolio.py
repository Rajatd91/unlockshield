"""
API routes for portfolio management.
Demo portfolio for the hackathon — shows how UnlockShield protects holdings.
"""
from fastapi import APIRouter
from typing import List
from app.services.unlock_fetcher import fetch_token_price
from app.services.hedge_executor import get_total_value_protected, get_hedge_history

router = APIRouter()

# Demo portfolio (simulated holdings for hackathon)
DEMO_PORTFOLIO = [
    {"token_symbol": "ARB", "amount": 5000},
    {"token_symbol": "OP", "amount": 3000},
    {"token_symbol": "APT", "amount": 200},
    {"token_symbol": "SUI", "amount": 2500},
    {"token_symbol": "TIA", "amount": 800},
    {"token_symbol": "SEI", "amount": 10000},
]


@router.get("/holdings")
async def get_portfolio_holdings():
    """
    Get current portfolio holdings with live prices.
    Uses a demo portfolio for hackathon purposes.
    """
    holdings = []
    total_value = 0

    for holding in DEMO_PORTFOLIO:
        price = await fetch_token_price(holding["token_symbol"])
        value = price * holding["amount"]
        total_value += value

        holdings.append({
            "token_symbol": holding["token_symbol"],
            "amount": holding["amount"],
            "current_price": round(price, 4),
            "value_usd": round(value, 2)
        })

    # Sort by value (highest first)
    holdings.sort(key=lambda x: x["value_usd"], reverse=True)

    return {
        "total_value_usd": round(total_value, 2),
        "total_value_protected": round(get_total_value_protected(), 2),
        "holdings_count": len(holdings),
        "holdings": holdings
    }


@router.get("/savings")
async def get_portfolio_savings():
    """
    Calculate how much UnlockShield has saved the user.
    Compares hedged amounts against actual price drops.
    """
    hedges = get_hedge_history()
    total_saved = 0
    savings_details = []

    for hedge in hedges:
        if hedge.get("action") != "HOLD":
            # Estimate savings based on predicted impact
            predicted_loss = abs(hedge.get("predicted_impact", 0)) / 100
            amount = hedge.get("amount_hedged", 0)
            estimated_saving = amount * predicted_loss

            total_saved += estimated_saving
            savings_details.append({
                "token": hedge.get("token_symbol"),
                "hedged_amount": amount,
                "predicted_drop": f"{hedge.get('predicted_impact', 0)}%",
                "estimated_saving": round(estimated_saving, 2),
                "date": hedge.get("executed_at")
            })

    return {
        "total_estimated_savings": round(total_saved, 2),
        "hedge_count": len(savings_details),
        "details": savings_details
    }
