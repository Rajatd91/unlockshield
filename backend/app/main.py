"""
UnlockShield — Autonomous AI Agent for Token Unlock Hedging
Built on Kite AI blockchain for the Kite AI Global Hackathon 2026

Main FastAPI application.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import unlocks, agent, portfolio, backtest, market, wallet

app = FastAPI(
    title="UnlockShield API",
    description="Autonomous AI trading agent that protects DeFi portfolios from token unlock dumps. Built on Kite AI.",
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
        "tagline": "Autonomous AI agent protecting DeFi portfolios from token unlock dumps",
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
