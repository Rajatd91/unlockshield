"""
Polymarket Prediction Market Service.

Fetches active crypto-related prediction markets from Polymarket's public
Gamma API. Real-money prediction markets are an additional informational
edge — when crowd-funded markets imply >80% probability of an event, that's
a meaningful signal independent of our internal model.

Used by the autonomous agent as one more factor in composite risk scoring.
"""

import json
from typing import Dict, List, Optional
import asyncio

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


POLYMARKET_GAMMA = "https://gamma-api.polymarket.com/markets"

# Cache (markets don't change every second)
_cache: Dict = {"data": [], "fetched_at": 0.0}
_CACHE_TTL_S = 300  # 5 minutes


def _parse_outcome_prices(raw) -> List[float]:
    """outcomePrices can be a JSON-encoded string or a list."""
    if isinstance(raw, list):
        try:
            return [float(x) for x in raw]
        except Exception:
            return []
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
            return [float(x) for x in parsed]
        except Exception:
            return []
    return []


def _is_crypto_market(m: Dict) -> bool:
    q = (m.get("question") or "").lower()
    slug = (m.get("slug") or "").lower()
    crypto_words = (
        "btc", "bitcoin", "eth", "ethereum", "solana", "sol ", " sol", "crypto",
        "stablecoin", "usdc", "usdt", "defi", "depeg", "etf", "altcoin",
        "memecoin", "doge", "pepe", "xrp", "ripple", "ada", "cardano",
        "avax", "avalanche", "atom", "near", "polkadot", "dot ", "matic",
        "polygon", "arbitrum", "arb ", "optimism", "op ", "kite",
    )
    return any(w in q or w in slug for w in crypto_words)


async def fetch_active_crypto_markets(limit: int = 20) -> List[Dict]:
    """
    Fetch active crypto-related prediction markets. Returns a normalized list:
        [{question, yes_price, no_price, end_date, volume_usd, url}]

    Cached for 5 minutes. Safe to call from the agent loop.
    Returns [] if Polymarket is unreachable or returns unexpected data.
    """
    import time
    now = time.time()
    if _cache["data"] and now - _cache["fetched_at"] < _CACHE_TTL_S:
        return _cache["data"][:limit]
    if not HAS_HTTPX:
        return []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(POLYMARKET_GAMMA, params={
                "active": "true", "closed": "false", "limit": 100,
                "order": "volumeNum", "ascending": "false",
            })
            r.raise_for_status()
            markets = r.json()
    except Exception:
        return _cache["data"][:limit]

    if not isinstance(markets, list):
        return []

    normalized: List[Dict] = []
    for m in markets:
        try:
            if not _is_crypto_market(m):
                continue
            prices = _parse_outcome_prices(m.get("outcomePrices"))
            yes_price = float(prices[0]) if len(prices) > 0 else None
            no_price = float(prices[1]) if len(prices) > 1 else None
            normalized.append({
                "question": m.get("question") or m.get("title") or "?",
                "yes_price": round(yes_price, 3) if yes_price is not None else None,
                "no_price": round(no_price, 3) if no_price is not None else None,
                "implied_pct": round((yes_price or 0) * 100, 1) if yes_price is not None else None,
                "end_date": m.get("endDate") or m.get("endDateIso"),
                "volume_usd": float(m.get("volumeNum") or m.get("volume") or 0),
                "liquidity_usd": float(m.get("liquidity") or 0),
                "slug": m.get("slug"),
                "url": f"https://polymarket.com/market/{m.get('slug')}" if m.get("slug") else None,
            })
        except Exception:
            continue
    normalized.sort(key=lambda x: -x.get("volume_usd", 0))
    _cache["data"] = normalized
    _cache["fetched_at"] = now
    return normalized[:limit]


def market_tail_risk_score(markets: List[Dict]) -> Dict:
    """
    Aggregate signal: how much tail risk do prediction markets currently price?
    Returns a 0-100 score plus a brief explanation.
    """
    if not markets:
        return {"score": 10.0, "detail": "No prediction market data available", "n": 0}
    # Markets where YES side trades >70% imply high conviction
    extreme = [m for m in markets if (m.get("implied_pct") or 0) >= 70 or (m.get("implied_pct") or 0) <= 30]
    # Volume-weighted tail intensity
    total_vol = sum(m.get("volume_usd", 0) for m in markets) or 1
    intensity = 0.0
    for m in markets:
        ip = m.get("implied_pct")
        if ip is None:
            continue
        # Distance from 50% (more conviction = more tail risk priced in)
        distance = abs(ip - 50) / 50.0
        intensity += distance * (m.get("volume_usd", 0) / total_vol)
    score = round(min(100.0, 40 + intensity * 60), 1)
    top = sorted(markets, key=lambda x: -(x.get("volume_usd") or 0))[:2]
    examples = "; ".join(f"{m['question'][:50]} {m.get('implied_pct')}%" for m in top)
    return {
        "score": score,
        "detail": f"{len(markets)} crypto market(s) · {len(extreme)} high-conviction · top: {examples}",
        "n": len(markets),
    }
