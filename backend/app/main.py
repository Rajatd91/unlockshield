"""
UnlockShield — Verifiable DeFi Stress Oracle
Built on Kite AI blockchain for the Kite AI Global Hackathon 2026

Main FastAPI application.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import unlocks, agent, portfolio, backtest, market, wallet, events, stress, predictions

app = FastAPI(
    title="UnlockShield API",
    description="Verifiable DeFi stress oracle for token unlock shocks, AMM wrapper risk, and on-chain forecast reputation. Built on Kite AI.",
    version="1.0.0",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://unlockshield.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    contract_address = os.getenv("CONTRACT_ADDRESS", "")
    contract_explorer = (
        f"https://testnet.kitescan.ai/address/{contract_address}"
        if contract_address else None
    )

    return {
        "name": "UnlockShield",
        "tagline": "Verifiable DeFi stress oracle for on-chain capital risk",
        "version": "1.0.0",
        "chain": "Kite AI (Testnet)",
        "chain_id": 2368,
        "explorer": "https://testnet.kitescan.ai/",
        "contract_address": contract_address or "not_configured",
        "contract_explorer": contract_explorer,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from app.services.kite_attestation import kite_service
    contract_address = os.getenv("CONTRACT_ADDRESS", "")
    return {
        "status": "healthy",
        "kite_connected": kite_service.is_connected(),
        "contract_configured": bool(contract_address),
    }


# Include routers
app.include_router(unlocks.router, prefix="/api/unlocks", tags=["Unlocks"])
app.include_router(agent.router, prefix="/api/agent", tags=["Agent"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["Portfolio"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["Backtest"])
app.include_router(market.router, prefix="/api/market", tags=["Market Data"])
app.include_router(wallet.router, prefix="/api/wallet", tags=["Agent Wallet"])
app.include_router(events.router, prefix="/api/events", tags=["Event Intelligence"])
app.include_router(stress.router, prefix="/api/stress", tags=["Stress Testing"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Verifiable Predictions"])


@app.on_event("startup")
async def _start_autonomous_agent():
    """Spawn the background autonomous agent loop on FastAPI startup."""
    from app.services.agent_loop import start_agent_loop
    start_agent_loop()
