"""
Multi-Event Intelligence API
═════════════════════════════
Unified endpoint for all 8 event types detected by the Event Engine.
Powers the Event Intelligence dashboard tab in the frontend.
"""
from fastapi import APIRouter, Query
from typing import Optional, List
from app.services.event_engine import (
    get_all_events,
    get_event_intelligence_summary,
    fetch_macro_indicators,
    fetch_stablecoin_flows,
    fetch_whale_movements,
    fetch_gecko_terminal_trending,
    fetch_defi_yields,
    fetch_bridge_flows,
    fetch_liquidation_data,
    fetch_crypto_news,
)

router = APIRouter()


@router.get("/stream")
async def get_event_stream(
    types: Optional[str] = Query(
        default=None,
        description="Comma-separated event types to filter. Options: dex_volume_spike, macro_event, whale_movement, stablecoin_flow, liquidation_cascade, regulatory_news, governance_proposal"
    ),
    min_severity: Optional[int] = Query(default=0, ge=0, le=100),
):
    """
    Full event stream — all detected events sorted by severity.
    Use `types` to filter (e.g., ?types=whale_movement,liquidation_cascade).
    Use `min_severity` to set a floor (0-100).
    """
    include_types = types.split(",") if types else None
    events = await get_all_events(include_types=include_types)

    # Apply severity filter
    if min_severity > 0:
        events["events"] = [
            e for e in events.get("events", [])
            if e.get("severity_score", 0) >= min_severity
        ]
        events["total_events"] = len(events["events"])

    return events


@router.get("/summary")
async def get_intelligence_summary():
    """
    High-level intelligence summary for the dashboard.
    Returns threat level, top alerts, macro snapshot, stablecoin data,
    DeFi yields, bridge activity, and DEX trends — all in one call.
    """
    return await get_event_intelligence_summary()


@router.get("/macro")
async def get_macro_data():
    """
    Macroeconomic indicators: Fed funds rate, CPI, Treasury yields, S&P 500.
    From Alpha Vantage — updates hourly.
    """
    return await fetch_macro_indicators()


@router.get("/whales")
async def get_whale_data():
    """
    Whale movement tracker — large ETH transfers to/from exchanges.
    From Etherscan — indicates potential sell pressure or accumulation.
    """
    movements = await fetch_whale_movements()
    deposit_vol = sum(w["value_eth"] for w in movements if w.get("direction") == "exchange_deposit")
    withdraw_vol = sum(w["value_eth"] for w in movements if w.get("direction") == "exchange_withdrawal")

    return {
        "movements": movements,
        "summary": {
            "total_transactions": len(movements),
            "deposit_volume_eth": deposit_vol,
            "withdrawal_volume_eth": withdraw_vol,
            "net_flow": round(deposit_vol - withdraw_vol, 2),
            "flow_direction": "exchange_inflow" if deposit_vol > withdraw_vol else "exchange_outflow",
        },
    }


@router.get("/stablecoins")
async def get_stablecoin_data():
    """
    Stablecoin supply tracker — net minting/burning across major stablecoins.
    From DeFiLlama — capital flow indicator.
    """
    return await fetch_stablecoin_flows()


@router.get("/dex")
async def get_dex_data():
    """
    DEX pool analytics — trending pools, volume spikes, new pool launches.
    From GeckoTerminal (1800+ DEXes, free, no key).
    """
    return await fetch_gecko_terminal_trending()


@router.get("/yields")
async def get_yield_data():
    """
    Top DeFi yields across protocols — shows where capital is flowing.
    From DeFiLlama Yields API (pools with >$1M TVL).
    """
    yields = await fetch_defi_yields()
    return {"pools": yields, "count": len(yields)}


@router.get("/bridges")
async def get_bridge_data():
    """
    Cross-chain bridge volumes — capital migration between chains.
    From DeFiLlama Bridges API.
    """
    bridges = await fetch_bridge_flows()
    return {"bridges": bridges, "count": len(bridges)}


@router.get("/liquidations")
async def get_liquidation_data_endpoint():
    """
    Lending protocol health — TVL changes in lending protocols.
    Declining TVL signals liquidation activity and forced selling.
    """
    return await fetch_liquidation_data()


@router.get("/news")
async def get_news():
    """
    Crypto news feed with regulatory/governance classification.
    From MarketAux with CoinPaprika market-mover fallback.
    """
    articles = await fetch_crypto_news()
    regulatory = [a for a in articles if a.get("category") == "regulatory"]
    governance = [a for a in articles if a.get("category") == "governance"]

    return {
        "articles": articles,
        "total": len(articles),
        "regulatory_count": len(regulatory),
        "governance_count": len(governance),
    }
