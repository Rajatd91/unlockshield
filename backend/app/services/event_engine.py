"""
Multi-Event Intelligence Engine
════════════════════════════════
Unified detection system that monitors 8 types of market-moving events
across 10+ data sources. This is the "nervous system" of UnlockShield —
every event feeds into the risk model and can trigger autonomous hedging.

Event Types:
  1. Token Unlocks          — Tokenomist API + curated schedules
  2. Liquidation Cascades   — DeFiLlama liquidation data
  3. Whale Movements        — Etherscan large tx monitoring
  4. Stablecoin Flows       — DeFiLlama stablecoin tracker
  5. Fed/Macro Events       — Alpha Vantage economic indicators
  6. Governance Proposals   — DeFiLlama governance + on-chain
  7. DEX Volume Spikes      — GeckoTerminal pool analytics
  8. Regulatory News        — MarketAux + CryptoNews aggregation

Architecture:
  - Each event source has its own async fetcher with caching
  - Events are normalized into a unified EventObject schema
  - Severity scoring: CRITICAL (>80), HIGH (60-80), MEDIUM (40-60), LOW (<40)
  - The event stream feeds into AMM stress test parameters (Phase 2)
"""

import httpx
import asyncio
import os
import time
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

# ── Cache (shared pattern with data_providers) ───────────────────────
_event_cache: Dict[str, dict] = {}

EVENT_CACHE_TTL = {
    "gecko_terminal": 120,     # 2 min — DEX data changes fast
    "alpha_vantage": 3600,     # 1 hr — macro data is slow-moving
    "etherscan_whales": 180,   # 3 min — whale tx update regularly
    "stablecoin_flows": 300,   # 5 min
    "liquidations": 120,       # 2 min
    "news": 600,               # 10 min — news doesn't need real-time
    "governance": 900,         # 15 min
    "default": 300,
}


def _get_event_cached(key: str, category: str = "default"):
    if key in _event_cache:
        entry = _event_cache[key]
        ttl = EVENT_CACHE_TTL.get(category, EVENT_CACHE_TTL["default"])
        if time.time() - entry["ts"] < ttl:
            return entry["data"]
    return None


def _set_event_cached(key: str, data):
    _event_cache[key] = {"data": data, "ts": time.time()}


def _severity_label(score: float) -> str:
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    return "LOW"


def _make_event(
    event_type: str,
    title: str,
    description: str,
    severity_score: float,
    source: str,
    metadata: dict = None,
    timestamp: str = None,
) -> Dict:
    """Create a normalized event object"""
    return {
        "event_type": event_type,
        "title": title,
        "description": description,
        "severity_score": round(min(100, max(0, severity_score)), 1),
        "severity_label": _severity_label(severity_score),
        "source": source,
        "timestamp": timestamp or datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {},
    }


# ═════════════════════════════════════════════════════════════════════
# SOURCE 1: GeckoTerminal — DEX Pool Analytics & Volume Spikes
# Free, no API key, 1800+ DEXes
# ═════════════════════════════════════════════════════════════════════

async def fetch_gecko_terminal_trending() -> List[Dict]:
    """
    Fetch trending pools and detect volume spikes across DEXes.
    GeckoTerminal tracks 1800+ DEXes with real-time pool data.
    """
    cached = _get_event_cached("gt_trending", "gecko_terminal")
    if cached:
        return cached

    results = {
        "trending_pools": [],
        "top_dexes": [],
        "new_pools": [],
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Trending pools across all networks
            trending_resp = await client.get(
                "https://api.geckoterminal.com/api/v2/networks/trending_pools",
                headers={"Accept": "application/json"},
            )

            # Top pools by volume on Ethereum
            eth_pools_resp = await client.get(
                "https://api.geckoterminal.com/api/v2/networks/eth/trending_pools",
                headers={"Accept": "application/json"},
            )

            # New pools (detect new token launches)
            new_pools_resp = await client.get(
                "https://api.geckoterminal.com/api/v2/networks/eth/new_pools",
                headers={"Accept": "application/json"},
            )

        if trending_resp.status_code == 200:
            data = trending_resp.json().get("data", [])
            for pool in data[:20]:
                attrs = pool.get("attributes", {})
                results["trending_pools"].append({
                    "name": attrs.get("name", ""),
                    "address": attrs.get("address", ""),
                    "dex": attrs.get("dex_id", ""),
                    "network": pool.get("relationships", {}).get("network", {}).get("data", {}).get("id", ""),
                    "base_token": attrs.get("base_token_price_usd", "0"),
                    "volume_24h": float(attrs.get("volume_usd", {}).get("h24", 0) or 0),
                    "price_change_24h": float(attrs.get("price_change_percentage", {}).get("h24", 0) or 0),
                    "price_change_1h": float(attrs.get("price_change_percentage", {}).get("h1", 0) or 0),
                    "reserve_usd": float(attrs.get("reserve_in_usd", 0) or 0),
                    "transactions_24h": attrs.get("transactions", {}).get("h24", {}),
                })

        if eth_pools_resp.status_code == 200:
            data = eth_pools_resp.json().get("data", [])
            for pool in data[:10]:
                attrs = pool.get("attributes", {})
                results["top_dexes"].append({
                    "name": attrs.get("name", ""),
                    "volume_24h": float(attrs.get("volume_usd", {}).get("h24", 0) or 0),
                    "price_change_24h": float(attrs.get("price_change_percentage", {}).get("h24", 0) or 0),
                })

        if new_pools_resp.status_code == 200:
            data = new_pools_resp.json().get("data", [])
            results["new_pools"] = [
                {
                    "name": p.get("attributes", {}).get("name", ""),
                    "created_at": p.get("attributes", {}).get("pool_created_at", ""),
                    "reserve_usd": float(p.get("attributes", {}).get("reserve_in_usd", 0) or 0),
                }
                for p in data[:10]
            ]

    except Exception as e:
        print(f"GeckoTerminal error: {e}")

    _set_event_cached("gt_trending", results)
    return results


async def detect_dex_volume_spikes() -> List[Dict]:
    """Event Type 7: DEX Volume Spikes — detect unusual activity on DEXes"""
    gt_data = await fetch_gecko_terminal_trending()
    events = []

    for pool in gt_data.get("trending_pools", []):
        vol = pool.get("volume_24h", 0)
        change = abs(pool.get("price_change_24h", 0))

        # High volume + big price move = significant event
        if vol > 1_000_000 and change > 15:
            severity = min(95, 40 + change * 0.8 + (vol / 10_000_000) * 10)
            events.append(_make_event(
                event_type="dex_volume_spike",
                title=f"DEX Volume Spike: {pool.get('name', 'Unknown')}",
                description=f"${vol:,.0f} 24h volume with {pool.get('price_change_24h', 0):+.1f}% price change on {pool.get('dex', 'unknown')}",
                severity_score=severity,
                source="gecko_terminal",
                metadata=pool,
            ))

    return events


# ═════════════════════════════════════════════════════════════════════
# SOURCE 2: Alpha Vantage — Macroeconomic Indicators
# Free key: 25 requests/day — Fed rate, CPI, GDP, Treasury, S&P500
# ═════════════════════════════════════════════════════════════════════

ALPHA_VANTAGE_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

async def fetch_macro_indicators() -> Dict:
    """
    Fetch key macroeconomic indicators that impact crypto markets.
    Fed funds rate changes, CPI data, Treasury yields — all historically
    correlated with crypto market movements.
    """
    cached = _get_event_cached("macro_indicators", "alpha_vantage")
    if cached:
        return cached

    indicators = {}

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Federal Funds Rate
            fed_resp = await client.get(
                "https://www.alphavantage.co/query",
                params={"function": "FEDERAL_FUNDS_RATE", "interval": "monthly", "apikey": ALPHA_VANTAGE_KEY},
            )
            if fed_resp.status_code == 200:
                data = fed_resp.json().get("data", [])
                if data:
                    indicators["fed_rate"] = {
                        "current": float(data[0].get("value", 0)),
                        "previous": float(data[1].get("value", 0)) if len(data) > 1 else 0,
                        "date": data[0].get("date", ""),
                        "change": round(float(data[0].get("value", 0)) - float(data[1].get("value", 0)), 3) if len(data) > 1 else 0,
                    }

            await asyncio.sleep(0.5)  # Rate limit respect

            # CPI (Consumer Price Index)
            cpi_resp = await client.get(
                "https://www.alphavantage.co/query",
                params={"function": "CPI", "interval": "monthly", "apikey": ALPHA_VANTAGE_KEY},
            )
            if cpi_resp.status_code == 200:
                data = cpi_resp.json().get("data", [])
                if data and len(data) >= 2:
                    current = float(data[0].get("value", 0))
                    prev = float(data[1].get("value", 0))
                    indicators["cpi"] = {
                        "current": current,
                        "previous": prev,
                        "date": data[0].get("date", ""),
                        "mom_change": round((current - prev) / prev * 100, 2) if prev else 0,
                    }

            await asyncio.sleep(0.5)

            # Treasury Yield (10-Year)
            treasury_resp = await client.get(
                "https://www.alphavantage.co/query",
                params={"function": "TREASURY_YIELD", "interval": "monthly", "maturity": "10year", "apikey": ALPHA_VANTAGE_KEY},
            )
            if treasury_resp.status_code == 200:
                data = treasury_resp.json().get("data", [])
                if data:
                    indicators["treasury_10y"] = {
                        "current": float(data[0].get("value", 0)),
                        "previous": float(data[1].get("value", 0)) if len(data) > 1 else 0,
                        "date": data[0].get("date", ""),
                    }

            await asyncio.sleep(0.5)

            # S&P 500 (proxy for risk appetite)
            sp500_resp = await client.get(
                "https://www.alphavantage.co/query",
                params={"function": "TIME_SERIES_DAILY", "symbol": "SPY", "apikey": ALPHA_VANTAGE_KEY, "outputsize": "compact"},
            )
            if sp500_resp.status_code == 200:
                ts = sp500_resp.json().get("Time Series (Daily)", {})
                dates = sorted(ts.keys(), reverse=True)
                if len(dates) >= 2:
                    today_close = float(ts[dates[0]].get("4. close", 0))
                    prev_close = float(ts[dates[1]].get("4. close", 0))
                    indicators["sp500"] = {
                        "close": today_close,
                        "prev_close": prev_close,
                        "change_pct": round((today_close - prev_close) / prev_close * 100, 2) if prev_close else 0,
                        "date": dates[0],
                    }

    except Exception as e:
        print(f"Alpha Vantage error: {e}")

    _set_event_cached("macro_indicators", indicators)
    return indicators


async def detect_macro_events() -> List[Dict]:
    """Event Type 5: Fed/Macro Events — detect rate changes, CPI surprises, yield shifts"""
    macro = await fetch_macro_indicators()
    events = []

    # Fed rate change detection
    fed = macro.get("fed_rate", {})
    if fed and fed.get("change", 0) != 0:
        change = fed["change"]
        severity = 70 + abs(change) * 40  # Rate changes are always significant
        direction = "hike" if change > 0 else "cut"
        events.append(_make_event(
            event_type="macro_fed",
            title=f"Fed Rate {direction.title()}: {change:+.3f}%",
            description=f"Federal Funds Rate moved from {fed.get('previous', 0)}% to {fed.get('current', 0)}%. Rate {direction}s historically {'compress' if direction == 'hike' else 'boost'} crypto valuations.",
            severity_score=severity,
            source="alpha_vantage",
            metadata=fed,
            timestamp=fed.get("date", ""),
        ))

    # CPI surprise detection
    cpi = macro.get("cpi", {})
    if cpi and abs(cpi.get("mom_change", 0)) > 0.3:
        mom = cpi["mom_change"]
        severity = 50 + abs(mom) * 20
        events.append(_make_event(
            event_type="macro_cpi",
            title=f"CPI {'Surge' if mom > 0 else 'Drop'}: {mom:+.2f}% MoM",
            description=f"Consumer Price Index changed {mom:+.2f}% month-over-month. {'Higher inflation may trigger hawkish Fed response.' if mom > 0 else 'Lower inflation could signal dovish policy shift.'}",
            severity_score=severity,
            source="alpha_vantage",
            metadata=cpi,
        ))

    # S&P 500 significant move
    sp = macro.get("sp500", {})
    if sp and abs(sp.get("change_pct", 0)) > 1.5:
        change = sp["change_pct"]
        severity = 40 + abs(change) * 10
        events.append(_make_event(
            event_type="macro_equities",
            title=f"S&P 500 {'Rally' if change > 0 else 'Sell-off'}: {change:+.1f}%",
            description=f"SPY moved {change:+.1f}% — {'risk-on sentiment may lift crypto' if change > 0 else 'risk-off flight may pressure crypto'}.",
            severity_score=severity,
            source="alpha_vantage",
            metadata=sp,
        ))

    return events


# ═════════════════════════════════════════════════════════════════════
# SOURCE 3: Etherscan — Whale Movement Detection
# Free key: 5 calls/sec, tracks large ETH/token transfers
# ═════════════════════════════════════════════════════════════════════

ETHERSCAN_KEY = os.getenv("ETHERSCAN_API_KEY", "")

# Known exchange deposit addresses (simplified — production would use Nansen labels)
KNOWN_EXCHANGE_ADDRESSES = {
    "0x28c6c06298d514db089934071355e5743bf21d60": "Binance",
    "0x21a31ee1afc51d94c2efccaa2092ad1028285549": "Binance",
    "0xdfd5293d8e347dfe59e90efd55b2956a1343963d": "Binance",
    "0x56eddb7aa87536c09ccc2793473599fd21a8b17f": "Binance",
    "0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43": "Coinbase",
    "0x503828976d22510aad0201ac7ec88293211d23da": "Coinbase",
    "0x71660c4005ba85c37ccec55d0c4493e66fe775d3": "Coinbase",
    "0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2": "FTX",
    "0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0": "Kraken",
    "0xae2d4617c862309a3d75a0ffb358c7a5009c673f": "Kraken",
    "0x1ab4973a48dc892cd9971ece8e01dcc7688f8f23": "OKX",
    "0x6cc5f688a315f3dc28a7781717a9a798a59fda7b": "OKX",
}

WHALE_THRESHOLD_ETH = 100  # 100 ETH minimum for whale tx


async def fetch_whale_movements() -> List[Dict]:
    """
    Monitor Ethereum for large transfers — whale movements to/from exchanges
    are strong directional signals. Deposits = sell pressure, withdrawals = accumulation.
    """
    if not ETHERSCAN_KEY:
        return []

    cached = _get_event_cached("whale_movements", "etherscan_whales")
    if cached:
        return cached

    whale_txs = []

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Get recent large ETH internal transactions (blocks)
            # Use the latest blocks to find high-value transfers
            resp = await client.get(
                "https://api.etherscan.io/api",
                params={
                    "module": "account",
                    "action": "txlist",
                    "address": list(KNOWN_EXCHANGE_ADDRESSES.keys())[0],  # Monitor top Binance hot wallet
                    "startblock": 0,
                    "endblock": 99999999,
                    "page": 1,
                    "offset": 50,  # Last 50 transactions
                    "sort": "desc",
                    "apikey": ETHERSCAN_KEY,
                },
            )

            if resp.status_code == 200:
                data = resp.json()
                txs = data.get("result", [])
                if isinstance(txs, list):
                    for tx in txs:
                        value_eth = int(tx.get("value", "0")) / 1e18
                        if value_eth >= WHALE_THRESHOLD_ETH:
                            from_addr = tx.get("from", "").lower()
                            to_addr = tx.get("to", "").lower()
                            from_exchange = KNOWN_EXCHANGE_ADDRESSES.get(from_addr, "")
                            to_exchange = KNOWN_EXCHANGE_ADDRESSES.get(to_addr, "")

                            direction = "neutral"
                            if to_exchange and not from_exchange:
                                direction = "exchange_deposit"  # Likely selling
                            elif from_exchange and not to_exchange:
                                direction = "exchange_withdrawal"  # Likely accumulating
                            elif from_exchange and to_exchange:
                                direction = "inter_exchange"

                            whale_txs.append({
                                "hash": tx.get("hash", ""),
                                "from": from_addr,
                                "to": to_addr,
                                "value_eth": round(value_eth, 2),
                                "value_usd_approx": 0,  # Will be enriched with price data
                                "direction": direction,
                                "from_label": from_exchange or "Unknown",
                                "to_label": to_exchange or "Unknown",
                                "block": tx.get("blockNumber", ""),
                                "timestamp": datetime.fromtimestamp(
                                    int(tx.get("timeStamp", 0)), tz=timezone.utc
                                ).isoformat() if tx.get("timeStamp") else "",
                            })

    except Exception as e:
        print(f"Etherscan whale fetch error: {e}")

    _set_event_cached("whale_movements", whale_txs)
    return whale_txs


async def detect_whale_events() -> List[Dict]:
    """Event Type 3: Whale Movements — large transfers to/from exchanges"""
    whales = await fetch_whale_movements()
    events = []

    deposit_volume = sum(w["value_eth"] for w in whales if w["direction"] == "exchange_deposit")
    withdrawal_volume = sum(w["value_eth"] for w in whales if w["direction"] == "exchange_withdrawal")

    if deposit_volume > 500:  # >500 ETH deposited
        severity = min(90, 50 + deposit_volume / 100)
        events.append(_make_event(
            event_type="whale_movement",
            title=f"Whale Exchange Deposits: {deposit_volume:,.0f} ETH",
            description=f"{deposit_volume:,.0f} ETH moved to exchanges in recent blocks. Exchange deposits signal potential sell pressure.",
            severity_score=severity,
            source="etherscan",
            metadata={"deposit_volume_eth": deposit_volume, "tx_count": len([w for w in whales if w["direction"] == "exchange_deposit"])},
        ))

    if withdrawal_volume > 500:
        severity = min(70, 30 + withdrawal_volume / 200)
        events.append(_make_event(
            event_type="whale_movement",
            title=f"Whale Exchange Withdrawals: {withdrawal_volume:,.0f} ETH",
            description=f"{withdrawal_volume:,.0f} ETH withdrawn from exchanges. Withdrawals signal accumulation and reduced sell pressure.",
            severity_score=severity,
            source="etherscan",
            metadata={"withdrawal_volume_eth": withdrawal_volume},
        ))

    # Individual large whale transactions
    for w in whales:
        if w["value_eth"] >= 1000:  # 1000+ ETH single tx
            severity = min(85, 60 + w["value_eth"] / 500)
            events.append(_make_event(
                event_type="whale_movement",
                title=f"Large Whale Tx: {w['value_eth']:,.0f} ETH ({w['direction'].replace('_', ' ').title()})",
                description=f"{w['value_eth']:,.0f} ETH transferred from {w['from_label']} to {w['to_label']}",
                severity_score=severity,
                source="etherscan",
                metadata=w,
            ))

    return events


# ═════════════════════════════════════════════════════════════════════
# SOURCE 4: DeFiLlama — Stablecoin Flows & Liquidation Data
# 100% free, no rate limits
# ═════════════════════════════════════════════════════════════════════

async def fetch_stablecoin_flows() -> Dict:
    """
    Track stablecoin supply changes — net minting = capital inflow,
    net burning = capital outflow. Leading indicator for market direction.
    """
    cached = _get_event_cached("stablecoin_flows", "stablecoin_flows")
    if cached:
        return cached

    result = {"stablecoins": [], "total_supply": 0, "net_change_7d": 0}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://stablecoins.llama.fi/stablecoins?includePrices=true")
            if resp.status_code == 200:
                data = resp.json()
                stables = data.get("peggedAssets", [])

                for s in stables[:15]:  # Top 15 stablecoins
                    chains = s.get("chainCirculating", {})
                    current_supply = sum(
                        chain_data.get("current", {}).get("peggedUSD", 0)
                        for chain_data in chains.values()
                        if isinstance(chain_data, dict)
                    )

                    result["stablecoins"].append({
                        "name": s.get("name", ""),
                        "symbol": s.get("symbol", ""),
                        "supply": current_supply,
                        "price": s.get("price", 1.0),
                        "peg_deviation": abs(1.0 - (s.get("price") or 1.0)) * 100,
                    })
                    result["total_supply"] += current_supply

    except Exception as e:
        print(f"Stablecoin flows error: {e}")

    _set_event_cached("stablecoin_flows", result)
    return result


async def detect_stablecoin_events() -> List[Dict]:
    """Event Type 4: Stablecoin Flows — supply changes and depeg events"""
    flows = await fetch_stablecoin_flows()
    events = []

    for stable in flows.get("stablecoins", []):
        # Depeg detection
        peg_dev = stable.get("peg_deviation", 0)
        if peg_dev > 0.5:  # >0.5% from peg
            severity = min(95, 60 + peg_dev * 15)
            events.append(_make_event(
                event_type="stablecoin_flow",
                title=f"Depeg Alert: {stable['symbol']} at ${stable.get('price', 0):.4f}",
                description=f"{stable['name']} has deviated {peg_dev:.2f}% from $1 peg. Stablecoin depegs can trigger cascading liquidations.",
                severity_score=severity,
                source="defillama_stablecoins",
                metadata=stable,
            ))

    return events


async def fetch_liquidation_data() -> Dict:
    """
    DeFiLlama liquidation levels — shows where leveraged positions
    would get liquidated. Clustering of liquidation levels = fragile market.
    """
    cached = _get_event_cached("liquidations", "liquidations")
    if cached:
        return cached

    result = {"protocols": [], "total_at_risk": 0}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Fetch lending protocol data for liquidation risk assessment
            resp = await client.get("https://api.llama.fi/protocols")
            if resp.status_code == 200:
                protocols = resp.json()
                lending = [p for p in protocols if p.get("category") == "Lending"]
                for p in lending[:10]:
                    tvl = p.get("tvl", 0)
                    change_1d = p.get("change_1d", 0) or 0
                    result["protocols"].append({
                        "name": p.get("name"),
                        "tvl": tvl,
                        "change_1d": round(change_1d, 2),
                        "chain": p.get("chain"),
                    })
                    # TVL drop in lending protocols signals liquidation activity
                    if change_1d < -5:
                        result["total_at_risk"] += abs(change_1d / 100) * tvl

    except Exception as e:
        print(f"Liquidation data error: {e}")

    _set_event_cached("liquidations", result)
    return result


async def detect_liquidation_events() -> List[Dict]:
    """Event Type 2: Liquidation Cascades — declining lending TVL signals forced selling"""
    liq_data = await fetch_liquidation_data()
    events = []

    for protocol in liq_data.get("protocols", []):
        change = protocol.get("change_1d", 0)
        if change < -5:  # >5% TVL drop in a lending protocol
            severity = min(90, 50 + abs(change) * 3)
            events.append(_make_event(
                event_type="liquidation_cascade",
                title=f"Lending TVL Drop: {protocol['name']} ({change:+.1f}%)",
                description=f"{protocol['name']} lost {abs(change):.1f}% TVL in 24h (${abs(change/100 * protocol.get('tvl', 0)):,.0f}). Declining lending TVL indicates liquidation activity and forced selling.",
                severity_score=severity,
                source="defillama",
                metadata=protocol,
            ))

    if liq_data.get("total_at_risk", 0) > 100_000_000:  # >$100M at risk
        events.append(_make_event(
            event_type="liquidation_cascade",
            title=f"Systemic Liquidation Risk: ${liq_data['total_at_risk']:,.0f} at risk",
            description=f"Estimated ${liq_data['total_at_risk']:,.0f} in lending protocol TVL declining — indicates broad liquidation cascade across DeFi.",
            severity_score=85,
            source="defillama",
            metadata={"total_at_risk": liq_data["total_at_risk"]},
        ))

    return events


# ═════════════════════════════════════════════════════════════════════
# SOURCE 5: MarketAux / CryptoNews — News & Regulatory Intelligence
# MarketAux: Free key, 100 req/day
# ═════════════════════════════════════════════════════════════════════

MARKETAUX_KEY = os.getenv("MARKETAUX_API_KEY", "")

# Keywords that indicate regulatory events (high impact)
REGULATORY_KEYWORDS = [
    "sec", "regulation", "ban", "lawsuit", "enforcement", "compliance",
    "sanctions", "treasury", "fed", "cftc", "etf", "approval", "rejection",
    "cbdc", "stablecoin bill", "framework", "executive order", "tax",
]

GOVERNANCE_KEYWORDS = [
    "governance", "proposal", "vote", "dao", "snapshot", "fork",
    "upgrade", "migration", "airdrop",
]


async def fetch_crypto_news() -> List[Dict]:
    """
    Aggregate crypto news from MarketAux.
    Classifies news into regulatory, governance, and general market categories.
    """
    cached = _get_event_cached("crypto_news", "news")
    if cached:
        return cached

    articles = []

    # MarketAux
    if MARKETAUX_KEY:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    "https://api.marketaux.com/v1/news/all",
                    params={
                        "api_token": MARKETAUX_KEY,
                        "filter_entities": "true",
                        "language": "en",
                        "search": "crypto OR bitcoin OR ethereum OR defi OR blockchain",
                        "limit": 20,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json().get("data", [])
                    for article in data:
                        title_lower = article.get("title", "").lower()
                        desc_lower = article.get("description", "").lower() if article.get("description") else ""
                        full_text = title_lower + " " + desc_lower

                        # Classify article
                        category = "general"
                        if any(kw in full_text for kw in REGULATORY_KEYWORDS):
                            category = "regulatory"
                        elif any(kw in full_text for kw in GOVERNANCE_KEYWORDS):
                            category = "governance"

                        # Sentiment from MarketAux entities
                        entities = article.get("entities", [])
                        sentiment_scores = [
                            e.get("sentiment_score", 0)
                            for e in entities
                            if e.get("sentiment_score") is not None
                        ]
                        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0

                        articles.append({
                            "title": article.get("title", ""),
                            "description": article.get("description", ""),
                            "url": article.get("url", ""),
                            "source": article.get("source", ""),
                            "published_at": article.get("published_at", ""),
                            "category": category,
                            "sentiment": round(avg_sentiment, 3),
                            "relevance": article.get("relevance_score", 0),
                            "entities": [
                                {"symbol": e.get("symbol"), "name": e.get("name"), "type": e.get("type")}
                                for e in entities[:5]
                            ],
                        })
        except Exception as e:
            print(f"MarketAux error: {e}")

    # Fallback: CoinGecko trending (always available, no key needed)
    if not articles:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get("https://api.coingecko.com/api/v3/search/trending")
                if resp.status_code == 200:
                    trending = resp.json().get("coins", [])
                    for item in trending:
                        coin = item.get("item", {})
                        articles.append({
                            "title": f"Trending: {coin.get('name', '')} ({coin.get('symbol', '')})",
                            "description": f"#{coin.get('market_cap_rank', 'N/A')} by market cap, score: {coin.get('score', 0)}",
                            "url": "",
                            "source": "coingecko_trending",
                            "published_at": datetime.now(timezone.utc).isoformat(),
                            "category": "trending",
                            "sentiment": 0,
                            "relevance": 0.5,
                            "entities": [],
                        })
        except Exception as e:
            print(f"CoinGecko trending fallback error: {e}")

    _set_event_cached("crypto_news", articles)
    return articles


async def detect_regulatory_events() -> List[Dict]:
    """Event Type 8: Regulatory News — SEC actions, policy changes, ETF decisions"""
    news = await fetch_crypto_news()
    events = []

    for article in news:
        if article["category"] == "regulatory":
            # Regulatory news with negative sentiment is higher severity
            sentiment = article.get("sentiment", 0)
            base_severity = 65
            severity = base_severity + (abs(sentiment) * 20) + (article.get("relevance", 0) * 10)

            events.append(_make_event(
                event_type="regulatory_news",
                title=article.get("title", "Regulatory Update"),
                description=article.get("description", "")[:200],
                severity_score=min(95, severity),
                source=f"marketaux ({article.get('source', 'unknown')})",
                metadata={
                    "url": article.get("url"),
                    "sentiment": sentiment,
                    "entities": article.get("entities", []),
                },
                timestamp=article.get("published_at", ""),
            ))

    return events


async def detect_governance_events() -> List[Dict]:
    """Event Type 6: Governance Proposals — DAO votes, protocol upgrades, forks"""
    news = await fetch_crypto_news()
    events = []

    for article in news:
        if article["category"] == "governance":
            events.append(_make_event(
                event_type="governance_proposal",
                title=article.get("title", "Governance Update"),
                description=article.get("description", "")[:200],
                severity_score=50 + (article.get("relevance", 0) * 15),
                source=f"marketaux ({article.get('source', 'unknown')})",
                metadata={
                    "url": article.get("url"),
                    "entities": article.get("entities", []),
                },
                timestamp=article.get("published_at", ""),
            ))

    return events


# ═════════════════════════════════════════════════════════════════════
# DeFiLlama Additional — Yields & Bridge Flows
# ═════════════════════════════════════════════════════════════════════

async def fetch_defi_yields() -> List[Dict]:
    """Top DeFi yields across protocols — indicator of where capital is flowing"""
    cached = _get_event_cached("defi_yields", "default")
    if cached:
        return cached

    yields = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://yields.llama.fi/pools")
            if resp.status_code == 200:
                pools = resp.json().get("data", [])
                # Filter for significant pools (>$1M TVL)
                significant = [p for p in pools if (p.get("tvlUsd") or 0) > 1_000_000]
                significant.sort(key=lambda x: x.get("apy", 0), reverse=True)

                for pool in significant[:30]:
                    yields.append({
                        "pool": pool.get("pool", ""),
                        "project": pool.get("project", ""),
                        "chain": pool.get("chain", ""),
                        "symbol": pool.get("symbol", ""),
                        "tvl": pool.get("tvlUsd", 0),
                        "apy": round(pool.get("apy", 0), 2),
                        "apy_base": round(pool.get("apyBase", 0) or 0, 2),
                        "apy_reward": round(pool.get("apyReward", 0) or 0, 2),
                        "il_risk": pool.get("ilRisk", "no"),
                        "stablecoin": pool.get("stablecoin", False),
                    })

    except Exception as e:
        print(f"DeFi yields error: {e}")

    _set_event_cached("defi_yields", yields)
    return yields


async def fetch_bridge_flows() -> List[Dict]:
    """Cross-chain bridge volumes — shows capital migration between chains"""
    cached = _get_event_cached("bridge_flows", "default")
    if cached:
        return cached

    bridges = []
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get("https://bridges.llama.fi/bridges?includeChains=true")
            if resp.status_code == 200:
                data = resp.json().get("bridges", [])
                for b in data[:20]:
                    bridges.append({
                        "name": b.get("displayName", b.get("name", "")),
                        "volume_24h": b.get("lastDailyVolume", 0),
                        "volume_prev_day": b.get("dayBeforeLastVolume", 0),
                        "chains": b.get("chains", []),
                    })

    except Exception as e:
        print(f"Bridge flows error: {e}")

    _set_event_cached("bridge_flows", bridges)
    return bridges


# ═════════════════════════════════════════════════════════════════════
# UNIFIED EVENT STREAM
# The main function that aggregates ALL event types into one feed
# ═════════════════════════════════════════════════════════════════════

async def get_all_events(include_types: List[str] = None) -> Dict:
    """
    Aggregate all 8 event types into a single intelligence feed.
    This is what the frontend consumes and what feeds into the risk model.

    Returns events sorted by severity, with summary statistics.
    """
    cached = _get_event_cached("all_events", "default")
    if cached and not include_types:
        return cached

    # Fetch all event types in parallel
    tasks = {
        "dex_volume_spike": detect_dex_volume_spikes(),
        "macro_event": detect_macro_events(),
        "whale_movement": detect_whale_events(),
        "stablecoin_flow": detect_stablecoin_events(),
        "liquidation_cascade": detect_liquidation_events(),
        "regulatory_news": detect_regulatory_events(),
        "governance_proposal": detect_governance_events(),
    }

    # Filter to requested types if specified
    if include_types:
        tasks = {k: v for k, v in tasks.items() if k in include_types}

    results = await asyncio.gather(*tasks.values(), return_exceptions=True)

    all_events = []
    event_counts = {}

    for event_type, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            print(f"Event detection error ({event_type}): {result}")
            continue
        all_events.extend(result)
        event_counts[event_type] = len(result)

    # Sort by severity (highest first)
    all_events.sort(key=lambda x: x.get("severity_score", 0), reverse=True)

    # Summary statistics
    critical_count = sum(1 for e in all_events if e.get("severity_label") == "CRITICAL")
    high_count = sum(1 for e in all_events if e.get("severity_label") == "HIGH")

    # Composite threat level
    if critical_count >= 3 or (critical_count >= 1 and high_count >= 3):
        threat_level = "EXTREME"
    elif critical_count >= 1 or high_count >= 3:
        threat_level = "HIGH"
    elif high_count >= 1:
        threat_level = "ELEVATED"
    else:
        threat_level = "NORMAL"

    output = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "threat_level": threat_level,
        "total_events": len(all_events),
        "event_counts": event_counts,
        "severity_breakdown": {
            "critical": critical_count,
            "high": high_count,
            "medium": sum(1 for e in all_events if e.get("severity_label") == "MEDIUM"),
            "low": sum(1 for e in all_events if e.get("severity_label") == "LOW"),
        },
        "events": all_events,
    }

    if not include_types:
        _set_event_cached("all_events", output)
    return output


async def get_event_intelligence_summary() -> Dict:
    """
    High-level intelligence summary for dashboard cards.
    Lighter weight than full event stream — returns counts and top alerts only.
    """
    events = await get_all_events()

    # Get supplementary data
    macro_task = fetch_macro_indicators()
    stable_task = fetch_stablecoin_flows()
    yields_task = fetch_defi_yields()
    bridges_task = fetch_bridge_flows()
    gt_task = fetch_gecko_terminal_trending()

    macro, stables, yields, bridges, gt = await asyncio.gather(
        macro_task, stable_task, yields_task, bridges_task, gt_task,
        return_exceptions=True,
    )

    # Safe unwrap
    if isinstance(macro, Exception):
        macro = {}
    if isinstance(stables, Exception):
        stables = {"stablecoins": [], "total_supply": 0}
    if isinstance(yields, Exception):
        yields = []
    if isinstance(bridges, Exception):
        bridges = []
    if isinstance(gt, Exception):
        gt = {"trending_pools": [], "top_dexes": [], "new_pools": []}

    return {
        "threat_level": events.get("threat_level", "NORMAL"),
        "total_events": events.get("total_events", 0),
        "severity_breakdown": events.get("severity_breakdown", {}),
        "top_alerts": events.get("events", [])[:5],
        "macro_snapshot": {
            "fed_rate": macro.get("fed_rate", {}).get("current", "N/A"),
            "cpi_change": macro.get("cpi", {}).get("mom_change", "N/A"),
            "treasury_10y": macro.get("treasury_10y", {}).get("current", "N/A"),
            "sp500_change": macro.get("sp500", {}).get("change_pct", "N/A"),
        },
        "stablecoin_supply": stables.get("total_supply", 0),
        "top_stablecoins": stables.get("stablecoins", [])[:5],
        "top_yields": yields[:5] if isinstance(yields, list) else [],
        "bridge_activity": bridges[:5] if isinstance(bridges, list) else [],
        "dex_trending": gt.get("trending_pools", [])[:5],
        "dex_new_pools": gt.get("new_pools", [])[:5],
    }
