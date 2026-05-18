"""
Portfolio Manager — multi-tier diversified scanning + capital allocation.

Mirrors how multi-strategy quant funds (Citadel, Two Sigma, Wintermute)
structure their crypto books:

  TIER 1 · Large Cap   — top 10 by market cap (BTC, ETH, SOL, …)
                          Systematic-risk hedges, tight tolerance, low
                          risk threshold (anything triggers small hedge).
  TIER 2 · Mid Cap     — upcoming unlock universe (ARB, OP, APT, TIA, …)
                          Event-driven hedges, medium tolerance, the meat
                          of the strategy.
  TIER 3 · Small Cap   — tokens flagged by whale/DEX-anomaly signals
                          High idiosyncratic risk, tight position limits
                          to avoid concentration blow-ups.

Each tier has its own:
  - Action threshold (composite risk to trigger a hedge)
  - Base hedge size (USDC)
  - Maximum cumulative position
  - Sector concentration cap
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


# ─── Tier configuration ────────────────────────────────────────────────────

# Large-cap universe (top 10 ish by typical market cap)
LARGE_CAP_TICKERS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX", "TRX", "DOT"]

# Mid-cap universe (event-driven candidates from the unlock pipeline)
MID_CAP_TICKERS = ["ARB", "OP", "APT", "TIA", "SUI", "SEI", "IMX", "DYDX",
                   "STRK", "INJ", "NEAR", "ATOM", "LDO", "GMX", "PENDLE",
                   "MANTA", "JUP", "PYTH", "TAO", "FET"]

# Memecoin/small-cap watchlist (always scanned, even without event triggers)
# User-requested: TROLL plus other liquid memes that often move sharply.
SMALL_CAP_WATCHLIST = ["TROLL", "PNUT", "GOAT", "MOG", "POPCAT", "BRETT", "WIF", "BONK"]


@dataclass
class TierConfig:
    name: str
    code: str                   # 'large' | 'mid' | 'small'
    action_threshold: int       # composite score to act
    hedge_min_risk: int         # composite score to deploy USDC
    base_hedge_usd: float       # base hedge per event
    max_position_usd: float     # cap per-token cumulative hedge
    description: str


LARGE_CAP_TIER = TierConfig(
    name="Large Cap",
    code="large",
    action_threshold=12,
    hedge_min_risk=18,
    base_hedge_usd=180.0,
    max_position_usd=850.0,
    description="Systematic beta hedges on top-10 tokens — core risk book with higher notional coverage",
)
MID_CAP_TIER = TierConfig(
    name="Mid Cap",
    code="mid",
    action_threshold=15,
    hedge_min_risk=20,
    base_hedge_usd=120.0,
    max_position_usd=650.0,
    description="Event-driven unlock hedges on mid-cap universe — primary strategy book",
)
SMALL_CAP_TIER = TierConfig(
    name="Small Cap",
    code="small",
    action_threshold=20,
    hedge_min_risk=28,
    base_hedge_usd=80.0,
    max_position_usd=350.0,
    description="Idiosyncratic small-cap hedges driven by whale flow / DEX anomaly signals",
)

TIERS: Dict[str, TierConfig] = {
    "large": LARGE_CAP_TIER,
    "mid": MID_CAP_TIER,
    "small": SMALL_CAP_TIER,
}


@dataclass
class Candidate:
    """A single token candidate identified from one of the tiers."""
    token: str
    tier: str                # 'large' | 'mid' | 'small'
    source: str              # 'large_cap_watchlist' | 'upcoming_unlock' | 'whale_flow' | 'dex_anomaly'
    pct_supply: float        # unlock supply % (0 if not unlock-driven)
    days_until: int          # days to event (90 if no specific event)
    recipient: str
    is_cliff: bool
    note: str                # what triggered this candidate (UI display)


def _tier_for_token(token: str) -> str:
    if token in LARGE_CAP_TICKERS:
        return "large"
    if token in MID_CAP_TICKERS:
        return "mid"
    return "small"


def build_candidates(
    unlocks: List,                  # list of unlock objects (have token_symbol, total_supply_percent, unlock_date, category)
    market_overview: Dict,          # /api/market/overview payload
    events: List[Dict],             # /api/events/stream events
) -> List[Candidate]:
    """
    Build the per-cycle candidate set: union of large-cap watchlist + upcoming
    unlocks + tokens flagged by event signals. Deduplicates by token symbol.
    """
    from datetime import datetime
    candidates: Dict[str, Candidate] = {}

    # ─── Tier 1: large-cap systematic watchlist ─────────────────────────
    # For large caps we use regime + macro signals to size — no unlock data.
    market_change = (market_overview.get("global") or {}).get("market_cap_change_24h", 0) or 0
    for tkr in LARGE_CAP_TICKERS:
        # Always include large caps so the agent is constantly managing
        # systematic risk, not just event-driven exposure.
        candidates[tkr] = Candidate(
            token=tkr, tier="large", source="large_cap_watchlist",
            pct_supply=0.0, days_until=90,
            recipient="ecosystem", is_cliff=False,
            note=f"Systematic large-cap surveillance · market {market_change:+.1f}% 24h",
        )

    # ─── Tier 2: mid-cap event-driven (from upcoming unlocks) ───────────
    for u in unlocks[:15]:
        token = u.token_symbol
        if token in candidates and candidates[token].tier == "large":
            # large caps with their own unlock event get upgraded to specific
            continue
        try:
            days = max(1, int((u.unlock_date.replace(tzinfo=None) - datetime.utcnow()).total_seconds() // 86400))
        except Exception:
            days = 30
        category = (getattr(u, "category", "") or "").lower()
        recipient = "investor/team" if "team" in category else (
            "foundation" if "foundation" in category else (
                "ecosystem" if "ecosystem" in category else "investor"))
        is_cliff = "cliff" in category
        tier = _tier_for_token(token)
        candidates[token] = Candidate(
            token=token, tier=tier,
            source="upcoming_unlock",
            pct_supply=u.total_supply_percent or 0.0,
            days_until=days,
            recipient=recipient,
            is_cliff=is_cliff,
            note=f"{u.total_supply_percent or 0}% supply unlock in {days}d · {category or 'investor'}",
        )

    # ─── Tier 3: small-cap idiosyncratic ────────────────────────────────
    # 3a) Hard-coded memecoin watchlist (always scanned, including TROLL)
    for sym in SMALL_CAP_WATCHLIST:
        if sym in candidates:
            continue
        candidates[sym] = Candidate(
            token=sym, tier="small",
            source="memecoin_watchlist",
            pct_supply=0.0, days_until=30,
            recipient="ecosystem", is_cliff=False,
            note=f"Memecoin watchlist · idiosyncratic vol monitoring",
        )

    # 3b) Tokens flagged by DEX volume anomalies
    anomalies = (market_overview or {}).get("volume_anomalies") or []
    for a in anomalies[:8]:
        sym = a.get("symbol")
        if not sym or sym in candidates:
            continue
        tier = _tier_for_token(sym)
        candidates[sym] = Candidate(
            token=sym, tier=tier,
            source="dex_anomaly",
            pct_supply=0.0, days_until=14,
            recipient="ecosystem", is_cliff=False,
            note=f"Volume anomaly · vol/mcap {a.get('volume_to_mcap')}% · severity {a.get('severity')}",
        )

    for e in events[:10]:
        if e.get("event_type") not in ("whale_movement", "liquidation_cascade", "dex_volume_spike"):
            continue
        sym = e.get("token_symbol")
        if not sym or sym in candidates:
            continue
        tier = _tier_for_token(sym)
        candidates[sym] = Candidate(
            token=sym, tier=tier,
            source=e.get("event_type", "event"),
            pct_supply=0.0, days_until=7,
            recipient="ecosystem", is_cliff=False,
            note=f"{e.get('event_type','event')} · severity {e.get('severity_score','?')}",
        )

    return list(candidates.values())


def tier_summary(candidates: List[Candidate]) -> Dict:
    """Group candidates by tier for the UI."""
    out: Dict[str, Dict] = {t: {"count": 0, "tokens": []} for t in TIERS}
    for c in candidates:
        bucket = out.get(c.tier) or out.setdefault(c.tier, {"count": 0, "tokens": []})
        bucket["count"] += 1
        bucket["tokens"].append({"token": c.token, "source": c.source, "note": c.note,
                                 "pct_supply": c.pct_supply, "days_until": c.days_until})
    return out
