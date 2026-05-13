"""
Multi-Strategy Hedge Execution Engine
Supports 6 hedge strategies used by professional trading desks.
All trades simulated for hackathon — attested on Kite chain.
"""
import json
from datetime import datetime, timedelta
from typing import List, Dict
from app.models.schemas import RiskAnalysis
from app.services.kite_attestation import kite_service
from app.services.risk_analyzer import STRATEGIES
from app.services.agent_wallet import agent_wallet

executed_hedges: List[Dict] = []


async def execute_hedge(analysis: RiskAnalysis, portfolio_value: float = 10000) -> Dict:
    """
    Execute the recommended hedge strategy.
    Professional strategies with detailed execution plans.
    Integrated with Kite AA wallet for spending controls.
    """
    strategy_key = analysis.recommended_action
    strategy = STRATEGIES.get(strategy_key, STRATEGIES["HOLD"])

    if strategy_key == "HOLD":
        record = {
            "token_symbol": analysis.token_symbol,
            "action": "HOLD",
            "strategy_name": strategy["name"],
            "message": f"Monitoring {analysis.token_symbol} — risk {analysis.risk_score}/100 below hedge threshold. No action needed.",
            "amount_hedged": 0,
            "hedge_pct": 0,
            "risk_score": analysis.risk_score,
            "predicted_impact": analysis.predicted_price_impact,
            "reasoning": analysis.reasoning,
            "attestation_tx": None,
            "explorer_url": None,
            "simulated": True,
            "executed_at": datetime.utcnow().isoformat(),
            "execution_plan": None,
        }
        executed_hedges.append(record)
        return record

    hedge_pct = strategy["hedge_pct"]
    hedge_amount = portfolio_value * hedge_pct

    # AA Wallet: Pre-flight spending check
    spend_check = agent_wallet.check_spend_allowed(hedge_amount, strategy_key)
    if not spend_check["approved"]:
        record = {
            "token_symbol": analysis.token_symbol,
            "action": "BLOCKED",
            "strategy_name": strategy["name"],
            "message": f"[SPENDING LIMIT] Hedge blocked by AA wallet rules: {[c for c in spend_check['checks'] if not c['passed']]}",
            "amount_hedged": 0,
            "hedge_pct": 0,
            "risk_score": analysis.risk_score,
            "predicted_impact": analysis.predicted_price_impact,
            "reasoning": analysis.reasoning,
            "attestation_tx": None,
            "explorer_url": None,
            "simulated": True,
            "executed_at": datetime.utcnow().isoformat(),
            "execution_plan": None,
            "spending_check": spend_check,
        }
        executed_hedges.append(record)
        return record

    # Build strategy-specific execution plan
    plan = _build_execution_plan(strategy_key, analysis, hedge_amount)

    # Build detailed trade log
    details = json.dumps({
        "strategy": strategy_key,
        "strategy_name": strategy["name"],
        "token": analysis.token_symbol,
        "portfolio_value": portfolio_value,
        "hedge_amount_usd": round(hedge_amount, 2),
        "hedge_percentage": f"{hedge_pct * 100:.0f}%",
        "risk_score": analysis.risk_score,
        "predicted_impact": f"{analysis.predicted_price_impact}%",
        "confidence": analysis.confidence,
        "execution_plan": plan,
        "timestamp": datetime.utcnow().isoformat(),
        "simulated": True,
    })

    # Attest on Kite chain
    attestation_tx = await kite_service.attest_hedge(
        prediction_id=0,
        action_type=strategy_key,
        details=details,
        simulated=True
    )

    message = _format_execution_message(strategy_key, analysis, hedge_amount, plan)

    record = {
        "token_symbol": analysis.token_symbol,
        "action": strategy_key,
        "strategy_name": strategy["name"],
        "message": message,
        "amount_hedged": round(hedge_amount, 2),
        "hedge_pct": hedge_pct,
        "risk_score": analysis.risk_score,
        "predicted_impact": analysis.predicted_price_impact,
        "reasoning": analysis.reasoning,
        "factor_scores": analysis.factor_scores,
        "attestation_tx": attestation_tx,
        "explorer_url": f"https://testnet.kitescan.ai/tx/{attestation_tx}" if attestation_tx else None,
        "simulated": True,
        "executed_at": datetime.utcnow().isoformat(),
        "execution_plan": plan,
    }

    # AA Wallet: Record spend & auto-yield idle funds
    agent_wallet.record_spend(hedge_amount, strategy_key, analysis.token_symbol, attestation_tx)
    if agent_wallet._spending_rules.get("auto_yield_on_idle"):
        record["yield_note"] = "Idle hedged USDC auto-deposited to L-USDC (4% APY via Lucid/Aave v3)"

    executed_hedges.append(record)
    return record


def _build_execution_plan(strategy_key: str, analysis: RiskAnalysis, amount: float) -> List[Dict]:
    """Build detailed step-by-step execution plan for each strategy"""

    if strategy_key == "FULL_EXIT":
        return [
            {"step": 1, "action": "Market sell", "amount": f"${amount:,.0f}", "pair": f"{analysis.token_symbol}/USDC",
             "venue": "Uniswap V3 (0.3% pool)", "timing": "Immediate", "slippage_limit": "1.5%"},
            {"step": 2, "action": "Verify settlement", "detail": "Confirm USDC received in wallet"},
            {"step": 3, "action": "Set re-entry alert", "detail": f"Monitor {analysis.token_symbol} for re-entry at predicted bottom"},
        ]

    elif strategy_key == "REDUCE_POSITION":
        sell_amount = amount * 0.75
        keep_amount = amount * 0.25
        return [
            {"step": 1, "action": "Sell 75% via TWAP", "amount": f"${sell_amount:,.0f}",
             "pair": f"{analysis.token_symbol}/USDC", "venue": "1inch Aggregator", "duration": "2 hours",
             "reason": "TWAP reduces market impact"},
            {"step": 2, "action": "Keep 25% core position", "amount": f"${keep_amount:,.0f}",
             "reason": "Maintain upside exposure if unlock is priced in"},
            {"step": 3, "action": "Set stop-loss on remainder", "level": f"{analysis.predicted_price_impact * 1.5:.1f}%",
             "reason": "Protect remaining position if drop exceeds prediction"},
        ]

    elif strategy_key == "SHORT_HEDGE":
        return [
            {"step": 1, "action": "Open 1x short position", "amount": f"${amount:,.0f}",
             "pair": f"{analysis.token_symbol}-PERP", "venue": "GMX / dYdX", "leverage": "1x",
             "reason": "Delta-neutral: long spot + short perp = market-neutral"},
            {"step": 2, "action": "Set take-profit", "level": f"Close short after {abs(analysis.predicted_price_impact):.0f}% drop or 7 days"},
            {"step": 3, "action": "Monitor funding rate", "detail": "Positive funding = paid to hold short (ideal)"},
        ]

    elif strategy_key == "OPTIONS_PUT":
        premium = amount * 0.03  # ~3% premium
        return [
            {"step": 1, "action": "Buy protective put", "amount": f"${amount:,.0f} notional",
             "strike": f"ATM ({analysis.token_symbol} current price)", "expiry": f"{analysis.days_until_unlock + 7} days",
             "premium": f"~${premium:,.0f} (3%)", "venue": "Lyra / Premia (simulated)"},
            {"step": 2, "action": "Hold through unlock", "detail": "Put protects downside, unlimited upside retained"},
            {"step": 3, "action": "Exercise or let expire", "detail": "Exercise if drop exceeds premium cost"},
        ]

    elif strategy_key == "DCA_EXIT":
        daily = amount / 3
        return [
            {"step": 1, "action": "Day 1: Sell 33%", "amount": f"${daily:,.0f}",
             "timing": f"{analysis.days_until_unlock - 3} days before unlock",
             "pair": f"{analysis.token_symbol}/USDC"},
            {"step": 2, "action": "Day 2: Sell 33%", "amount": f"${daily:,.0f}",
             "timing": f"{analysis.days_until_unlock - 2} days before unlock"},
            {"step": 3, "action": "Day 3: Sell remaining 34%", "amount": f"${amount - 2 * daily:,.0f}",
             "timing": f"{analysis.days_until_unlock - 1} day before unlock"},
            {"step": 4, "action": "Re-enter position", "timing": "3-5 days after unlock when selling pressure subsides"},
        ]

    return [{"step": 1, "action": "No action", "detail": "Risk below threshold"}]


def _format_execution_message(strategy_key: str, analysis: RiskAnalysis, amount: float, plan: list) -> str:
    """Human-readable execution summary"""
    strategy = STRATEGIES[strategy_key]

    msgs = {
        "FULL_EXIT": f"EXECUTED: Full exit of ${amount:,.0f} {analysis.token_symbol} → USDC. Risk score {analysis.risk_score}/100 triggered maximum protection. Predicted {analysis.predicted_price_impact}% drop.",
        "REDUCE_POSITION": f"EXECUTED: Reduced {analysis.token_symbol} position by ${amount:,.0f} via 2hr TWAP. Kept 25% core position with stop-loss. Risk: {analysis.risk_score}/100.",
        "SHORT_HEDGE": f"EXECUTED: Opened ${amount:,.0f} 1x short on {analysis.token_symbol}-PERP for delta-neutral hedge. Position is now market-neutral through the unlock event.",
        "OPTIONS_PUT": f"EXECUTED: Bought protective put on ${amount:,.0f} of {analysis.token_symbol}. Downside capped at ~3% premium, upside unlimited. Expires {analysis.days_until_unlock + 7}d.",
        "DCA_EXIT": f"SCHEDULED: DCA exit of ${amount:,.0f} {analysis.token_symbol} over 3 days before unlock. Minimizes market impact from selling.",
    }

    return f"[SIMULATED] {msgs.get(strategy_key, 'Unknown strategy')}"


def get_hedge_history() -> List[Dict]:
    return list(reversed(executed_hedges))


def get_total_value_protected() -> float:
    return sum(h.get("amount_hedged", 0) for h in executed_hedges)


def get_strategy_breakdown() -> Dict:
    """Breakdown of strategies used"""
    breakdown = {}
    for h in executed_hedges:
        action = h.get("action", "UNKNOWN")
        if action not in breakdown:
            breakdown[action] = {"count": 0, "total_usd": 0}
        breakdown[action]["count"] += 1
        breakdown[action]["total_usd"] += h.get("amount_hedged", 0)
    return breakdown
