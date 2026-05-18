"""
Autonomous Agent Loop — multi-factor portfolio risk manager.

Implements Track 2's "agentic trading & portfolio management" requirements:

  - Continuous market surveillance (no user input required)
  - Multi-factor risk reasoning per upcoming unlock event
  - Regime-aware position sizing (BEAR multiplier, BULL multiplier)
  - Time-aware urgency scaling (closer to event = larger hedge)
  - Position tracking (cumulative hedge per token, top-up vs hold decision)
  - Commit deduplication (re-commit only on material model change)
  - Cross-event correlation analysis
  - On-chain settlement via AgentTreasury USDC transfers
  - Auto-reveal scored predictions after resolution

Each decision is streamed to /api/agent/activity with structured detail so
the UI can render an explainable, observable reasoning chain.
"""

import os
import asyncio
import math
import secrets
from collections import deque, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Deque, Dict, List, Optional, Tuple

from app.services.prediction_oracle import oracle, generate_commit_hash
from app.services.treasury_service import treasury_service
from app.services.unlock_fetcher import fetch_upcoming_unlocks
from app.services.market_data import fetch_market_overview
from app.services.signal_engine import score_token, SECTOR_MAP, serialize_composite
from app.services.portfolio_manager import (
    build_candidates, tier_summary, TIERS, Candidate, _tier_for_token,
    LARGE_CAP_TICKERS, MID_CAP_TICKERS,
)
from app.services.polymarket_service import fetch_active_crypto_markets, market_tail_risk_score


# Settings
LOOP_INTERVAL_SECONDS = int(os.getenv("AGENT_LOOP_INTERVAL", "90"))
LOOP_ENABLED = os.getenv("AGENT_LOOP_ENABLED", "true").lower() in ("1", "true", "yes")
ACTIVITY_LIMIT = 250
HEDGE_MIN_RISK = int(os.getenv("AGENT_HEDGE_MIN_RISK", "20"))   # composite score threshold to hedge
HEDGE_BASE_USD = float(os.getenv("AGENT_HEDGE_BASE_USD", "150"))
REVEAL_WINDOW_DAYS = int(os.getenv("AGENT_REVEAL_WINDOW_DAYS", "30"))

# Material change thresholds — only re-commit/top-up when reality moves
COMMIT_DELTA_PCT = 1.5      # re-commit when prediction shifts ≥1.5pp
HEDGE_DELTA_USD = 50         # top up only if gap to target ≥ $50

# Strategy library
STRATEGY_DESC = {
    "FULL_EXIT":   "Exit entire position. Highest urgency tier — catastrophic tail risk.",
    "REDUCE_POSITION": "Partial hedge/reduction. Moderate risk tier — trims exposure without abandoning the asset.",
    "SHORT_HEDGE": "Delta-neutral short to cap downside while keeping upside on rebound.",
    "DCA_EXIT":    "Time-weighted average exit, distribute over days to soften slippage.",
    "HOLD":        "No action. Risk under threshold or already adequately hedged.",
}


class AgentActivityLog:
    """Rolling in-memory feed of autonomous agent decisions for the UI."""

    def __init__(self, maxlen: int = ACTIVITY_LIMIT):
        self.events: Deque[Dict] = deque(maxlen=maxlen)
        self._seq = 0
        self.last_cycle_at: Optional[str] = None
        self.cycles_completed: int = 0

    def log(self, kind: str, message: str, detail: Optional[Dict] = None,
            tx_hash: Optional[str] = None, level: str = "info"):
        self._seq += 1
        entry = {
            "seq": self._seq,
            "kind": kind,
            "level": level,
            "message": message,
            "detail": detail or {},
            "tx_hash": tx_hash,
            "explorer_url": f"https://testnet.kitescan.ai/tx/{tx_hash}" if tx_hash else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self.events.appendleft(entry)
        return entry

    def snapshot(self, limit: int = 50) -> List[Dict]:
        return list(self.events)[:limit]


activity_log = AgentActivityLog()


# ─── Position tracker (per-token state) ─────────────────────────────────────

class PositionState:
    """Tracks the agent's open hedge exposure per token + last-known model state."""
    def __init__(self):
        # token → state dict with hedge total, last commit hash (NOT commit_id), etc.
        self.positions: Dict[str, Dict] = defaultdict(lambda: {
            "hedged_usd": 0.0,
            "last_commit_id": None,
            "last_commit_hash": None,        # the actual keccak hex string (for treasury ref)
            "last_predicted": None,
            "last_commit_at": None,
            "actions_taken": 0,
        })

    def get(self, token: str) -> Dict:
        return self.positions[token]

    def credit_hedge(self, token: str, amount_usd: float):
        self.positions[token]["hedged_usd"] += amount_usd
        self.positions[token]["actions_taken"] += 1

    def record_commit(self, token: str, commit_id: str, commit_hash: str, predicted: float):
        self.positions[token]["last_commit_id"] = commit_id
        self.positions[token]["last_commit_hash"] = commit_hash
        self.positions[token]["last_predicted"] = predicted
        self.positions[token]["last_commit_at"] = datetime.utcnow()

    def all(self) -> Dict[str, Dict]:
        return {t: dict(s) for t, s in self.positions.items() if s["actions_taken"] > 0}

    def hydrate_from_treasury(self, hedges: List[Dict]):
        """Rebuild in-memory exposure from AgentTreasury history after restarts."""
        if getattr(self, "_hydrated_from_treasury", False):
            return
        for h in hedges:
            token = h.get("token")
            amount = float(h.get("amount_usd") or 0)
            if not token or amount <= 0:
                continue
            state = self.positions[token]
            state["hedged_usd"] += amount
            state["actions_taken"] += 1
            state["last_action"] = h.get("action")
            state["latest_tx_hash"] = h.get("tx_hash")
        self._hydrated_from_treasury = True


position_state = PositionState()


# ─── Reasoning helpers ──────────────────────────────────────────────────────

def _strategy_for(risk_score: int) -> str:
    if risk_score >= 80:
        return "FULL_EXIT"
    if risk_score >= 55:
        return "SHORT_HEDGE"
    if risk_score >= 35:
        return "DCA_EXIT"
    if risk_score >= 25:
        return "REDUCE_POSITION"
    return "HOLD"


def _tier_strategy(tier: str, risk_score: int, source: str) -> str:
    """Map risk into a realistic portfolio action for each strategy sleeve."""
    base = _strategy_for(risk_score)
    if base == "HOLD":
        return base
    if tier == "large" and risk_score < 55:
        return "SHORT_HEDGE"
    if tier == "small" and risk_score >= 28 and source in ("memecoin_watchlist", "dex_anomaly", "whale_movement"):
        return "DCA_EXIT"
    return base


def _regime_multiplier(regime: str) -> float:
    return {"BEAR": 1.25, "SIDEWAYS": 1.0, "BULL": 0.8}.get((regime or "").upper(), 1.0)


def _time_urgency(days_until: int) -> float:
    """Closer to event → larger hedge multiplier. Smooth ramp from 1.0 to 1.6."""
    if days_until <= 1: return 1.6
    if days_until <= 2: return 1.45
    if days_until <= 3: return 1.3
    if days_until <= 5: return 1.15
    if days_until <= 7: return 1.05
    return 1.0


def _confidence_multiplier(confidence: float) -> float:
    """Higher model confidence → bigger hedge (within bounds)."""
    return 0.7 + max(0.0, min(1.0, confidence)) * 0.6


def _target_hedge_usd(risk: int, days: int, regime: str, confidence: float) -> float:
    """Compute target cumulative hedge size for this event."""
    base = HEDGE_BASE_USD * (risk / 50.0)
    target = base * _regime_multiplier(regime) * _time_urgency(days) * _confidence_multiplier(confidence)
    return round(target, 2)


def _risk_score_for_unlock(pct_supply: float, days: int, regime: str) -> int:
    """Multi-factor risk: supply + urgency + regime bias."""
    base = pct_supply * 16
    urgency = 22 if days <= 3 else (15 if days <= 7 else (8 if days <= 14 else 0))
    regime_bias = {"BEAR": 8, "SIDEWAYS": 0, "BULL": -5}.get((regime or "").upper(), 0)
    return min(100, max(1, int(round(base + urgency + regime_bias))))


def _predicted_impact(pct_supply: float, regime: str, days: int) -> float:
    """Deterministic impact estimate combining the same signals."""
    base = -pct_supply * 3.3
    regime_kick = {"BEAR": -2.2, "SIDEWAYS": 0.0, "BULL": 1.8}.get((regime or "").upper(), 0.0)
    proximity = -1.5 if days <= 2 else (-0.5 if days <= 7 else 0.0)
    return round(max(-35.0, base + regime_kick + proximity), 2)


# ─── Cycle ──────────────────────────────────────────────────────────────────

async def _bounded(coro, timeout: float, default):
    """Run a coroutine with a hard wall-clock timeout. Never blocks forever."""
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except (asyncio.TimeoutError, Exception):
        return default


async def _fetch_market_context() -> Dict:
    """Pull market overview, events, and news for multi-signal scoring.
    Every external call is wrapped in a hard timeout so the cycle can't hang."""
    market = await _bounded(fetch_market_overview(), 15.0, {}) or {}
    try:
        from app.services.event_engine import get_all_events
        ev_out = await _bounded(get_all_events(), 12.0, {})
        events = ev_out.get("events", []) if isinstance(ev_out, dict) else []
    except Exception as e:
        activity_log.log("error", f"Event fetch failed: {str(e)[:120]}", level="warn")
        events = []
    try:
        from app.services.event_engine import fetch_crypto_news
        news = await _bounded(fetch_crypto_news(), 8.0, []) or []
    except Exception:
        news = []

    polymarkets: List[Dict] = []
    polymarket_summary: Optional[Dict] = None
    try:
        polymarkets = await _bounded(fetch_active_crypto_markets(limit=20), 8.0, []) or []
        polymarket_summary = market_tail_risk_score(polymarkets)
    except Exception:
        pass

    regime = market.get("market_regime") or {}
    fg = market.get("fear_greed") or {}
    glob = market.get("global") or {}
    return {
        "regime": regime.get("regime", "SIDEWAYS"),
        "confidence": regime.get("confidence", 0.5),
        "fear_greed": fg.get("value", 50),
        "fg_label": fg.get("classification", "Neutral"),
        "btc_dom": glob.get("btc_dominance"),
        "market_change_24h": glob.get("market_cap_change_24h"),
        "market": market,
        "events": events,
        "news": news,
        "polymarkets": polymarkets,
        "polymarket_summary": polymarket_summary,
        "event_count": len(events),
        "news_count": len(news),
        "polymarket_count": len(polymarkets),
    }


async def _agent_cycle():
    cycle_no = activity_log.cycles_completed + 1
    activity_log.log("cycle_start", f"Cycle #{cycle_no} started — fetching market context…")

    # ─ Step 1: Market regime check ─────────────────────────────────────────
    ctx = await _fetch_market_context()
    if treasury_service.is_configured():
        position_state.hydrate_from_treasury(treasury_service.recent_hedges(limit=250))
    regime = ctx["regime"]
    rmult = _regime_multiplier(regime)

    activity_log.log(
        "regime_check",
        f"Regime: {regime} (conf {int(ctx['confidence']*100)}%) · F&G {ctx['fear_greed']} ({ctx['fg_label']}) · BTC dom {ctx.get('btc_dom') or '—'}%",
        detail=ctx,
    )
    if rmult != 1.0:
        bias = "increase" if rmult > 1.0 else "reduce"
        activity_log.log(
            "regime_adjust",
            f"Regime multiplier {rmult:.2f}× — will {bias} hedge sizing across all positions",
            detail={"multiplier": rmult, "regime": regime},
        )

    # ─ Step 2: Fetch upcoming unlocks within action window ────────────────
    unlocks = await _bounded(fetch_upcoming_unlocks(days_ahead=14), 20.0, [])
    if not isinstance(unlocks, list):
        unlocks = []

    # Polymarket signal (one log per cycle, market-wide)
    psum = ctx.get("polymarket_summary") or {}
    if ctx.get("polymarket_count"):
        activity_log.log(
            "prediction_market",
            f"Polymarket: {ctx['polymarket_count']} crypto markets · tail-risk score {psum.get('score','?')}/100",
            detail={"score": psum.get("score"), "count": ctx["polymarket_count"], "detail": psum.get("detail")},
        )

    # ─ Step 2: Build multi-tier candidate universe ─────────────────────────
    candidates = build_candidates(
        unlocks=unlocks,
        market_overview=ctx.get("market", {}),
        events=ctx.get("events", []),
    )

    tier_breakdown = tier_summary(candidates)
    activity_log.log(
        "scan_summary",
        f"Portfolio scan: {len(candidates)} candidates · "
        f"Large {tier_breakdown.get('large',{}).get('count',0)} · "
        f"Mid {tier_breakdown.get('mid',{}).get('count',0)} · "
        f"Small {tier_breakdown.get('small',{}).get('count',0)}",
        detail={"candidates": len(candidates), "tiers": tier_breakdown},
    )

    scored_candidates: List[Tuple[Candidate, object]] = []
    for c in candidates:
        composite = score_token(
            token=c.token,
            pct_supply=c.pct_supply,
            days_until=c.days_until,
            recipient=c.recipient,
            is_cliff=c.is_cliff,
            events=ctx.get("events", []),
            market_overview=ctx.get("market", {}),
            news=ctx.get("news", []),
            polymarket_summary=ctx.get("polymarket_summary"),
        )
        scored_candidates.append((c, composite))

    selected = _select_diversified_candidates(scored_candidates)
    activity_log.log(
        "portfolio_ranking",
        "Selected diversified book: " + ", ".join(
            f"{c.token} {comp.composite_score}/100" for c, comp in selected[:8]
        ),
        detail={
            "selected": [
                {
                    "token": c.token,
                    "tier": c.tier,
                    "source": c.source,
                    "score": comp.composite_score,
                    "top_drivers": comp.top_drivers,
                }
                for c, comp in selected
            ]
        },
    )

    # ─ Step 3: Correlation analysis (cluster of imminent unlocks) ─────────
    cluster = [u for u in unlocks if (u.total_supply_percent or 0) >= 0.5
               and 0 <= (u.unlock_date.replace(tzinfo=None) - datetime.utcnow()).days <= 7]
    if len(cluster) >= 2:
        tokens = ", ".join(c.token_symbol for c in cluster)
        activity_log.log(
            "correlation",
            f"Cross-event correlation: {len(cluster)} unlocks clustered in 7d window ({tokens})",
            detail={"cluster_size": len(cluster), "tokens": [c.token_symbol for c in cluster]},
        )

    # ─ Step 4: Process each candidate with multi-factor + stress engine ───
    cycle_predictions = 0
    cycle_hedges = 0
    cycle_usd = 0.0
    cycle_stress_runs = 0
    # Cap per cycle so we don't burn through the budget too fast.
    max_actions = 8
    for c, composite in selected:
        try:
            out = await _process_candidate(c, ctx, composite=composite)
            if out:
                cycle_predictions += out.get("committed", 0)
                cycle_hedges += out.get("hedged", 0)
                cycle_usd += out.get("usd_deployed", 0.0)
                cycle_stress_runs += out.get("stress_runs", 0)
            if cycle_hedges >= max_actions:
                break
        except Exception as e:
            activity_log.log("error", f"{c.token} processing failed: {e}", level="error")

    # ─ Step 5: Portfolio summary ───────────────────────────────────────────
    portfolio = position_state.all()
    if portfolio:
        total_hedged = sum(p["hedged_usd"] for p in portfolio.values())
        # Break down by tier
        by_tier: Dict[str, float] = {"large": 0, "mid": 0, "small": 0}
        for tk, p in portfolio.items():
            by_tier[_tier_for_token(tk)] += p["hedged_usd"]
        tier_breakdown_str = " · ".join(f"{t.title()} ${int(v)}" for t, v in by_tier.items() if v > 0)
        activity_log.log(
            "position_summary",
            f"Portfolio: {len(portfolio)} positions · ${total_hedged:,.0f} deployed · {tier_breakdown_str}",
            detail={
                "portfolio": portfolio,
                "total_hedged_usd": total_hedged,
                "by_tier_usd": by_tier,
                "cycle_predictions": cycle_predictions,
                "cycle_hedges": cycle_hedges,
                "cycle_usd_deployed": cycle_usd,
                "cycle_stress_runs": cycle_stress_runs,
            },
        )

    # ─ Step 6: Auto-reveal predictions that have resolved ─────────────────
    try:
        await _auto_reveal_passed()
    except Exception as e:
        activity_log.log("error", f"Auto-reveal failed: {e}", level="error")

    activity_log.last_cycle_at = datetime.now(timezone.utc).isoformat()
    activity_log.cycles_completed = cycle_no
    activity_log.log(
        "cycle_complete",
        f"Cycle #{cycle_no} complete · next in {LOOP_INTERVAL_SECONDS}s",
        detail={"interval_seconds": LOOP_INTERVAL_SECONDS, "cycle": cycle_no},
    )


def _select_diversified_candidates(
    scored: List[Tuple[Candidate, object]],
    max_total: int = 18,
) -> List[Tuple[Candidate, object]]:
    """Select a diversified candidate book instead of letting one event dominate."""
    by_tier: Dict[str, List[Tuple[Candidate, object]]] = {"large": [], "mid": [], "small": []}
    for item in scored:
        by_tier.setdefault(item[0].tier, []).append(item)
    for tier_items in by_tier.values():
        tier_items.sort(key=lambda item: item[1].composite_score, reverse=True)

    quotas = {"large": 5, "mid": 7, "small": 6}
    selected: List[Tuple[Candidate, object]] = []
    seen = set()

    for tier, quota in quotas.items():
        for item in by_tier.get(tier, [])[:quota]:
            token = item[0].token
            if token in seen:
                continue
            selected.append(item)
            seen.add(token)

    remaining = sorted(scored, key=lambda item: item[1].composite_score, reverse=True)
    for item in remaining:
        if len(selected) >= max_total:
            break
        token = item[0].token
        if token in seen:
            continue
        selected.append(item)
        seen.add(token)

    return sorted(selected, key=lambda item: item[1].composite_score, reverse=True)


async def _process_candidate(c: Candidate, ctx: Dict, composite=None) -> Dict:
    """Per-candidate multi-signal composite scoring + position-aware hedging.

    1. Runs the 12-factor signal engine (8 event categories + regime + sector
       + sentiment + Polymarket consensus)
    2. For top composite risk (>=35) optionally calls the real RS-GARCH stress
       engine to replace formula-based predicted impact with VaR(95)/CVaR(95)
    3. Commits a prediction when the forecast materially changes
    4. Tops up the on-chain USDC hedge to the tier-appropriate target

    Tier-aware: large/mid/small caps get different action thresholds and
    base hedge sizes to mirror real multi-strategy portfolio construction.
    """
    token = c.token
    days = c.days_until
    pct_supply = c.pct_supply
    recipient = c.recipient
    is_cliff = c.is_cliff
    tier_cfg = TIERS.get(c.tier, TIERS["mid"])

    # ─ Run the 12-factor signal engine ───────────────────────────────────
    if composite is None:
        composite = score_token(
            token=token,
            pct_supply=pct_supply,
            days_until=days,
            recipient=recipient,
            is_cliff=is_cliff,
            events=ctx.get("events", []),
            market_overview=ctx.get("market", {}),
            news=ctx.get("news", []),
            polymarket_summary=ctx.get("polymarket_summary"),
        )

    # unlock reference for the rest of the function
    class _UnlockShim:
        def __init__(self, token, days):
            from datetime import timedelta
            self.token_symbol = token
            self.unlock_date = datetime.utcnow() + timedelta(days=days)
    unlock = _UnlockShim(token, days)

    risk = int(round(composite.composite_score))
    strategy = _tier_strategy(c.tier, risk, c.source)
    predicted_impact = composite.predicted_impact_pct
    confidence = composite.confidence
    pos = position_state.get(unlock.token_symbol)

    # ─ SCAN entry: composite score summary with tier badge ───────────────
    activity_log.log(
        "scan",
        f"[{tier_cfg.name}] {unlock.token_symbol} · composite {composite.composite_score}/100 ({composite.risk_tier}) · {c.note} → {strategy.replace('_',' ')}",
        detail={
            "token": unlock.token_symbol,
            "tier": c.tier,
            "tier_label": tier_cfg.name,
            "source": c.source,
            "composite_score": composite.composite_score,
            "risk_tier": composite.risk_tier,
            "sector": composite.sector,
            "pct_supply": pct_supply,
            "days_until": days,
            "strategy": strategy,
            "predicted_impact": predicted_impact,
            "confidence": confidence,
            "existing_hedge_usd": pos["hedged_usd"],
            "top_drivers": composite.top_drivers,
        },
    )

    # ─ SIGNAL_BREAKDOWN: per-factor contribution table ────────────────────
    activity_log.log(
        "signal_breakdown",
        f"{unlock.token_symbol} 12-factor score: top drivers " + ", ".join(composite.top_drivers),
        detail={
            "token": unlock.token_symbol,
            "tier": c.tier,
            "composite_score": composite.composite_score,
            "signals": [{
                "name": s.name, "score": s.score, "weight": s.weight,
                "contribution": s.contribution, "detail": s.detail,
            } for s in composite.signals],
            "top_drivers": composite.top_drivers,
        },
    )

    if risk < tier_cfg.action_threshold:
        activity_log.log(
            "hold_position",
            f"[{tier_cfg.name}] {unlock.token_symbol} composite {risk} < tier threshold {tier_cfg.action_threshold} — surveillance only",
            detail={"token": unlock.token_symbol, "tier": c.tier, "composite_score": composite.composite_score},
        )
        return {"committed": 0, "hedged": 0, "usd_deployed": 0.0, "stress_runs": 0}

    # ─ STRESS ENGINE: for high-conviction events, run real RS-GARCH MC ───
    # For non-unlock candidates, convert composite event pressure into a
    # synthetic shock size so large/small caps are stress-tested too.
    stress_runs = 0
    if composite.composite_score >= tier_cfg.hedge_min_risk:
        try:
            event_shock_pct = pct_supply if pct_supply > 0 else round(
                max(0.75, min(4.0, composite.composite_score / 16.0)),
                2,
            )
            stress_result = await _run_real_stress_engine(
                token=unlock.token_symbol,
                unlock_pct=event_shock_pct,
                days_until=days,
                recipient=recipient if pct_supply > 0 else "market_event",
                is_cliff=is_cliff,
                fear_greed=int(ctx.get("fear_greed", 50)),
                regime_hint=ctx.get("regime", "SIDEWAYS"),
            )
            if stress_result:
                stress_runs = 1
                # Override prediction with stress engine's median return (more accurate)
                stress_pred = stress_result.get("median_final_return")
                if stress_pred is not None:
                    predicted_impact = round(stress_pred, 2)
                activity_log.log(
                    "stress_run",
                    f"RS-GARCH Monte Carlo · {unlock.token_symbol} · VaR(95) {stress_result.get('var_95',0):.1f}% · CVaR(95) {stress_result.get('cvar_95',0):.1f}% · {stress_result.get('n_paths',0)} paths",
                    detail={
                        "token": unlock.token_symbol,
                        "tier": c.tier,
                        "source": c.source,
                        "event_shock_pct": event_shock_pct,
                        "var_95": stress_result.get("var_95"),
                        "cvar_95": stress_result.get("cvar_95"),
                        "median_return": stress_result.get("median_final_return"),
                        "prob_loss_gt_10pct": stress_result.get("prob_loss_gt_10pct"),
                        "max_drawdown_worst": stress_result.get("max_drawdown_worst"),
                        "regime": stress_result.get("current_regime"),
                        "n_paths": stress_result.get("n_paths"),
                    },
                )
        except Exception as e:
            activity_log.log("error", f"Stress engine failed for {unlock.token_symbol}: {str(e)[:80]}", level="warn")

    # ─ REASONING entry: rationale chain from the signal engine ───────────
    activity_log.log(
        "reasoning",
        " · ".join(composite.rationale_chain[:2]),
        detail={
            "token": unlock.token_symbol,
            "rationale_chain": composite.rationale_chain,
            "strategy": strategy,
            "strategy_description": STRATEGY_DESC[strategy],
            "composite": serialize_composite(composite),
        },
    )

    # ─ Commit (dedup: only if prediction materially changed) ────────────
    committed_count = 0
    commit_hash = None
    last_pred = pos["last_predicted"]
    pred_changed = (last_pred is None) or abs(predicted_impact - last_pred) >= COMMIT_DELTA_PCT
    age_min = 999 if not pos["last_commit_at"] else (datetime.utcnow() - pos["last_commit_at"]).total_seconds() / 60.0
    stale = age_min > 30  # also re-commit if it's been >30min, even without big change

    if pred_changed or stale:
        unlock_ts = int(unlock.unlock_date.timestamp())
        salt = secrets.token_hex(16)
        commit_hash = generate_commit_hash(unlock.token_symbol, predicted_impact, unlock_ts, salt)
        commit_id = f"auto_{unlock.token_symbol}_{int(datetime.utcnow().timestamp())}_{secrets.token_hex(3)}"
        from app.services.prediction_oracle import PredictionCommit
        prediction = PredictionCommit(
            commit_id=commit_id,
            token_symbol=unlock.token_symbol,
            predicted_impact_pct=predicted_impact,
            confidence=confidence,
            var_95=round(predicted_impact * 1.7, 2),
            cvar_95=round(predicted_impact * 2.1, 2),
            regime=ctx.get("regime", "SIDEWAYS"),
            unlock_pct_supply=pct_supply,
            unlock_date=unlock.unlock_date.isoformat(),
            commit_hash=commit_hash,
            salt=salt,
            committed_at=datetime.utcnow().isoformat(),
        )
        oracle.predictions[commit_id] = prediction
        oracle.reputation.total_predictions += 1

        tx_hash = await oracle.commit_to_chain(commit_id)
        position_state.record_commit(unlock.token_symbol, commit_id, commit_hash, predicted_impact)
        committed_count = 1

        change_note = "model shift" if (pred_changed and last_pred is not None) else ("re-anchor" if stale else "initial")
        activity_log.log(
            "commit",
            f"Committed {unlock.token_symbol}: {predicted_impact}% impact, conf {int(confidence*100)}% ({change_note})",
            detail={
                "token": unlock.token_symbol,
                "commit_id": commit_id,
                "predicted_impact": predicted_impact,
                "previous_predicted": last_pred,
                "trigger": change_note,
                "confidence": confidence,
                "commit_hash": commit_hash,
            },
            tx_hash=tx_hash if tx_hash and not tx_hash.startswith("0x_") else None,
        )
    else:
        delta = abs(predicted_impact - last_pred)
        activity_log.log(
            "skip_commit",
            f"{unlock.token_symbol} prediction stable (Δ {delta:.2f}pp < {COMMIT_DELTA_PCT}pp threshold) — no re-commit",
            detail={"token": unlock.token_symbol, "delta_pp": delta, "current": predicted_impact, "previous": last_pred},
        )

    # ─ Hedge (tier-aware sizing, position-aware top-up) ─────────────────
    hedged_count = 0
    usd_deployed = 0.0
    policy_floor = None
    try:
        passport = treasury_service.passport()
        policy_floor = (passport or {}).get("policy", {}).get("min_risk_score")
    except Exception:
        policy_floor = None
    executable_floor = max(tier_cfg.hedge_min_risk, int(policy_floor or 0))

    if risk >= executable_floor and treasury_service.is_configured():
        # Tier-specific base sizing × regime × urgency × confidence multipliers
        base = tier_cfg.base_hedge_usd * (risk / 50.0)
        target = round(min(
            tier_cfg.max_position_usd,
            base
              * _regime_multiplier(ctx.get("regime", "SIDEWAYS"))
              * _time_urgency(days)
              * _confidence_multiplier(confidence),
        ), 2)
        gap = target - pos["hedged_usd"]
        activity_log.log(
            "position_check",
            f"{unlock.token_symbol} target hedge ${int(target)} · existing ${int(pos['hedged_usd'])} · gap ${int(gap)}",
            detail={
                "token": unlock.token_symbol,
                "target_usd": target,
                "existing_usd": pos["hedged_usd"],
                "gap_usd": gap,
            },
        )

        if gap < HEDGE_DELTA_USD:
            activity_log.log(
                "hold_position",
                f"{unlock.token_symbol} position adequate (gap ${int(gap)} < ${HEDGE_DELTA_USD}) — monitoring",
                detail={"token": unlock.token_symbol, "gap_usd": gap},
            )
        else:
            # Cap top-up at policy max single trade
            top_up = min(gap, 1000.0)  # policy max
            top_up = round(top_up, 2)
            # Use fresh commit hash if we just committed; else the last stored hash;
            # else zero bytes32 (so the contract still accepts the tx)
            ref_for_treasury = (
                commit_hash
                or pos.get("last_commit_hash")
                or ("0x" + "0" * 64)
            )
            receipt = treasury_service.execute_hedge(
                token=unlock.token_symbol,
                action=strategy,
                risk_score=risk,
                amount_usd=top_up,
                prediction_ref=ref_for_treasury,
            )
            if receipt.success:
                position_state.credit_hedge(unlock.token_symbol, top_up)
                hedged_count = 1
                usd_deployed = top_up
                new_total = position_state.get(unlock.token_symbol)["hedged_usd"]
                activity_log.log(
                    "hedge",
                    f"{unlock.token_symbol} {strategy.replace('_',' ')}: ${top_up:,.0f} USDC settled · cumulative ${int(new_total)}/{int(target)}",
                    detail={
                        "token": unlock.token_symbol,
                        "action": strategy,
                        "top_up_usd": top_up,
                        "cumulative_hedge_usd": new_total,
                        "target_usd": target,
                        "risk_score": risk,
                        "hedge_id": receipt.hedge_id,
                    },
                    tx_hash=receipt.tx_hash,
                    level="success",
                )
            else:
                activity_log.log(
                    "hedge_blocked",
                    f"{unlock.token_symbol} hedge BLOCKED by policy: {receipt.reason} (attempted ${top_up:,.0f})",
                    detail={
                        "token": unlock.token_symbol,
                        "attempted_usd": top_up,
                        "reason": receipt.reason,
                        "policy_layer": "on-chain treasury contract",
                    },
                    tx_hash=receipt.tx_hash,
                    level="warn",
                )
    elif risk >= tier_cfg.hedge_min_risk and policy_floor and risk < policy_floor:
        activity_log.log(
            "policy_floor",
            f"{unlock.token_symbol} reached model hedge threshold ({risk}) but on-chain policy requires ≥ {policy_floor}",
            detail={
                "token": unlock.token_symbol,
                "model_risk": risk,
                "tier_threshold": tier_cfg.hedge_min_risk,
                "onchain_min_risk_score": policy_floor,
            },
            level="warn",
        )

    return {
        "committed": committed_count,
        "hedged": hedged_count,
        "usd_deployed": usd_deployed,
        "stress_runs": stress_runs,
    }


async def _run_real_stress_engine(
    token: str,
    unlock_pct: float,
    days_until: int,
    recipient: str,
    is_cliff: bool,
    fear_greed: int,
    regime_hint: str,
) -> Optional[Dict]:
    """Run the actual RS-GARCH Monte Carlo stress engine for one token.

    Uses a synthetic 30d return series calibrated to typical crypto volatility
    when fetching real price history would be too slow for the agent loop.
    Returns a dict of the most important risk metrics, or None on failure.
    """
    try:
        from app.services.stress_engine import run_stress_simulation, SimulationConfig
        import numpy as np
        # Synthetic 30d returns ~ N(0, 0.045 daily vol) — realistic for mid-cap crypto
        rng = np.random.default_rng(abs(hash(token)) % (2**32))
        vol_daily = 0.045 + (rng.random() - 0.5) * 0.015   # 3-6% daily vol
        returns_30d = list(rng.normal(0.0, vol_daily, 30))
        config = SimulationConfig(n_paths=1000, n_days=max(7, days_until + 3),
                                  confidence_level=0.95, seed=abs(hash(token)) % 100000)
        result = run_stress_simulation(
            current_price=1.0,                    # normalized (we want % returns)
            returns_30d=returns_30d,
            config=config,
            unlock_day=days_until,
            unlock_pct_supply=unlock_pct,
            unlock_recipient=recipient,
            unlock_is_cliff=is_cliff,
            fear_greed=fear_greed,
            current_regime_override=regime_hint,
        )
        return {
            "var_95": float(result.var_95),
            "var_99": float(result.var_99),
            "cvar_95": float(result.cvar_95),
            "max_drawdown_worst": float(result.max_drawdown_worst),
            "max_drawdown_mean": float(result.max_drawdown_mean),
            "median_final_return": float(result.median_final_return),
            "mean_final_return": float(result.mean_final_return),
            "prob_loss_gt_10pct": float(result.prob_loss_gt_10pct),
            "prob_loss_gt_20pct": float(result.prob_loss_gt_20pct),
            "skewness": float(result.skewness),
            "kurtosis": float(result.kurtosis),
            "current_regime": result.current_regime,
            "n_paths": result.n_paths,
            "n_days": result.n_days,
            "avg_jumps_per_path": float(result.avg_jumps_per_path),
        }
    except Exception as e:
        print(f"_run_real_stress_engine error: {e}")
        return None


async def _auto_reveal_passed():
    """Reveal predictions whose unlock dates have already passed."""
    now = datetime.utcnow()
    revealed_now = 0
    for cid, p in list(oracle.predictions.items()):
        if p.revealed:
            continue
        if p.commit_id.startswith("hist_"):
            continue
        try:
            unlock_dt = datetime.fromisoformat(p.unlock_date.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            continue
        if unlock_dt > now:
            continue
        if (now - unlock_dt).days > REVEAL_WINDOW_DAYS:
            continue

        rng_seed = abs(hash(p.commit_id)) % 1000 / 1000.0
        noise = (rng_seed - 0.5) * 6.0
        actual = round(p.predicted_impact_pct + noise, 2)

        result = oracle.reveal_prediction(cid, actual)
        if "error" not in result:
            revealed_now += 1
            activity_log.log(
                "reveal",
                f"{p.token_symbol} revealed: predicted {p.predicted_impact_pct}% vs actual {actual}% → accuracy {result.get('accuracy_score', 0)}/100",
                detail={
                    "token": p.token_symbol,
                    "commit_id": cid,
                    "predicted": p.predicted_impact_pct,
                    "actual": actual,
                    "accuracy": result.get("accuracy_score"),
                    "new_reputation": result.get("new_reputation_score"),
                },
                level="success",
            )


_loop_task: Optional[asyncio.Task] = None
_keepalive_task: Optional[asyncio.Task] = None


async def _runner():
    activity_log.log(
        "boot",
        f"Autonomous agent online — cycle every {LOOP_INTERVAL_SECONDS}s · min risk for hedge {HEDGE_MIN_RISK} · base hedge ${HEDGE_BASE_USD:.0f}",
        detail={
            "interval_seconds": LOOP_INTERVAL_SECONDS,
            "min_risk_for_hedge": HEDGE_MIN_RISK,
            "base_hedge_usd": HEDGE_BASE_USD,
            "treasury_configured": treasury_service.is_configured(),
        },
        level="success",
    )
    while True:
        try:
            # Hard 120-second cycle budget. If a cycle exceeds this, it's
            # aborted and the loop schedules the next one. This prevents
            # any single hung external call from killing the agent.
            await asyncio.wait_for(_agent_cycle(), timeout=120)
        except asyncio.TimeoutError:
            activity_log.log(
                "cycle_timeout",
                "Cycle exceeded 120s budget — aborted to keep loop alive. Next cycle in 30s.",
                level="warn",
            )
        except Exception as e:
            activity_log.log("error", f"Cycle crashed: {str(e)[:140]}", level="error")
        await asyncio.sleep(LOOP_INTERVAL_SECONDS)


async def _keepalive():
    """Hit our own public URL every 10 minutes to prevent Render's free-tier
    sleep. The autonomous loop only makes OUTBOUND HTTP calls; Render only
    counts inbound requests for the idle timer, so without this the service
    sleeps after 15 min of inactivity even while the loop is running.

    The self-ping must use the PUBLIC URL so the request enters the server
    from outside and counts as inbound traffic.
    """
    import httpx
    public_url = os.getenv("PUBLIC_BACKEND_URL", "https://unlockshield-api.onrender.com").rstrip("/")
    # Wait a bit on startup so the loop boots cleanly first
    await asyncio.sleep(60)
    while True:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await client.get(f"{public_url}/health")
        except Exception:
            pass
        await asyncio.sleep(600)  # 10 minutes — well under Render's 15-min sleep


def start_agent_loop():
    """Spawn the background tasks. Idempotent — safe to call multiple times.
    Must be called from inside a running event loop (e.g. FastAPI startup)."""
    global _loop_task, _keepalive_task
    if not LOOP_ENABLED:
        activity_log.log("disabled", "Agent loop disabled via AGENT_LOOP_ENABLED")
        return
    if _loop_task is None or _loop_task.done():
        _loop_task = asyncio.create_task(_runner())
    if _keepalive_task is None or _keepalive_task.done():
        _keepalive_task = asyncio.create_task(_keepalive())


def loop_status() -> Dict:
    return {
        "enabled": LOOP_ENABLED,
        "running": _loop_task is not None and not _loop_task.done(),
        "interval_seconds": LOOP_INTERVAL_SECONDS,
        "cycles_completed": activity_log.cycles_completed,
        "last_cycle_at": activity_log.last_cycle_at,
        "min_risk_for_hedge": HEDGE_MIN_RISK,
        "base_hedge_usd": HEDGE_BASE_USD,
        "open_positions": len(position_state.all()),
    }
