"""
Institutional-Grade Multi-Source Data Provider
═══════════════════════════════════════════════
Unified data layer that aggregates from multiple sources — the same architecture
used by professional trading desks and hedge funds.

Data Sources:
  1. CoinPaprika   — market universe, prices, volume, market cap, percentage changes
  2. Tokenomist    — Dynamic token unlock/vesting schedules (API + fallback)
  3. DeFiLlama     — Total Value Locked (TVL), protocol metrics, chain TVL
  4. Fear & Greed  — Crypto Fear & Greed Index (Alternative.me)
  5. On-Chain      — Kite AI attestation data

Architecture:
  - Every data source has a primary (API) and fallback (cached/computed) path
  - In-memory cache with configurable TTL per source
  - Batch requests where possible to minimize API calls
  - Rate limiting compliant with free public market-data APIs

Production Roadmap (post-hackathon):
  - Token Terminal API — institutional vesting data
  - Nansen / Arkham — wallet labeling + whale tracking
  - Binance/OKX WebSocket — real-time order book depth
  - The Block / Messari — research-grade tokenomics
"""
import httpx
import asyncio
import time
import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

# ── Cache Layer ────────────────────────────────────────────────────────
_cache: Dict[str, dict] = {}

# Different TTLs for different data freshness needs
CACHE_TTL = {
    "prices": 60,          # 1 min — prices need to be fresh
    "market_overview": 300, # 5 min — protect free API quotas during demos
    "token_detail": 180,    # 3 min — detail pages cache longer
    "tvl": 300,             # 5 min — TVL changes slowly
    "fear_greed": 600,      # 10 min — sentiment doesn't change fast
    "unlocks": 900,         # 15 min — unlock schedules are static
    "default": 120,
}


def _get_cached(key: str, category: str = "default") -> Optional[dict]:
    if key in _cache:
        entry = _cache[key]
        ttl = CACHE_TTL.get(category, CACHE_TTL["default"])
        if time.time() - entry["ts"] < ttl:
            return entry["data"]
    return None


def _set_cached(key: str, data):
    _cache[key] = {"data": data, "ts": time.time()}


# ── Sector Classification ─────────────────────────────────────────────
# Every token gets classified into a sector for portfolio analytics
SECTOR_MAP = {
    # Layer 1 Blockchains
    "BTC": "L1", "ETH": "L1", "SOL": "L1", "ADA": "L1", "AVAX": "L1",
    "DOT": "L1", "ATOM": "L1", "NEAR": "L1", "FTM": "L1", "ALGO": "L1",
    "ICP": "L1", "HBAR": "L1", "EGLD": "L1", "FIL": "L1", "XLM": "L1",
    "XRP": "L1", "TRX": "L1", "APT": "L1", "SUI": "L1", "SEI": "L1",
    "TIA": "L1", "INJ": "L1", "TON": "L1", "KAVA": "L1",
    # Layer 2 / Rollups
    "ARB": "L2", "OP": "L2", "MATIC": "L2", "STRK": "L2", "MANTA": "L2",
    "METIS": "L2", "ZK": "L2", "IMX": "L2", "RONIN": "L2",
    # DeFi
    "UNI": "DeFi", "AAVE": "DeFi", "MKR": "DeFi", "CRV": "DeFi",
    "LDO": "DeFi", "SNX": "DeFi", "COMP": "DeFi", "SUSHI": "DeFi",
    "DYDX": "DeFi", "GMX": "DeFi", "PENDLE": "DeFi", "RDNT": "DeFi",
    "JUP": "DeFi", "1INCH": "DeFi", "BAL": "DeFi", "YFI": "DeFi",
    "OSMO": "DeFi", "RUNE": "DeFi",
    # Gaming / Metaverse
    "AXS": "Gaming", "SAND": "Gaming", "MANA": "Gaming", "GALA": "Gaming",
    "ENJ": "Gaming", "ILV": "Gaming", "PRIME": "Gaming",
    # Infrastructure / Middleware
    "LINK": "Infra", "GRT": "Infra", "AR": "Infra", "RENDER": "Infra",
    "RNDR": "Infra", "AKT": "Infra", "PYTH": "Infra", "WLD": "Infra",
    "FET": "Infra", "OCEAN": "Infra", "TAO": "Infra",
    # Stablecoins
    "USDT": "Stable", "USDC": "Stable", "DAI": "Stable", "FRAX": "Stable",
    # Community / retail beta names. The regime model uses broader altcoin strength.
    "DOGE": "Altcoin", "SHIB": "Altcoin", "PEPE": "Altcoin", "WIF": "Altcoin",
    "BONK": "Altcoin", "FLOKI": "Altcoin",
}

SECTOR_COLORS = {
    "L1": "#3b82f6", "L2": "#8b5cf6", "DeFi": "#10b981",
    "Gaming": "#f59e0b", "Infra": "#06b6d4", "Stable": "#94a3b8",
    "Altcoin": "#f472b6", "Other": "#64748b",
}

def classify_sector(symbol: str) -> str:
    return SECTOR_MAP.get(symbol.upper(), "Other")


# ═══════════════════════════════════════════════════════════════════════
# SOURCE 1: CoinPaprika — Full Market Data (300+ tokens)
# ═══════════════════════════════════════════════════════════════════════

COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1"

FALLBACK_MARKET_TOKENS = [
    {"id": "btc-bitcoin", "symbol": "BTC", "name": "Bitcoin", "rank": 1, "price": 103000, "market_cap": 2050000000000, "volume_24h": 52000000000, "change_1h": 0.1, "change_24h": -0.4, "change_7d": 1.9, "change_30d": 7.8},
    {"id": "eth-ethereum", "symbol": "ETH", "name": "Ethereum", "rank": 2, "price": 3900, "market_cap": 470000000000, "volume_24h": 26000000000, "change_1h": 0.2, "change_24h": -0.8, "change_7d": 2.5, "change_30d": 12.1},
    {"id": "usdt-tether", "symbol": "USDT", "name": "Tether", "rank": 3, "price": 1, "market_cap": 115000000000, "volume_24h": 69000000000, "change_1h": 0, "change_24h": 0, "change_7d": 0, "change_30d": 0},
    {"id": "bnb-binance-coin", "symbol": "BNB", "name": "BNB", "rank": 4, "price": 690, "market_cap": 101000000000, "volume_24h": 2100000000, "change_1h": -0.1, "change_24h": -1.3, "change_7d": -0.6, "change_30d": 4.2},
    {"id": "sol-solana", "symbol": "SOL", "name": "Solana", "rank": 5, "price": 174, "market_cap": 89000000000, "volume_24h": 5300000000, "change_1h": 0.5, "change_24h": -2.2, "change_7d": 4.8, "change_30d": 19.2},
    {"id": "xrp-xrp", "symbol": "XRP", "name": "XRP", "rank": 6, "price": 0.62, "market_cap": 35000000000, "volume_24h": 1700000000, "change_1h": -0.2, "change_24h": -1.0, "change_7d": 0.8, "change_30d": 2.6},
    {"id": "usdc-usd-coin", "symbol": "USDC", "name": "USD Coin", "rank": 7, "price": 1, "market_cap": 33000000000, "volume_24h": 8800000000, "change_1h": 0, "change_24h": 0, "change_7d": 0, "change_30d": 0},
    {"id": "ada-cardano", "symbol": "ADA", "name": "Cardano", "rank": 8, "price": 0.73, "market_cap": 26000000000, "volume_24h": 910000000, "change_1h": 0.1, "change_24h": -1.8, "change_7d": 3.1, "change_30d": 9.5},
    {"id": "doge-dogecoin", "symbol": "DOGE", "name": "Dogecoin", "rank": 9, "price": 0.17, "market_cap": 25000000000, "volume_24h": 2100000000, "change_1h": 0.8, "change_24h": -3.4, "change_7d": 8.7, "change_30d": 22.0},
    {"id": "avax-avalanche", "symbol": "AVAX", "name": "Avalanche", "rank": 10, "price": 38, "market_cap": 15000000000, "volume_24h": 680000000, "change_1h": 0.2, "change_24h": -2.6, "change_7d": -1.8, "change_30d": 5.1},
    {"id": "link-chainlink", "symbol": "LINK", "name": "Chainlink", "rank": 11, "price": 17.5, "market_cap": 10500000000, "volume_24h": 820000000, "change_1h": -0.1, "change_24h": -1.1, "change_7d": 6.5, "change_30d": 10.4},
    {"id": "uni-uniswap", "symbol": "UNI", "name": "Uniswap", "rank": 12, "price": 9.1, "market_cap": 5500000000, "volume_24h": 310000000, "change_1h": 0.4, "change_24h": -2.9, "change_7d": 7.1, "change_30d": 16.3},
    {"id": "arb-arbitrum", "symbol": "ARB", "name": "Arbitrum", "rank": 13, "price": 1.05, "market_cap": 4100000000, "volume_24h": 410000000, "change_1h": -0.4, "change_24h": -4.2, "change_7d": -6.8, "change_30d": -3.2},
    {"id": "op-optimism", "symbol": "OP", "name": "Optimism", "rank": 14, "price": 2.15, "market_cap": 3800000000, "volume_24h": 350000000, "change_1h": -0.3, "change_24h": -3.7, "change_7d": -4.1, "change_30d": 1.8},
    {"id": "tia-celestia", "symbol": "TIA", "name": "Celestia", "rank": 15, "price": 8.2, "market_cap": 2100000000, "volume_24h": 280000000, "change_1h": -0.6, "change_24h": -5.8, "change_7d": -11.2, "change_30d": -18.7},
]


def _fallback_market_tokens(limit: int = 300) -> List[Dict]:
    """Last-known demo snapshot used only when all live market sources fail."""
    enriched = []
    for t in FALLBACK_MARKET_TOKENS[:limit]:
        item = dict(t)
        item.update({
            "volume_to_mcap": round((item["volume_24h"] / item["market_cap"]) * 100, 2) if item["market_cap"] else 0,
            "ath": 0,
            "ath_change_pct": 0,
            "sparkline_7d": [],
            "sector": classify_sector(item["symbol"]),
            "image": "",
            "data_source": "fallback_snapshot",
            "data_quality": "stale_provider_fallback",
        })
        enriched.append(item)
    return enriched


def _normalize_coinpaprika_ticker(t: Dict) -> Dict:
    symbol = (t.get("symbol") or "").upper()
    usd = (t.get("quotes") or {}).get("USD") or {}
    market_cap = float(usd.get("market_cap") or 0)
    volume = float(usd.get("volume_24h") or 0)
    return {
        "id": t.get("id"),
        "symbol": symbol,
        "name": t.get("name", ""),
        "rank": int(t.get("rank") or 999999),
        "price": float(usd.get("price") or 0),
        "market_cap": market_cap,
        "volume_24h": volume,
        "change_1h": round(float(usd.get("percent_change_1h") or 0), 2),
        "change_24h": round(float(usd.get("percent_change_24h") or 0), 2),
        "change_7d": round(float(usd.get("percent_change_7d") or 0), 2),
        "change_30d": round(float(usd.get("percent_change_30d") or 0), 2),
        "volume_to_mcap": round((volume / market_cap) * 100, 2) if market_cap > 0 else 0,
        "ath": float(usd.get("ath_price") or 0),
        "ath_change_pct": round(float(usd.get("percent_from_price_ath") or 0), 1),
        "sparkline_7d": [],
        "sector": classify_sector(symbol),
        "image": "",
        "data_source": "coinpaprika",
        "data_quality": "live",
    }


async def coinpaprika_market_full(limit: int = 300) -> List[Dict]:
    """
    Fetch the live token universe from CoinPaprika.

    CoinPaprika is the primary source because its public endpoint returns rich
    ticker rows without an API key and is less fragile for a hackathon demo than
    heavily rate-limited public market-data tiers.
    """
    cache_key = f"cp_full_{limit}"
    cached = _get_cached(cache_key, "market_overview")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(f"{COINPAPRIKA_BASE}/tickers", params={"quotes": "USD"})
            resp.raise_for_status()
            rows = resp.json()

        tokens = [
            _normalize_coinpaprika_ticker(row)
            for row in rows
            if (row.get("quotes") or {}).get("USD", {}).get("market_cap")
        ]
        tokens = sorted(tokens, key=lambda x: x.get("rank") or 999999)[:limit]
        _set_cached(cache_key, tokens)
        return tokens
    except Exception as e:
        print(f"CoinPaprika market fetch error: {e}")
        fallback = _fallback_market_tokens(limit)
        _set_cached(cache_key, fallback)
        return fallback


async def coinpaprika_global(tokens: Optional[List[Dict]] = None) -> Dict:
    """Global crypto market statistics"""
    cached = _get_cached("cp_global", "market_overview")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{COINPAPRIKA_BASE}/global")
            if resp.status_code == 200:
                data = resp.json()
                result = {
                    "total_market_cap": float(data.get("market_cap_usd") or 0),
                    "total_volume_24h": float(data.get("volume_24h_usd") or 0),
                    "btc_dominance": round(float(data.get("bitcoin_dominance_percentage") or 0), 2),
                    "eth_dominance": round(float(data.get("ethereum_dominance_percentage") or 0), 2),
                    "active_cryptocurrencies": int(data.get("cryptocurrencies_number") or 0),
                    "market_cap_change_24h": 0,
                    "defi_market_cap": 0,
                    "data_source": "coinpaprika",
                }
                _set_cached("cp_global", result)
                return result
    except Exception as e:
        print(f"CoinPaprika global error: {e}")

    tokens = tokens or _fallback_market_tokens()
    total_mcap = sum(t.get("market_cap", 0) for t in tokens)
    total_vol = sum(t.get("volume_24h", 0) for t in tokens)
    btc_mcap = next((t.get("market_cap", 0) for t in tokens if t.get("symbol") == "BTC"), 0)
    eth_mcap = next((t.get("market_cap", 0) for t in tokens if t.get("symbol") == "ETH"), 0)
    result = {
        "total_market_cap": total_mcap,
        "total_volume_24h": total_vol,
        "btc_dominance": round((btc_mcap / total_mcap) * 100, 2) if total_mcap else 0,
        "eth_dominance": round((eth_mcap / total_mcap) * 100, 2) if total_mcap else 0,
        "active_cryptocurrencies": len(tokens),
        "market_cap_change_24h": _weighted_average(tokens, "change_24h", "market_cap"),
        "defi_market_cap": sum(t.get("market_cap", 0) for t in tokens if t.get("sector") == "DeFi"),
        "data_source": "computed_from_coinpaprika" if tokens and tokens[0].get("data_source") == "coinpaprika" else "fallback_snapshot",
    }
    _set_cached("cp_global", result)
    return result


async def coinpaprika_prices_batch(symbols_or_ids: List[str]) -> Dict[str, float]:
    """Efficient batch price fetch for any number of tokens"""
    symbols = [s.upper() for s in symbols_or_ids]
    if not symbols:
        return {}

    cache_key = f"cp_prices_{'_'.join(sorted(symbols)[:10])}"
    cached = _get_cached(cache_key, "prices")
    if cached:
        return cached

    tokens = await coinpaprika_market_full(limit=500)
    by_symbol = {t.get("symbol"): float(t.get("price") or 0) for t in tokens}
    prices = {symbol: by_symbol.get(symbol, 0) for symbol in symbols}
    _set_cached(cache_key, prices)
    return prices


def _weighted_average(tokens: List[Dict], value_key: str, weight_key: str) -> float:
    total_weight = sum(max(float(t.get(weight_key) or 0), 0) for t in tokens)
    if total_weight <= 0:
        values = [float(t.get(value_key) or 0) for t in tokens]
        return round(sum(values) / len(values), 2) if values else 0
    weighted = sum(float(t.get(value_key) or 0) * max(float(t.get(weight_key) or 0), 0) for t in tokens)
    return round(weighted / total_weight, 2)


# Backward-compatible aliases used by older imports in the rest of the codebase.
async def coingecko_market_full(pages: int = 3) -> List[Dict]:
    return await coinpaprika_market_full(limit=max(100, pages * 100))


async def coingecko_global() -> Dict:
    return await coinpaprika_global()


async def coingecko_prices_batch(symbols_or_ids: List[str]) -> Dict[str, float]:
    return await coinpaprika_prices_batch(symbols_or_ids)


# ═══════════════════════════════════════════════════════════════════════
# SOURCE 2: Tokenomist — Dynamic Token Unlock Schedules
# ═══════════════════════════════════════════════════════════════════════

async def tokenomist_upcoming_unlocks() -> List[Dict]:
    """
    Fetch upcoming token unlocks from Tokenomist free API.
    Returns standardized unlock event objects.
    Falls back to curated data if API is unavailable.

    Tokenomist API: https://tokenomist.ai (formerly token.unlocks.app)
    Free tier: 100 requests/day, returns upcoming unlocks for 200+ tokens
    """
    cached = _get_cached("tokenomist_unlocks", "unlocks")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Tokenomist public API endpoint
            resp = await client.get(
                "https://api.tokenomist.ai/v1/unlocks/upcoming",
                params={"limit": 100, "days_ahead": 90},
                headers={"Accept": "application/json"},
            )
            if resp.status_code == 200:
                data = resp.json()
                events = data if isinstance(data, list) else data.get("data", data.get("unlocks", []))
                standardized = []
                for e in events:
                    standardized.append({
                        "token_symbol": (e.get("symbol") or e.get("token_symbol") or "").upper(),
                        "token_name": e.get("name") or e.get("token_name") or "",
                        "unlock_date": e.get("unlock_date") or e.get("date") or "",
                        "unlock_amount_tokens": float(e.get("amount") or e.get("unlock_amount_tokens") or 0),
                        "total_supply_percent": float(e.get("pct_supply") or e.get("total_supply_percent") or 0),
                        "category": e.get("category") or e.get("type") or "unknown",
                        "cliff": e.get("is_cliff") or e.get("cliff") or False,
                        "recipients": e.get("recipients") or "Unknown",
                        "source": "tokenomist_api",
                    })
                _set_cached("tokenomist_unlocks", standardized)
                return standardized
    except Exception as e:
        print(f"Tokenomist API unavailable ({e}), using curated data")

    # Fallback to curated list (already comprehensive — see unlock_fetcher.py)
    return []


# ═══════════════════════════════════════════════════════════════════════
# SOURCE 3: DeFiLlama — TVL & Protocol Data
# ═══════════════════════════════════════════════════════════════════════

async def defillama_tvl_overview() -> Dict:
    """
    Fetch Total Value Locked data from DeFiLlama.
    TVL is a key indicator for DeFi token health — declining TVL before
    an unlock = higher sell pressure risk.
    """
    cached = _get_cached("defillama_tvl", "tvl")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Global TVL
            global_resp = await client.get("https://api.llama.fi/v2/historicalChainTvl")
            # Protocol TVLs (top 100)
            protocols_resp = await client.get("https://api.llama.fi/protocols")

        result = {
            "timestamp": datetime.utcnow().isoformat(),
        }

        if global_resp.status_code == 200:
            tvl_data = global_resp.json()
            if tvl_data:
                latest = tvl_data[-1] if isinstance(tvl_data, list) else {}
                result["total_tvl"] = latest.get("tvl", 0)
                # 7-day TVL change
                if len(tvl_data) >= 8:
                    week_ago = tvl_data[-8].get("tvl", 0)
                    if week_ago > 0:
                        result["tvl_change_7d"] = round(
                            (latest.get("tvl", 0) - week_ago) / week_ago * 100, 2
                        )

        if protocols_resp.status_code == 200:
            protocols = protocols_resp.json()[:50]  # Top 50
            result["top_protocols"] = [
                {
                    "name": p.get("name"),
                    "symbol": (p.get("symbol") or "").upper(),
                    "tvl": p.get("tvl", 0),
                    "change_1d": round(p.get("change_1d") or 0, 2),
                    "change_7d": round(p.get("change_7d") or 0, 2),
                    "chain": p.get("chain"),
                    "category": p.get("category"),
                }
                for p in protocols
            ]

        _set_cached("defillama_tvl", result)
        return result

    except Exception as e:
        print(f"DeFiLlama error: {e}")
        return {"error": str(e)}


async def defillama_protocol_tvl(protocol: str) -> Dict:
    """Fetch TVL for a specific protocol — used for individual token risk assessment"""
    cache_key = f"defillama_{protocol}"
    cached = _get_cached(cache_key, "tvl")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"https://api.llama.fi/protocol/{protocol}")
            if resp.status_code == 200:
                data = resp.json()
                result = {
                    "name": data.get("name"),
                    "symbol": data.get("symbol"),
                    "current_tvl": data.get("currentChainTvls", {}),
                    "total_tvl": sum(data.get("currentChainTvls", {}).values()),
                    "mcap_to_tvl": data.get("mcap", 0) / max(sum(data.get("currentChainTvls", {}).values()), 1),
                }
                _set_cached(cache_key, result)
                return result
    except Exception as e:
        print(f"DeFiLlama protocol error: {e}")
    return {}


# ═══════════════════════════════════════════════════════════════════════
# SOURCE 4: Fear & Greed Index
# ═══════════════════════════════════════════════════════════════════════

async def fetch_fear_greed() -> Dict:
    """
    Crypto Fear & Greed Index from Alternative.me.
    0 = Extreme Fear, 100 = Extreme Greed.
    Critical for market regime detection — unlocks in fear markets hit harder.
    """
    cached = _get_cached("fear_greed", "fear_greed")
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://api.alternative.me/fng/",
                params={"limit": 7, "format": "json"}
            )
            if resp.status_code == 200:
                data = resp.json().get("data", [])
                if data:
                    current = data[0]
                    result = {
                        "value": int(current.get("value", 50)),
                        "classification": current.get("value_classification", "Neutral"),
                        "timestamp": current.get("timestamp"),
                        "history_7d": [
                            {"value": int(d.get("value", 50)), "classification": d.get("value_classification")}
                            for d in data
                        ],
                    }
                    _set_cached("fear_greed", result)
                    return result
    except Exception as e:
        print(f"Fear & Greed error: {e}")

    return {"value": 50, "classification": "Neutral", "history_7d": []}


# ═══════════════════════════════════════════════════════════════════════
# COMPOSITE: Full Market Intelligence
# ═══════════════════════════════════════════════════════════════════════

async def get_full_market_intelligence() -> Dict:
    """
    The complete market intelligence package — everything a portfolio manager
    needs to make decisions. Aggregates all sources in parallel.
    """
    cached = _get_cached("full_intel", "market_overview")
    if cached:
        return cached

    # Fetch all data sources in parallel
    tokens_task = coinpaprika_market_full(limit=300)
    global_task = coinpaprika_global()
    fear_task = fetch_fear_greed()
    tvl_task = defillama_tvl_overview()

    tokens, global_stats, fear_greed, tvl = await asyncio.gather(
        tokens_task, global_task, fear_task, tvl_task,
        return_exceptions=True
    )

    # Handle any failed requests
    if isinstance(tokens, Exception):
        tokens = []
    if isinstance(global_stats, Exception):
        global_stats = {}
    if isinstance(fear_greed, Exception):
        fear_greed = {"value": 50, "classification": "Neutral"}
    if isinstance(tvl, Exception):
        tvl = {}

    # Compute sector breakdown
    sector_data = {}
    for t in tokens:
        s = t.get("sector", "Other")
        if s not in sector_data:
            sector_data[s] = {"count": 0, "total_mcap": 0, "avg_change_24h": 0, "tokens": []}
        sector_data[s]["count"] += 1
        sector_data[s]["total_mcap"] += t.get("market_cap", 0)
        sector_data[s]["avg_change_24h"] += t.get("change_24h", 0)
        sector_data[s]["tokens"].append(t.get("symbol"))

    for s in sector_data:
        n = sector_data[s]["count"]
        sector_data[s]["avg_change_24h"] = round(sector_data[s]["avg_change_24h"] / n, 2) if n > 0 else 0
        sector_data[s]["color"] = SECTOR_COLORS.get(s, "#64748b")

    # Market regime detection
    regime = _detect_regime(tokens, global_stats, fear_greed)

    # Volume anomaly scan
    anomalies = _scan_volume_anomalies(tokens)

    # Top movers
    sorted_by_change = sorted(tokens, key=lambda x: x.get("change_24h", 0))
    top_gainers = sorted_by_change[-5:][::-1]
    top_losers = sorted_by_change[:5]

    # Fetch event intelligence (lightweight summary only — full stream via /api/events/stream)
    event_summary = {}
    try:
        from app.services.event_engine import get_event_intelligence_summary
        event_summary = await get_event_intelligence_summary()
    except Exception as e:
        print(f"Event engine not available: {e}")

    intel = {
        "timestamp": datetime.utcnow().isoformat(),
        "global": global_stats,
        "fear_greed": fear_greed,
        "market_regime": regime,
        "tvl": {
            "total": tvl.get("total_tvl", 0),
            "change_7d": tvl.get("tvl_change_7d", 0),
        },
        "tokens_count": len(tokens),
        "top_tokens": tokens,         # All tokens for display
        "all_tokens": tokens,        # Full list for search
        "sectors": sector_data,
        "sector_colors": SECTOR_COLORS,
        "top_gainers": top_gainers,
        "top_losers": top_losers,
        "volume_anomalies": anomalies,
        "event_intelligence": event_summary,
        "data_quality": {
            "market_data_source": tokens[0].get("data_source", "unknown") if tokens else "unavailable",
            "market_data_quality": tokens[0].get("data_quality", "unknown") if tokens else "unavailable",
            "primary_price_provider": "CoinPaprika",
            "notes": "CoinPaprika powers market cap, volume, and percentage changes. DeFiLlama powers TVL/yield/stablecoin data. Alternative.me powers Fear & Greed.",
        },
    }

    _set_cached("full_intel", intel)
    return intel


def _detect_regime(tokens: list, global_stats: dict, fear_greed: dict) -> Dict:
    """
    Multi-signal market regime detection.
    Used by the risk engine to dynamically adjust hedge sizing.
    """
    signals = []

    # Signal 1: Market breadth — % of top 100 tokens positive in 24h
    top100 = tokens[:100]
    if top100:
        positive = sum(1 for t in top100 if t.get("change_24h", 0) > 0)
        breadth = positive / len(top100) * 100
        signals.append({
            "name": "Market Breadth",
            "value": f"{breadth:.0f}% positive",
            "score": breadth,
            "bias": "BULL" if breadth > 60 else "BEAR" if breadth < 40 else "NEUTRAL",
        })

    # Signal 2: Fear & Greed
    fg = fear_greed.get("value", 50) if isinstance(fear_greed, dict) else 50
    signals.append({
        "name": "Fear & Greed",
        "value": f"{fg}/100 ({fear_greed.get('classification', 'N/A')})",
        "score": fg,
        "bias": "BULL" if fg > 60 else "BEAR" if fg < 35 else "NEUTRAL",
    })

    # Signal 3: BTC Dominance (high = risk-off, low = risk-on/altseason)
    btc_dom = global_stats.get("btc_dominance", 50)
    signals.append({
        "name": "BTC Dominance",
        "value": f"{btc_dom}%",
        "score": 100 - btc_dom,  # Invert: low dominance = bullish for alts
        "bias": "BULL" if btc_dom < 45 else "BEAR" if btc_dom > 58 else "NEUTRAL",
    })

    # Signal 4: Total market cap momentum
    mcap_change = global_stats.get("market_cap_change_24h", 0)
    signals.append({
        "name": "Market Momentum",
        "value": f"{mcap_change:+.1f}% 24h",
        "score": 50 + mcap_change * 10,  # Scale to 0-100
        "bias": "BULL" if mcap_change > 2 else "BEAR" if mcap_change < -2 else "NEUTRAL",
    })

    # Signal 5: Altcoin strength (non-BTC/ETH market health indicator)
    altcoin_tokens = [t for t in tokens if t.get("symbol") not in ("BTC", "ETH") and t.get("sector") != "Stable"]
    if altcoin_tokens:
        alt_avg = sum(t.get("change_24h", 0) for t in altcoin_tokens[:50]) / min(len(altcoin_tokens), 50)
        signals.append({
            "name": "Altcoin Strength",
            "value": f"{alt_avg:+.1f}% avg (top 50)",
            "score": 50 + alt_avg * 5,
            "bias": "BULL" if alt_avg > 3 else "BEAR" if alt_avg < -3 else "NEUTRAL",
        })

    # Composite regime
    bull = sum(1 for s in signals if s["bias"] == "BULL")
    bear = sum(1 for s in signals if s["bias"] == "BEAR")
    total = len(signals)

    if bull >= 3:
        regime = "BULL"
        confidence = min(0.95, 0.6 + (bull / total) * 0.35)
    elif bear >= 3:
        regime = "BEAR"
        confidence = min(0.95, 0.6 + (bear / total) * 0.35)
    else:
        regime = "SIDEWAYS"
        confidence = 0.5

    # Hedge sizing adjustment based on regime
    hedge_multiplier = {"BULL": 0.8, "BEAR": 1.25, "SIDEWAYS": 1.0}[regime]

    return {
        "regime": regime,
        "confidence": round(confidence, 2),
        "hedge_multiplier": hedge_multiplier,
        "interpretation": {
            "BULL": "Bullish regime — market absorbs unlocks better. Reduce hedge sizing by 20%.",
            "BEAR": "Bearish regime — unlock dumps amplified. Increase hedge sizing by 25%.",
            "SIDEWAYS": "Neutral regime — standard hedge sizing applies.",
        }[regime],
        "signals": signals,
    }


def _scan_volume_anomalies(tokens: list) -> List[Dict]:
    """Detect tokens with abnormal volume — possible pre-unlock positioning or whale activity"""
    anomalies = []
    for t in tokens:
        vol_ratio = t.get("volume_to_mcap", 0)
        if vol_ratio > 12:  # >12% volume/mcap is unusual
            severity = "CRITICAL" if vol_ratio > 30 else "HIGH" if vol_ratio > 20 else "MEDIUM"
            anomalies.append({
                "symbol": t.get("symbol"),
                "name": t.get("name"),
                "volume_24h": t.get("volume_24h"),
                "volume_to_mcap": vol_ratio,
                "change_24h": t.get("change_24h"),
                "sector": t.get("sector"),
                "severity": severity,
                "signal": f"Volume {vol_ratio:.0f}% of market cap — unusual activity detected",
            })
    anomalies.sort(key=lambda x: x["volume_to_mcap"], reverse=True)
    return anomalies[:20]


# ═══════════════════════════════════════════════════════════════════════
# ANALYTICS: Portfolio-Manager-Grade Computations
# ═══════════════════════════════════════════════════════════════════════

def compute_sector_heatmap(tokens: list) -> Dict:
    """
    Sector performance heatmap — like a Bloomberg sector rotation analysis.
    Shows which sectors are hot/cold across different timeframes.
    """
    sectors = {}
    for t in tokens:
        s = t.get("sector", "Other")
        if s not in sectors:
            sectors[s] = {"1h": [], "24h": [], "7d": [], "30d": []}
        sectors[s]["1h"].append(t.get("change_1h", 0))
        sectors[s]["24h"].append(t.get("change_24h", 0))
        sectors[s]["7d"].append(t.get("change_7d", 0))
        sectors[s]["30d"].append(t.get("change_30d", 0))

    heatmap = {}
    for s, data in sectors.items():
        heatmap[s] = {
            "avg_1h": round(sum(data["1h"]) / len(data["1h"]), 2) if data["1h"] else 0,
            "avg_24h": round(sum(data["24h"]) / len(data["24h"]), 2) if data["24h"] else 0,
            "avg_7d": round(sum(data["7d"]) / len(data["7d"]), 2) if data["7d"] else 0,
            "avg_30d": round(sum(data["30d"]) / len(data["30d"]), 2) if data["30d"] else 0,
            "token_count": len(data["24h"]),
            "color": SECTOR_COLORS.get(s, "#64748b"),
        }
    return heatmap


def compute_correlation_risk(tokens: list) -> Dict:
    """
    Simple correlation analysis — when one token dumps, how much do correlated tokens move?
    Based on sector co-movement.
    """
    # Group sparkline data by sector
    sector_sparklines = {}
    for t in tokens:
        s = t.get("sector", "Other")
        sparkline = t.get("sparkline_7d", [])
        if sparkline and len(sparkline) > 10:
            if s not in sector_sparklines:
                sector_sparklines[s] = []
            sector_sparklines[s].append(sparkline)

    # Compute intra-sector correlation (simplified)
    sector_correlation = {}
    for s, sparklines in sector_sparklines.items():
        if len(sparklines) >= 2:
            # Use simple price direction agreement as proxy for correlation
            agreements = 0
            total = 0
            for i in range(1, min(len(sparklines[0]), 50)):
                directions = [1 if sl[i] > sl[i-1] else -1 for sl in sparklines if len(sl) > i]
                if len(directions) >= 2:
                    # How many agree with the majority direction
                    majority = sum(directions)
                    agreements += abs(majority) / len(directions)
                    total += 1
            correlation = agreements / total if total > 0 else 0.5
            sector_correlation[s] = round(correlation, 2)

    return {
        "sector_correlation": sector_correlation,
        "interpretation": "High correlation (>0.7) means sector-wide contagion risk — if one token dumps, others likely follow",
    }
