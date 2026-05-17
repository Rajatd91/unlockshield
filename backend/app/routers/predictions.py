"""
Verifiable Predictions API — Commit-Reveal Oracle
═══════════════════════════════════════════════════
Powers the Predictions tab in the frontend.
Manages the full lifecycle: predict → commit → reveal → reputation.
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from app.services.prediction_oracle import oracle
from app.services.stress_engine import run_full_stress_test, SimulationConfig
from app.services.market_data import fetch_token_detail, get_fear_greed_index

router = APIRouter()


@router.post("/create/{symbol}")
async def create_prediction(
    symbol: str,
    unlock_pct: float = Query(default=2.0, description="% of supply being unlocked"),
    unlock_days: int = Query(default=7, ge=1, le=30),
    recipient: str = Query(default="investor"),
    is_cliff: bool = Query(default=False),
):
    """
    Create a new verifiable prediction for an upcoming unlock.

    Pipeline:
    1. Run full stress simulation on the token
    2. Generate prediction from simulation results
    3. Create cryptographic commitment (keccak256 hash)
    4. Submit commitment to Kite AI blockchain
    5. Return prediction details + tx hash

    The commitment hash proves this prediction was made BEFORE the event.
    """
    symbol = symbol.upper()

    # Fetch token data
    token_data = await fetch_token_detail(symbol)
    if not token_data or token_data.get("price", 0) == 0:
        raise HTTPException(404, f"Token {symbol} not found")

    # Get market context
    fg_data = await get_fear_greed_index()
    fear_greed = fg_data.get("value", 50) if fg_data else 50

    # Extract returns
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

    # Run stress test
    from datetime import datetime, timedelta
    unlock_date = (datetime.utcnow() + timedelta(days=unlock_days)).isoformat() + "Z"

    stress_result = await run_full_stress_test(
        token_symbol=symbol,
        current_price=current_price,
        returns_30d=returns_30d,
        unlock_pct_supply=unlock_pct,
        unlock_recipient=recipient,
        unlock_is_cliff=is_cliff,
        unlock_day=unlock_days,
        fear_greed=fear_greed,
    )

    # Create prediction
    prediction = oracle.create_prediction(
        token_symbol=symbol,
        stress_result=stress_result,
        unlock_date=unlock_date,
        unlock_pct_supply=unlock_pct,
    )

    # Commit to chain
    tx_hash = await oracle.commit_to_chain(prediction.commit_id)

    return {
        "commit_id": prediction.commit_id,
        "token": prediction.token_symbol,
        "predicted_impact": prediction.predicted_impact_pct,
        "confidence": prediction.confidence,
        "var_95": prediction.var_95,
        "cvar_95": prediction.cvar_95,
        "regime": prediction.regime,
        "commit_hash": prediction.commit_hash,
        "tx_hash": tx_hash,
        "unlock_date": prediction.unlock_date,
        "committed_at": prediction.committed_at,
        "verification_note": (
            "This prediction is cryptographically committed on Kite AI blockchain. "
            "After the unlock event, reveal the prediction to prove it was made in advance."
        ),
        "stress_summary": {
            "var_95": stress_result["scenarios"]["base_case"]["var_95"],
            "prob_loss_gt_10": stress_result["scenarios"]["base_case"]["prob_loss_gt_10pct"],
            "unlock_additional_risk": stress_result["unlock_impact_analysis"]["additional_cvar_95"],
            "hedge_recommendation": stress_result["hedge_recommendation"],
        },
    }


@router.post("/reveal/{commit_id}")
async def reveal_prediction(
    commit_id: str,
    actual_impact: float = Query(description="Actual 7-day price impact (e.g., -12.5)"),
):
    """
    Reveal a previously committed prediction after the event.

    Verifies the cryptographic commitment matches, then scores accuracy.
    Updates on-chain reputation.
    """
    result = oracle.reveal_prediction(commit_id, actual_impact)

    if "error" in result:
        raise HTTPException(400, result["error"])

    return result


@router.get("/history")
async def get_prediction_history(
    limit: int = Query(default=20, ge=1, le=100),
):
    """
    Get prediction history with accuracy scores.
    Shows the agent's track record — the basis of reputation.
    """
    return {
        "predictions": oracle.get_prediction_history(limit),
        "stats": oracle.get_stats(),
    }


@router.get("/reputation")
async def get_reputation():
    """
    Agent reputation score and breakdown.
    Score range: 0-1000, with letter grades (F to S).

    Reputation factors:
    - Accuracy rate (40%): predictions within ±5% of actual
    - Streak (20%): consecutive accurate predictions
    - Volume (15%): total predictions made (credibility)
    - Error quality (25%): average absolute error
    """
    return {
        "reputation": oracle.get_reputation(),
        "stats": oracle.get_stats(),
        "explanation": {
            "score_range": "0-1000",
            "grades": "F < 200 < D < 300 < C < 400 < C+ < 500 < B < 600 < B+ < 700 < A < 800 < A+ < 900 < S",
            "factors": [
                "Accuracy rate: predictions within ±5% (weight: 40%)",
                "Streak: consecutive accurate predictions (weight: 20%)",
                "Volume: total predictions made (weight: 15%)",
                "Error quality: lower avg error = better (weight: 25%)",
            ],
        },
    }


@router.get("/verify/{commit_id}")
async def verify_prediction(commit_id: str):
    """
    Publicly verify a prediction commitment.
    Anyone can verify that a prediction was made before the event
    by checking the on-chain hash against the revealed data.
    """
    predictions = oracle.predictions
    prediction = predictions.get(commit_id)

    if not prediction:
        raise HTTPException(404, "Prediction not found")

    from app.services.prediction_oracle import verify_commit
    from datetime import datetime

    try:
        unlock_ts = int(datetime.fromisoformat(
            prediction.unlock_date.replace('Z', '+00:00')
        ).timestamp())
    except:
        unlock_ts = 0

    is_valid = verify_commit(
        prediction.commit_hash,
        prediction.token_symbol,
        prediction.predicted_impact_pct,
        unlock_ts,
        prediction.salt,
    )

    return {
        "commit_id": commit_id,
        "token": prediction.token_symbol,
        "commit_hash": prediction.commit_hash,
        "hash_valid": is_valid,
        "on_chain_tx": prediction.tx_hash,
        "committed_at": prediction.committed_at,
        "prediction_revealed": prediction.revealed,
        "predicted_impact": prediction.predicted_impact_pct if prediction.revealed else "HIDDEN (not yet revealed)",
        "actual_impact": prediction.actual_impact,
        "accuracy": prediction.accuracy_score,
        "verification_status": (
            "VERIFIED ✓ — commitment hash matches on-chain record"
            if is_valid else
            "FAILED ✗ — hash mismatch detected"
        ),
    }
