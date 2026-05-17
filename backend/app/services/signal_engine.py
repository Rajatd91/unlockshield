"""
Multi-Signal Risk Engine — institutional-grade composite scoring.

Aggregates all 8 event categories + 5-signal market regime + sector data
+ news sentiment into a per-token composite risk score, with explicit
signal contributions (so the agent can explain WHY it acted).

Modelled on the multi-factor risk frameworks used by Gauntlet, Chaos Labs,
and quant desks like Wintermute / Jump Crypto — adapted for DeFi event
risk rather than traditional equity factors.

Signal taxonomy (matches the news/event feed):
  1. unlock_pressure    — token unlock supply shock
  2. whale_outflow      — large transfers to exchanges
  3. dex_anomaly        — DEX volume / liquidity spikes
  4. stablecoin_stress  — USDC/USDT depeg or supply contraction
  5. lending_risk       — liquidation cascade risk
  6. governance_risk    — pending governance proposals
  7. regulatory_risk    — adverse regulatory action
  8. macro_overlay      — Fed/CPI/equity stress
Plus market overlays:
  9. regime_overlay     — BULL/BEAR/SIDEWAYS multiplier
 10. sector_contagion   — same-sector tokens under stress
 11. sentiment          — news sentiment + Fear & Greed
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple


# ─── Factor weights (sum to 1.0) ───────────────────────────────────────────
# These are the weights an institutional risk model would use for crypto
# event risk. Unlock pressure dominates because it's the most directly
# linked to forward price impact (cf. our 13-event backtest).
FACTOR_WEIGHTS: Dict[str, float] = {
    "unlock_pressure":    0.25,
    "whale_outflow":      0.11,
    "dex_anomaly":        0.09,
    "stablecoin_stress":  0.09,
    "lending_risk":       0.07,
    "governance_risk":    0.04,
    "regulatory_risk":    0.06,
    "macro_overlay":      0.08,
    "regime_overlay":     0.07,
    "sector_contagion":   0.04,
    "sentiment":          0.03,
    "prediction_market":  0.07,   # Polymarket crowd-funded conviction
}
assert abs(sum(FACTOR_WEIGHTS.values()) - 1.0) < 1e-6, "factor weights must sum to 1"


# Sector taxonomy (mirrors frontend)
SECTOR_MAP: Dict[str, str] = {
    "ETH": "L1", "SOL": "L1", "AVAX": "L1", "NEAR": "L1", "DOT": "L1",
    "ATOM": "L1", "ICP": "L1", "TIA": "L1", "SUI": "L1", "APT": "L1",
    "ARB": "L2", "OP": "L2", "STRK": "L2", "MANTA": "L2", "ZK": "L2",
    "IMX": "L2", "MATIC": "L2",
    "UNI": "DeFi", "AAVE": "DeFi", "PENDLE": "DeFi", "GMX": "DeFi",
    "LDO": "DeFi", "CRV": "DeFi", "DYDX": "DeFi", "RDNT": "DeFi",
    "GALA": "Gaming", "AXS": "Gaming", "SAND": "Gaming",
    "PYTH": "Infra", "TAO": "Infra", "FET": "Infra", "GRT": "Infra",
    "FIL": "Infra", "AR": "Infra", "INJ": "Infra", "KAVA": "Infra",
    "JUP": "DeFi", "ALGO": "L1",
}


@dataclass
class SignalScore:
    """A single signal contribution, 0-100 with explanation."""
    name: str
    score: float           # 0-100, higher = more risky
    weight: float          # 0-1
    contribution: float    # score * weight
    detail: str            # human-readable explanation
    raw: Dict = field(default_factory=dict)


@dataclass
class CompositeRiskScore:
    """Per-token composite risk with all signal contributions."""
    token: str
    composite_score: float           # 0-100 weighted sum
    risk_tier: str                   # CRITICAL / HIGH / ELEVATED / MODERATE / LOW
    signals: List[SignalScore]
    top_drivers: List[str]           # top-3 signal names by contribution
    sector: str
    predicted_impact_pct: float
    confidence: float
    rationale_chain: List[str]       # bullet rationale for the activity log
    timestamp: str


# ─── Individual signal scorers ─────────────────────────────────────────────

def _score_unlock(pct_supply: float, days_until: int, recipient: str = "investor",
                  is_cliff: bool = False) -> SignalScore:
    """Token unlock pressure: function of supply %, urgency, recipient type, cliff/linear."""
    base = min(100.0, pct_supply * 14.0)
    urgency = 22 if days_until <= 3 else (12 if days_until <= 7 else (5 if days_until <= 14 else 0))
    recipient_mult = {
        "investor": 1.15,
        "team": 1.15,
        "investor/team": 1.20,
        "investor/team cliff": 1.30,
        "foundation": 1.05,
        "ecosystem": 0.70,
    }.get((recipient or "").lower(), 1.0)
    cliff_bonus = 8 if is_cliff else 0
    score = min(100.0, (base + urgency + cliff_bonus) * recipient_mult)
    return SignalScore(
        name="unlock_pressure",
        score=round(score, 1),
        weight=FACTOR_WEIGHTS["unlock_pressure"],
        contribution=round(score * FACTOR_WEIGHTS["unlock_pressure"], 2),
        detail=f"{pct_supply}% supply · {days_until}d · {recipient}{' cliff' if is_cliff else ''}",
        raw={"pct_supply": pct_supply, "days_until": days_until, "recipient": recipient, "cliff": is_cliff},
    )


def _score_whale_outflow(events: List[Dict], token: str) -> SignalScore:
    """Whale movement signal for this token (or market-wide if no token-specific)."""
    token_events = [e for e in events if e.get("event_type") == "whale_movement"
                    and (e.get("token_symbol") == token or not e.get("token_symbol"))]
    if not token_events:
        return SignalScore("whale_outflow", 5.0, FACTOR_WEIGHTS["whale_outflow"],
                          round(5.0 * FACTOR_WEIGHTS["whale_outflow"], 2),
                          "No whale activity detected", {"events": 0})
    max_sev = max((e.get("severity_score") or 0) for e in token_events)
    direct = sum(1 for e in token_events if e.get("token_symbol") == token)
    score = min(100.0, max_sev + direct * 5)
    return SignalScore(
        "whale_outflow", round(score, 1), FACTOR_WEIGHTS["whale_outflow"],
        round(score * FACTOR_WEIGHTS["whale_outflow"], 2),
        f"{len(token_events)} whale event(s) · max severity {int(max_sev)}{' · direct hit' if direct else ''}",
        {"event_count": len(token_events), "direct_hits": direct, "max_severity": max_sev},
    )


def _score_dex_anomaly(events: List[Dict], anomalies: List[Dict], token: str) -> SignalScore:
    """DEX volume anomalies for this token or its trading pairs."""
    dex_events = [e for e in events if e.get("event_type") == "dex_volume_spike"]
    token_anom = next((a for a in anomalies if a.get("symbol") == token), None)
    score = 0.0
    bits = []
    if token_anom:
        score += min(60.0, (token_anom.get("severity") == "CRITICAL") * 60 +
                           (token_anom.get("severity") == "HIGH") * 40 +
                           (token_anom.get("severity") == "MEDIUM") * 25)
        bits.append(f"volume/mcap {token_anom.get('volume_to_mcap')}% · {token_anom.get('severity')}")
    if dex_events:
        avg = sum(e.get("severity_score") or 0 for e in dex_events) / len(dex_events)
        score += min(40.0, avg * 0.3)
        bits.append(f"{len(dex_events)} DEX spike(s) · avg severity {int(avg)}")
    if not bits:
        bits.append("No DEX anomalies")
        score = 5.0
    score = min(100.0, score)
    return SignalScore("dex_anomaly", round(score, 1), FACTOR_WEIGHTS["dex_anomaly"],
                      round(score * FACTOR_WEIGHTS["dex_anomaly"], 2),
                      " · ".join(bits), {"events": len(dex_events), "token_anomaly": bool(token_anom)})


def _score_stablecoin_stress(events: List[Dict]) -> SignalScore:
    """USDC/USDT depeg or supply contraction risk (market-wide signal)."""
    stable_events = [e for e in events if e.get("event_type") == "stablecoin_flow"]
    if not stable_events:
        return SignalScore("stablecoin_stress", 8.0, FACTOR_WEIGHTS["stablecoin_stress"],
                          round(8.0 * FACTOR_WEIGHTS["stablecoin_stress"], 2),
                          "Stablecoin market stable", {})
    max_sev = max((e.get("severity_score") or 0) for e in stable_events)
    score = min(100.0, max_sev)
    titles = [e.get("title", "")[:40] for e in stable_events[:2]]
    return SignalScore("stablecoin_stress", round(score, 1), FACTOR_WEIGHTS["stablecoin_stress"],
                      round(score * FACTOR_WEIGHTS["stablecoin_stress"], 2),
                      f"{len(stable_events)} alert(s) · top: {' / '.join(titles)}",
                      {"event_count": len(stable_events), "max_severity": max_sev})


def _score_lending_risk(events: List[Dict], token: str) -> SignalScore:
    """Liquidation cascade risk from lending markets."""
    lending_events = [e for e in events if e.get("event_type") in
                      ("liquidation_cascade", "lending_event")]
    if not lending_events:
        return SignalScore("lending_risk", 8.0, FACTOR_WEIGHTS["lending_risk"],
                          round(8.0 * FACTOR_WEIGHTS["lending_risk"], 2),
                          "Lending markets stable", {})
    max_sev = max((e.get("severity_score") or 0) for e in lending_events)
    score = min(100.0, max_sev)
    return SignalScore("lending_risk", round(score, 1), FACTOR_WEIGHTS["lending_risk"],
                      round(score * FACTOR_WEIGHTS["lending_risk"], 2),
                      f"{len(lending_events)} cascade alert(s) · severity {int(max_sev)}",
                      {"event_count": len(lending_events)})


def _score_governance_risk(events: List[Dict], token: str) -> SignalScore:
    """Pending governance proposals on this token."""
    gov_events = [e for e in events if e.get("event_type") == "governance_proposal"
                  and (not e.get("token_symbol") or e.get("token_symbol") == token)]
    if not gov_events:
        return SignalScore("governance_risk", 3.0, FACTOR_WEIGHTS["governance_risk"],
                          round(3.0 * FACTOR_WEIGHTS["governance_risk"], 2),
                          "No pending governance changes", {})
    max_sev = max((e.get("severity_score") or 0) for e in gov_events)
    return SignalScore("governance_risk", round(max_sev, 1), FACTOR_WEIGHTS["governance_risk"],
                      round(max_sev * FACTOR_WEIGHTS["governance_risk"], 2),
                      f"{len(gov_events)} proposal(s)", {"event_count": len(gov_events)})


def _score_regulatory_risk(events: List[Dict]) -> SignalScore:
    """Adverse regulatory news (market-wide tail risk)."""
    reg_events = [e for e in events if e.get("event_type") == "regulatory_news"]
    if not reg_events:
        return SignalScore("regulatory_risk", 5.0, FACTOR_WEIGHTS["regulatory_risk"],
                          round(5.0 * FACTOR_WEIGHTS["regulatory_risk"], 2),
                          "No active regulatory headlines", {})
    max_sev = max((e.get("severity_score") or 0) for e in reg_events)
    return SignalScore("regulatory_risk", round(max_sev, 1), FACTOR_WEIGHTS["regulatory_risk"],
                      round(max_sev * FACTOR_WEIGHTS["regulatory_risk"], 2),
                      f"{len(reg_events)} reg alert(s) · max severity {int(max_sev)}",
                      {"event_count": len(reg_events)})


def _score_macro_overlay(events: List[Dict]) -> SignalScore:
    """Macro tail events (Fed/CPI/equity rout)."""
    macro_events = [e for e in events if e.get("event_type", "").startswith("macro_")]
    if not macro_events:
        return SignalScore("macro_overlay", 10.0, FACTOR_WEIGHTS["macro_overlay"],
                          round(10.0 * FACTOR_WEIGHTS["macro_overlay"], 2),
                          "Macro background calm", {})
    max_sev = max((e.get("severity_score") or 0) for e in macro_events)
    titles = [e.get("title", "")[:35] for e in macro_events[:2]]
    return SignalScore("macro_overlay", round(max_sev, 1), FACTOR_WEIGHTS["macro_overlay"],
                      round(max_sev * FACTOR_WEIGHTS["macro_overlay"], 2),
                      f"{len(macro_events)} macro signal(s) · top: {' / '.join(titles)}",
                      {"event_count": len(macro_events)})


def _score_regime_overlay(regime: Dict) -> SignalScore:
    """Market regime: BEAR adds risk, BULL subtracts, SIDEWAYS neutral."""
    r = (regime.get("regime") or "SIDEWAYS").upper()
    conf = regime.get("confidence", 0.5)
    base = {"BEAR": 65, "SIDEWAYS": 25, "BULL": 10}.get(r, 25)
    score = min(100.0, base * (0.7 + conf * 0.6))  # higher confidence amplifies
    signals_repr = ", ".join(s.get("name", "") + ":" + s.get("bias", "?")
                              for s in regime.get("signals", [])[:3])
    return SignalScore("regime_overlay", round(score, 1), FACTOR_WEIGHTS["regime_overlay"],
                      round(score * FACTOR_WEIGHTS["regime_overlay"], 2),
                      f"{r} ({int(conf*100)}% conf) · {signals_repr}",
                      {"regime": r, "confidence": conf})


def _score_sector_contagion(token: str, gainers: List[Dict], losers: List[Dict]) -> SignalScore:
    """Sector-level stress: are other tokens in this token's sector dumping?"""
    sector = SECTOR_MAP.get(token, "Other")
    sector_losers = [l for l in losers if SECTOR_MAP.get(l.get("symbol", ""), "Other") == sector]
    if not sector_losers:
        return SignalScore("sector_contagion", 10.0, FACTOR_WEIGHTS["sector_contagion"],
                          round(10.0 * FACTOR_WEIGHTS["sector_contagion"], 2),
                          f"{sector} sector stable", {"sector": sector})
    avg_drop = sum(l.get("change_24h", 0) for l in sector_losers) / len(sector_losers)
    score = min(100.0, max(0.0, abs(avg_drop) * 7))
    return SignalScore("sector_contagion", round(score, 1), FACTOR_WEIGHTS["sector_contagion"],
                      round(score * FACTOR_WEIGHTS["sector_contagion"], 2),
                      f"{sector}: {len(sector_losers)} loser(s) avg {avg_drop:.1f}% 24h",
                      {"sector": sector, "losers": len(sector_losers), "avg_drop": avg_drop})


def _score_prediction_market(polymarket_summary: Optional[Dict]) -> SignalScore:
    """Polymarket prediction-market conviction (crowd-funded real money signal)."""
    if not polymarket_summary or polymarket_summary.get("n", 0) == 0:
        return SignalScore("prediction_market", 10.0, FACTOR_WEIGHTS["prediction_market"],
                          round(10.0 * FACTOR_WEIGHTS["prediction_market"], 2),
                          "No active crypto prediction markets", {})
    score = float(polymarket_summary.get("score", 10.0))
    return SignalScore("prediction_market", round(score, 1), FACTOR_WEIGHTS["prediction_market"],
                      round(score * FACTOR_WEIGHTS["prediction_market"], 2),
                      polymarket_summary.get("detail", "Polymarket aggregate"),
                      {"n_markets": polymarket_summary.get("n", 0)})


def _score_sentiment(news: List[Dict], fg_index: int, token: str) -> SignalScore:
    """News sentiment + Fear & Greed Index."""
    token_news = [n for n in news if any(
        (e.get("symbol") == token) for e in (n.get("entities") or [])
    )]
    sentiments = [n.get("sentiment", 0) for n in token_news if isinstance(n.get("sentiment"), (int, float))]
    avg_sent = sum(sentiments) / len(sentiments) if sentiments else 0.0
    # Convert: negative sentiment = high risk score
    sentiment_score = max(0.0, min(100.0, 50 - avg_sent * 100))
    # F&G: low values (fear) = high market risk
    fg_score = max(0.0, min(100.0, 100 - fg_index))
    score = round(0.6 * sentiment_score + 0.4 * fg_score, 1)
    return SignalScore("sentiment", score, FACTOR_WEIGHTS["sentiment"],
                      round(score * FACTOR_WEIGHTS["sentiment"], 2),
                      f"News sent {avg_sent:+.2f} · F&G {fg_index} → composite {score}",
                      {"avg_sentiment": avg_sent, "fg_index": fg_index, "token_articles": len(token_news)})


# ─── Composite scoring ─────────────────────────────────────────────────────

def _risk_tier(score: float) -> str:
    if score >= 70: return "CRITICAL"
    if score >= 55: return "HIGH"
    if score >= 40: return "ELEVATED"
    if score >= 25: return "MODERATE"
    return "LOW"


def score_token(
    token: str,
    pct_supply: float,
    days_until: int,
    recipient: str = "investor",
    is_cliff: bool = False,
    events: Optional[List[Dict]] = None,
    market_overview: Optional[Dict] = None,
    news: Optional[List[Dict]] = None,
    polymarket_summary: Optional[Dict] = None,
) -> CompositeRiskScore:
    """
    Run the full multi-signal model for one token. Returns a CompositeRiskScore
    with the composite, every individual signal, top drivers, and rationale.
    """
    events = events or []
    market_overview = market_overview or {}
    news = news or []
    regime = market_overview.get("market_regime") or {}
    anomalies = market_overview.get("volume_anomalies") or []
    gainers = market_overview.get("top_gainers") or []
    losers = market_overview.get("top_losers") or []
    fg_index = (market_overview.get("fear_greed") or {}).get("value", 50)

    signals = [
        _score_unlock(pct_supply, days_until, recipient, is_cliff),
        _score_whale_outflow(events, token),
        _score_dex_anomaly(events, anomalies, token),
        _score_stablecoin_stress(events),
        _score_lending_risk(events, token),
        _score_governance_risk(events, token),
        _score_regulatory_risk(events),
        _score_macro_overlay(events),
        _score_regime_overlay(regime),
        _score_sector_contagion(token, gainers, losers),
        _score_sentiment(news, fg_index, token),
        _score_prediction_market(polymarket_summary),
    ]

    composite = round(sum(s.contribution for s in signals), 1)
    composite = min(100.0, composite)

    # Top 3 contributors
    by_contribution = sorted(signals, key=lambda s: s.contribution, reverse=True)
    top_drivers = [s.name for s in by_contribution[:3]]

    # Predicted impact: scaled by composite + recipient bias
    base_impact = -pct_supply * 3.0
    composite_mult = 0.6 + (composite / 100) * 1.0  # 0.6× to 1.6×
    predicted_impact = round(max(-40.0, base_impact * composite_mult), 2)

    # Confidence: more signals firing strongly → higher confidence
    firing_signals = sum(1 for s in signals if s.score >= 30)
    confidence = round(min(0.92, 0.55 + firing_signals * 0.045 + (composite / 500)), 3)

    sector = SECTOR_MAP.get(token, "Other")

    rationale = [
        f"Composite risk {composite}/100 ({_risk_tier(composite)}) across {len(signals)} factors",
        f"Top 3 drivers: {by_contribution[0].name} ({by_contribution[0].contribution}), "
        f"{by_contribution[1].name} ({by_contribution[1].contribution}), "
        f"{by_contribution[2].name} ({by_contribution[2].contribution})",
        f"Sector {sector} · regime {regime.get('regime','?')} · F&G {fg_index}",
        f"Predicted 7-day impact {predicted_impact}% at {int(confidence*100)}% confidence",
    ]

    return CompositeRiskScore(
        token=token,
        composite_score=composite,
        risk_tier=_risk_tier(composite),
        signals=signals,
        top_drivers=top_drivers,
        sector=sector,
        predicted_impact_pct=predicted_impact,
        confidence=confidence,
        rationale_chain=rationale,
        timestamp=datetime.utcnow().isoformat(),
    )


def serialize_composite(c: CompositeRiskScore) -> Dict:
    return {
        "token": c.token,
        "composite_score": c.composite_score,
        "risk_tier": c.risk_tier,
        "sector": c.sector,
        "predicted_impact_pct": c.predicted_impact_pct,
        "confidence": c.confidence,
        "top_drivers": c.top_drivers,
        "rationale_chain": c.rationale_chain,
        "signals": [asdict(s) for s in c.signals],
        "timestamp": c.timestamp,
    }
