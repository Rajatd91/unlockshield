"""
Agent Wallet & Treasury API
════════════════════════════
Kite AA smart wallet, vault management, L-USDC yield, spending controls.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from app.services.agent_wallet import agent_wallet

router = APIRouter()


class SpendCheckRequest(BaseModel):
    amount_usd: float
    strategy: str


class SpendingRulesUpdate(BaseModel):
    daily_limit_usd: Optional[float] = None
    max_single_trade_usd: Optional[float] = None
    auto_yield_on_idle: Optional[bool] = None


class VaultDepositRequest(BaseModel):
    amount: float


class LusdcActionRequest(BaseModel):
    amount: float


# ─── Wallet Status ──────────────────────────────────────────────────

@router.get("/status")
async def wallet_status():
    """
    Full wallet dashboard — balances, spending rules, vault health,
    L-USDC yield status, recent transactions.
    """
    return await agent_wallet.get_wallet_status()


@router.get("/connected")
async def wallet_connected():
    """Quick check if wallet is connected to Kite chain"""
    return {
        "connected": agent_wallet.is_connected(),
        "address": agent_wallet.account.address if agent_wallet.account else None,
        "chain": "Kite AI Testnet (2368)",
    }


# ─── Spending Controls ─────────────────────────────────────────────

@router.post("/check-spend")
async def check_spend(req: SpendCheckRequest):
    """
    Pre-flight spending check — validates amount against daily limits,
    single trade caps, and allowed strategies before hedge execution.
    """
    return agent_wallet.check_spend_allowed(req.amount_usd, req.strategy)


@router.get("/spending-rules")
async def get_spending_rules():
    """Current spending rules and limits"""
    return agent_wallet.get_spending_rules()


@router.put("/spending-rules")
async def update_spending_rules(rules: SpendingRulesUpdate):
    """Update spending rules (owner-only in production)"""
    update_dict = {k: v for k, v in rules.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    return agent_wallet.update_spending_rules(update_dict)


# ─── Vault Operations ──────────────────────────────────────────────

@router.post("/vault/deposit")
async def vault_deposit(req: VaultDepositRequest):
    """Deposit settlement tokens to the agent vault"""
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    return await agent_wallet.deposit_to_vault(req.amount)


@router.get("/vault/balance")
async def vault_balance():
    """Current vault balance and status"""
    status = await agent_wallet.get_wallet_status()
    return status["vault"]


# ─── L-USDC Yield ──────────────────────────────────────────────────

@router.get("/yield")
async def yield_status():
    """
    L-USDC yield dashboard — balance, APY, daily/monthly/annual yield,
    backed by Aave v3 lending on Ethereum bridged via LayerZero.
    """
    return await agent_wallet.get_lusdc_yield_status()


@router.post("/yield/deposit")
async def deposit_lusdc(req: LusdcActionRequest):
    """Convert idle USDC to yield-bearing L-USDC"""
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    return await agent_wallet.deposit_to_lusdc(req.amount)


@router.post("/yield/redeem")
async def redeem_lusdc(req: LusdcActionRequest):
    """Redeem L-USDC back to USDC for hedge execution"""
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    return await agent_wallet.redeem_lusdc(req.amount)


# ─── Settlement ─────────────────────────────────────────────────────

@router.post("/settle")
async def record_settlement(amount_usd: float, service_type: str = "hedge_execution"):
    """Record a settlement on the Kite Settlement Contract"""
    return await agent_wallet.record_settlement(amount_usd, service_type)


# ─── ERC-4337 UserOperation ────────────────────────────────────────

@router.post("/user-operation")
async def prepare_user_op(target: str, call_data: str, value: int = 0):
    """
    Prepare an ERC-4337 UserOperation for gasless execution via Kite bundler.
    The agent can execute hedges without needing KITE for gas.
    """
    return await agent_wallet.prepare_user_operation(target, call_data, value)


# ─── Transaction History ───────────────────────────────────────────

@router.get("/transactions")
async def transaction_history():
    """All wallet transactions (hedges, settlements, yield ops)"""
    status = await agent_wallet.get_wallet_status()
    return {
        "transactions": status["recent_transactions"],
        "total": len(status["recent_transactions"]),
    }
