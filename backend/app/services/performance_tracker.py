"""
Performance Tracker — institutional metrics for the autonomous agent.

Implements standard quant-finance metrics on the agent's verifiable
prediction track record:

  - Brier score        (calibration of probabilistic predictions, 0 = perfect)
  - Hit rate           (% of predictions within ±5% of actual)
  - Mean absolute error (signed bias indicator)
  - Sharpe-style ratio  (mean accuracy / std deviation of error)
  - Max prediction drawdown (worst single prediction error)
  - Sector exposure    (concentration risk on the agent's open hedges)
"""

import math
from collections import defaultdict
from typing import Dict, List, Optional

from app.services.signal_engine import SECTOR_MAP


def compute_metrics(predictions: List, hedges: Optional[List[Dict]] = None) -> Dict:
    """
    Compute institutional-grade performance metrics from the prediction
    oracle's history. Hedges (from AgentTreasury) provide concentration risk.
    """
    hedges = hedges or []
    revealed = [p for p in predictions if p.revealed]
    n = len(revealed)

    if n == 0:
        return {
            "predictions_total": len(predictions),
            "predictions_revealed": 0,
            "brier_score": None,
            "hit_rate_pct": None,
            "mean_abs_error_pct": None,
            "mean_signed_error_pct": None,
            "sharpe_like": None,
            "max_error_pct": None,
            "best_call": None,
            "worst_call": None,
            "sector_exposure": _sector_exposure(hedges),
        }

    # Error stats
    errors = [abs(p.predicted_impact_pct - p.actual_impact) for p in revealed]
    signed_errors = [p.predicted_impact_pct - p.actual_impact for p in revealed]
    mae = sum(errors) / n
    mean_signed = sum(signed_errors) / n
    std_err = (sum((e - mae) ** 2 for e in errors) / n) ** 0.5
    sharpe_like = round((1.0 / (1.0 + mae)) * (1.0 / max(0.5, std_err / 10)), 3)

    # Hit rate (within ±5%)
    hits = sum(1 for e in errors if e <= 5.0)
    hit_rate = round(hits / n * 100, 1)

    # Brier-style: normalise predicted impact to a probability of >10% loss.
    # Calibrate: predicted -15% should imply ~80% prob of >10% loss.
    def _impact_to_prob(impact_pct: float) -> float:
        x = -impact_pct / 20.0  # negative impacts mapped onto 0-1
        return max(0.0, min(1.0, 1.0 - math.exp(-max(0.0, x))))

    brier_terms = []
    for p in revealed:
        prob_pred = _impact_to_prob(p.predicted_impact_pct)
        outcome = 1.0 if p.actual_impact <= -10.0 else 0.0
        brier_terms.append((prob_pred - outcome) ** 2)
    brier = round(sum(brier_terms) / n, 4)

    # Best / worst single predictions by absolute error
    paired = list(zip(errors, revealed))
    paired.sort()
    best = paired[0][1] if paired else None
    worst = paired[-1][1] if paired else None
    def _summarize(p):
        if not p:
            return None
        return {
            "token": p.token_symbol,
            "predicted_impact_pct": p.predicted_impact_pct,
            "actual_impact_pct": p.actual_impact,
            "error_pct": round(abs(p.predicted_impact_pct - p.actual_impact), 2),
            "accuracy_score": p.accuracy_score,
            "unlock_date": p.unlock_date,
        }

    return {
        "predictions_total": len(predictions),
        "predictions_revealed": n,
        "hit_rate_pct": hit_rate,
        "brier_score": brier,
        "mean_abs_error_pct": round(mae, 2),
        "mean_signed_error_pct": round(mean_signed, 2),
        "sharpe_like": sharpe_like,
        "max_error_pct": round(max(errors), 2),
        "best_call": _summarize(best),
        "worst_call": _summarize(worst),
        "sector_exposure": _sector_exposure(hedges),
        "interpretation": {
            "hit_rate_pct": "Predictions within ±5% of actual (calibration)",
            "brier_score": "Calibration of probabilistic prediction (0 = perfect, 0.25 = naive 50/50, 1 = always wrong)",
            "mean_abs_error_pct": "Average absolute error in 7-day impact prediction (percentage points)",
            "mean_signed_error_pct": "Bias: positive = agent overestimates loss, negative = underestimates",
            "sharpe_like": "Mean accuracy / std deviation of error (higher = more consistent)",
            "max_error_pct": "Largest single-prediction miss in the track record",
        },
    }


def _sector_exposure(hedges: List[Dict]) -> Dict:
    """Concentration risk: how much of the treasury is hedged per sector."""
    if not hedges:
        return {"total_usd": 0.0, "by_sector": {}, "max_concentration_pct": 0.0, "top_sector": None}
    total = sum(h.get("amount_usd", 0) for h in hedges)
    by_sector: Dict[str, float] = defaultdict(float)
    for h in hedges:
        token = h.get("token", "")
        sector = SECTOR_MAP.get(token, "Other")
        by_sector[sector] += h.get("amount_usd", 0)
    out_by_sector = {
        s: {"usd": round(v, 2), "pct": round(v / total * 100, 1) if total else 0}
        for s, v in sorted(by_sector.items(), key=lambda x: -x[1])
    }
    top = next(iter(out_by_sector.items())) if out_by_sector else (None, {"pct": 0})
    return {
        "total_usd": round(total, 2),
        "by_sector": out_by_sector,
        "top_sector": top[0],
        "max_concentration_pct": top[1]["pct"] if top[0] else 0.0,
    }
