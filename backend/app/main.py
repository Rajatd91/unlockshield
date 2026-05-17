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
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "name": "UnlockShield",
        "tagline": "Verifiable DeFi stress oracle for on-chain capital risk",
        "version": "1.0.0",
        "chain": "Kite AI (Testnet)",
        "chain_id": 2368,
        "explorer": "https://testnet.kitescan.ai/",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    from app.services.kite_attestation import kite_service
    return {
        "status": "healthy",
        "kite_connected": kite_service.is_connected(),
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
