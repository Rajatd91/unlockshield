from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class TokenUnlock(BaseModel):
    """Represents an upcoming token unlock event"""
    token_symbol: str
    token_name: str
    unlock_date: datetime
    unlock_amount_usd: float
    unlock_amount_tokens: float
    total_supply_percent: float
    source: str = "tokenomist"


class RiskAnalysis(BaseModel):
    """AI's multi-factor analysis of an unlock event's risk"""
    token_symbol: str
    risk_score: int  # 1-100 composite score
    predicted_price_impact: float  # percentage, negative = dump
    reasoning: str  # Chain-of-thought explanation
    recommended_action: str  # Strategy key
    confidence: float  # 0-1

    # Enhanced fields
    factor_scores: Optional[Dict[str, int]] = None  # Per-factor breakdown
    key_risks: Optional[List[str]] = None
    similar_event: Optional[str] = None
    historical_avg_impact: Optional[float] = None
    days_until_unlock: Optional[int] = None


class HedgeAction(BaseModel):
    """A hedge action taken by the agent"""
    prediction_id: int
    action_type: str
    strategy_name: str
    details: str
    amount_usd: float
    hedge_pct: float
    simulated: bool = True
    tx_hash: Optional[str] = None


class PortfolioHolding(BaseModel):
    """A token in the user's portfolio"""
    token_symbol: str
    amount: float
    current_price: float
    value_usd: float
    at_risk: bool = False  # Has upcoming unlock


class BacktestResult(BaseModel):
    """Result of backtesting the strategy on historical data"""
    token_symbol: str
    period: str
    total_unlocks: int
    avg_impact_without_shield: float
    avg_impact_with_shield: float
    total_saved_usd: float
    win_rate: float  # % of times hedge was profitable


class AttestationRecord(BaseModel):
    """On-chain attestation reference"""
    prediction_id: int
    tx_hash: str
    block_number: int
    explorer_url: str
    chain: str = "Kite AI Testnet"
    timestamp: Optional[str] = None


class AgentReputation(BaseModel):
    """Agent's on-chain reputation stats"""
    total_predictions: int
    accurate_predictions: int
    accuracy_percent: float
    total_hedges: int
    total_value_protected: float
    reputation_score: int
    chain: str = "Kite AI Testnet"
