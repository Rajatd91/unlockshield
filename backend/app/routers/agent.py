"""
Autonomous Agent Controller
═══════════════════════════
The core brain — scans markets, analyzes risk, executes hedges, attests on-chain.
One API call triggers the entire autonomous pipeline.
"""
import os
from fastapi import APIRouter
from app.services.unlock_fetcher import fetch_upcoming_unlocks
from app.services.risk_analyzer import analyze_unlock_risk
from app.services.hedge_executor import (
    execute_hedge, get_hedge_history, get_total_value_protected, get_strategy_breakdown
)
from app.services.kite_attestation import kite_service
from app.services.market_data import fetch_market_overview

router = APIRouter()


@router.post("/scan")
async def run_agent_scan(limit: int = 10, days_ahead: int = 30):
    """
    Run a full autonomous agent scan cycle:
      1. Fetch real-time market regime (BULL/BEAR/SIDEWAYS)
      2. Fetch upcoming token unlocks (limited for speed)
      3. AI-analyze each unlock with market context
      4. Execute hedge strategies for high-risk events
      5. Attest predictions + actions on Kite AI blockchain

    Defaults to top 10 imminent unlocks (next 30 days) so scans
    complete in seconds. Pass ?limit=40&days_ahead=60 for a deep scan.
    """
    # Step 0: Get market context for regime-adjusted analysis
    market_context = None
    try:
        market_context = await fetch_market_overview()
    except Exception as e:
        print(f"Market context fetch failed (continuing without): {e}")

    # Step 1: Fetch upcoming unlocks (limit for performance)
    unlocks = await fetch_upcoming_unlocks(days_ahead=days_ahead)
    # Sort by supply impact (highest first) then by date (soonest first)
    unlocks = sorted(
        unlocks,
        key=lambda u: (-(u.total_supply_percent or 0), u.unlock_date),
    )[:max(1, min(int(limit), 40))]
    scan_results = []

    for unlock in unlocks:
        # Step 2: AI risk analysis with market context
        analysis = await analyze_unlock_risk(unlock, market_context)

        # Step 3: On-chain attestation of prediction
        attestation = await kite_service.attest_prediction(
            token_symbol=unlock.token_symbol,
            unlock_amount_usd=unlock.unlock_amount_usd,
            unlock_timestamp=int(unlock.unlock_date.timestamp()),
            risk_score=analysis.risk_score,
            reasoning=analysis.reasoning,
            predicted_impact=analysis.predicted_price_impact
        )

        # Step 4: Execute hedge if risk warrants action
        hedge_result = None
        if analysis.risk_score >= 35:  # Lower threshold = more protective
            hedge_result = await execute_hedge(analysis, portfolio_value=10000)

        scan_results.append({
            "token": unlock.token_symbol,
            "token_name": unlock.token_name,
            "unlock_date": unlock.unlock_date.isoformat(),
            "unlock_amount_usd": unlock.unlock_amount_usd,
            "supply_pct": unlock.total_supply_percent,
            "risk_score": analysis.risk_score,
            "predicted_impact": f"{analysis.predicted_price_impact}%",
            "recommended_action": analysis.recommended_action,
            "reasoning": analysis.reasoning,
            "factor_scores": analysis.factor_scores,
            "key_risks": analysis.key_risks,
            "similar_event": analysis.similar_event,
            "confidence": analysis.confidence,
            "attestation": {
                "tx_hash": attestation.tx_hash,
                "explorer_url": attestation.explorer_url,
                "prediction_id": attestation.prediction_id
            },
            "hedge": hedge_result,
        })

    # Sort by risk (highest first)
    scan_results.sort(key=lambda x: x["risk_score"], reverse=True)

    regime = market_context.get("market_regime", {}) if market_context else {}

    return {
        "scan_complete": True,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat(),
        "market_regime": regime.get("regime", "UNKNOWN"),
        "hedge_multiplier": regime.get("hedge_multiplier", 1.0),
        "tokens_scanned": len(unlocks),
        "high_risk_count": sum(1 for r in scan_results if r["risk_score"] >= 55),
        "hedges_executed": sum(1 for r in scan_results if r["hedge"] and r["hedge"]["action"] != "HOLD"),
        "results": scan_results,
    }


@router.get("/history")
async def get_agent_history():
    """Full history of all hedge actions taken by the agent"""
    hedges = get_hedge_history()
    return {
        "total_hedges": len(hedges),
        "total_value_protected": get_total_value_protected(),
        "strategy_breakdown": get_strategy_breakdown(),
        "hedges": hedges,
    }


@router.get("/reputation")
async def get_agent_reputation():
    """
    On-chain reputation from Kite AI blockchain.
    Reputation = prediction accuracy tracked via immutable attestations.
    """
    rep = await kite_service.get_reputation()
    return {
        "reputation": rep,
        "chain": "Kite AI Testnet (Chain ID: 2368)",
        "contract_explorer": f"https://testnet.kitescan.ai/address/{kite_service.contract.address if kite_service.contract else 'N/A'}",
    }


@router.get("/status")
async def get_agent_status():
    """Agent status with full capability inventory"""
    contract_address = os.getenv("CONTRACT_ADDRESS", "")
    contract_explorer = (
        f"https://testnet.kitescan.ai/address/{contract_address}"
        if contract_address else None
    )

    return {
        "agent_name": "UnlockShield Autonomous Agent",
        "version": "2.0.0",
        "status": "active",
        "chain": "Kite AI Testnet (Chain ID: 2368)",
        "kite_connected": kite_service.is_connected(),
        "kite_contract_address": contract_address or "not_configured",
        "kite_contract_explorer": contract_explorer,
        "analysis_engine": "Quantitative reasoning layer + 5-factor stress model",
        "risk_model": "5-factor weighted: Supply Shock (35%), Historical Pattern (25%), Recipient Type (20%), Market Regime (10%), Time Urgency (10%)",
        "capabilities": [
            "Full market surveillance (300+ tokens via CoinPaprika)",
            "Dynamic unlock monitoring (40+ tokens via Tokenomist + curated)",
            "Multi-factor quantitative risk analysis",
            "6 hedge strategies (FULL_EXIT → HOLD) with execution plans",
            "Real-time market regime detection (5-signal model)",
            "Fear & Greed Index integration",
            "DeFiLlama TVL monitoring for protocol health",
            "Volume anomaly detection (whale activity / pre-unlock signals)",
            "Sector heatmap & correlation analysis",
            "On-chain attestation on Kite AI blockchain",
            "Historical backtesting on 13+ real unlock events (2024-2025)",
            "Verifiable reputation tracking via smart contract",
        ],
        "data_sources": [
            "CoinPaprika (top 300 tokens — prices, volume, market cap, percentage changes)",
            "Tokenomist API (dynamic unlock schedules for 200+ tokens)",
            "DeFiLlama (Total Value Locked for 50+ DeFi protocols)",
            "Alternative.me (Crypto Fear & Greed Index)",
            "Curated historical database (13+ verified unlock events with outcomes)",
            "On-chain (Kite AI attestation smart contract)",
        ],
        "strategies": list({k: v["name"]} for k, v in __import__("app.services.risk_analyzer", fromlist=["STRATEGIES"]).STRATEGIES.items()),
        "total_hedges": len(get_hedge_history()),
        "total_value_protected": f"${get_total_value_protected():,.2f}",
    }


@router.get("/activity")
async def get_agent_activity(limit: int = 50):
    """
    Live feed of autonomous agent decisions. Frontend polls this to render
    a real-time activity log that shows the agent is actually running
    without user input.
    """
    from app.services.agent_loop import activity_log, loop_status
    return {
        "loop": loop_status(),
        "events": activity_log.snapshot(limit=max(1, min(int(limit), 200))),
    }


@router.get("/treasury")
async def get_treasury_passport():
    """
    On-chain agent passport: identity, spending policy, treasury balance,
    trades executed, hedges blocked. Reads directly from the AgentTreasury
    contract on Kite AI.
    """
    from app.services.treasury_service import treasury_service
    passport = treasury_service.passport()
    hedges = treasury_service.recent_hedges(limit=20)
    return {
        "configured": treasury_service.is_configured(),
        "passport": passport,
        "recent_hedges": hedges,
    }
