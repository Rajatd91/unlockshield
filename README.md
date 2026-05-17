# UnlockShield — Verifiable DeFi Stress Oracle

**An autonomous agent that forecasts token-unlock price shocks using regime-switching Monte Carlo stress simulation, commits each prediction on-chain BEFORE the event using commit-reveal cryptography, then reveals and scores accuracy to build trustless reputation on Kite AI.**

> Submitted to the **Kite AI Global Hackathon 2026** — Track 2: Agentic Trading & Portfolio Management.

---

## Live Submission Links

| Resource | Link |
|---|---|
| **Live Demo (Frontend)** | https://unlockshield.vercel.app |
| **Backend API** | https://unlockshield-api.onrender.com |
| **API Docs (Swagger)** | https://unlockshield-api.onrender.com/docs |
| **GitHub Repository** | https://github.com/Rajatd91/unlockshield |
| **Smart Contract on KiteScan** | https://testnet.kitescan.ai/address/0xD2d642Ea44973d90Bb0a6f403e8A4815020Fdd79 |
| **Kite Testnet** | Chain ID 2368 · RPC `https://rpc-testnet.gokite.ai/` |

---

## The Problem

Every month, billions in vesting tokens unlock on **publicly known schedules**, yet they consistently cause 10-30% price crashes that destroy LP positions and trigger liquidation cascades.

| Token | Date | Supply Unlocked | 7-Day Impact |
|---|---|---|---|
| TIA (Celestia) | Oct 30, 2024 | 16.3% | **−28.5%** |
| WLD (Worldcoin) | Jul 24, 2024 | 6.7% | **−22.8%** |
| SEI | Aug 15, 2024 | 1.38% | **−18.9%** |
| ARB | Mar 16, 2025 | 2.13% | **−15.1%** |

Existing tools (Tokenomist, CoinGecko) tell you *when* unlocks happen. None forecast the *magnitude* of impact, simulate how AMM LP positions degrade, or prove their predictions were made before the event.

---

## What Makes This Different

This is not a trading bot. It is **DeFi risk infrastructure** — closer to Moody's or Chainlink than to 3Commas.

**Three things no existing project combines:**

1. **Regime-Switching GARCH Monte Carlo with Jump-Diffusion** — 2,000 stochastic price paths per simulation, calibrated from 180+ historical unlock events. Academic foundation: Bollerslev (1986), Merton (1976), Hamilton (1989). Built from scratch in `backend/app/services/stress_engine.py` (969 lines).
2. **On-chain commit-reveal predictions** — Every prediction hash is committed to Kite AI BEFORE the unlock event. After the event, the prediction is revealed and scored. Anyone can verify on-chain that the agent didn't change its mind after the fact. This is the only way to build a *provably honest* AI track record.
3. **Trustless reputation** — Accuracy score (0–1000, grade S to F), prediction count, streaks, and average error are all stored on-chain. No central database. No "trust me, here's my backtested returns." The blockchain is the auditor.

---

## The 5-Stage Pipeline

```
1. DETECT    → Multi-Event Intelligence Engine
                Tokenomist + CoinPaprika + DeFiLlama + Fear&Greed
                Tracks unlocks, whale moves, stablecoin flows, regime shifts

2. SIMULATE  → RS-GARCH Monte Carlo (2,000 paths)
                Regime-switching volatility | Markov chain regime transitions
                Merton jump-diffusion calibrated from 180+ historical events
                Outputs: VaR(95), CVaR, max drawdown, IL probability dist

3. COMMIT    → keccak256(token, impact, timestamp, salt)
                Hash committed to Kite AI BEFORE event
                Tamper-proof timestamp via block.timestamp
                Anyone can verify prediction existed pre-event

4. PROTECT   → Hedge strategy recommendation
                6 strategies: FULL_EXIT, REDUCE, SHORT_HEDGE, OPTIONS_PUT, DCA, HOLD
                Sized by regime, VaR threshold, position context
                Includes step-by-step execution plan

5. VERIFY    → After event: reveal prediction
                Contract verifies hash matches → scores accuracy
                Reputation updates trustlessly
                Score visible to anyone forever
```

---

## Mapping to Hackathon Judging Criteria

**Track 2: Agentic Trading & Portfolio Management** — judged on innovation, technical depth, use of Kite AI chain, verifiability, and real-world applicability.

| Criterion | How UnlockShield delivers |
|---|---|
| **AI-native trading infrastructure** | Custom RS-GARCH stress engine (not just LLM prompting) + LLM reasoning layer for risk explanations |
| **Reputation-aware capital delegation** | ERC-8004-style trustless reputation built from cryptographically verified predictions, not self-reported metrics |
| **Stablecoin-first settlement** | All hedge recommendations route to USDC via L-USDC yield wrapper |
| **Manages risk dynamically** | Regime detection (BULL/BEAR/SIDEWAYS) adjusts hedge sizing in real time |
| **Use of Kite AI chain** | Commit-reveal predictions, reputation storage, settlement contract integration |
| **Verifiability** | Every prediction hash on-chain BEFORE event; outcome revealed and scored after. Anyone can audit on KiteScan. |
| **Real-world applicability** | Backtested on 13 real 2024-2025 unlock events; TIA Oct 2024 (-28.5%) covered |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite — Vercel)                │
│   Dashboard │ Stress Test │ Predictions │ Market │ Portfolio │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼───────────────────────────────┐
│        BACKEND (FastAPI — Render) — 58 endpoints             │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ DATA LAYER                                              ││
│  │  CoinPaprika  • DeFiLlama  • Fear&Greed  • Tokenomist  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ STRESS ENGINE (stress_engine.py — 969 lines)            ││
│  │  RS-GARCH(1,1) + Merton Jump-Diffusion + Markov regime ││
│  │  Outputs: VaR, CVaR, IL distribution, hedge sizing     ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ PREDICTION ORACLE (prediction_oracle.py — 450 lines)    ││
│  │  commit() → keccak256 hash on-chain BEFORE event        ││
│  │  reveal() → score accuracy after event                  ││
│  │  reputation() → trustless score (0-1000, grade S-F)     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────┬───────────────────────────────┘
                              │ web3.py
┌─────────────────────────────▼───────────────────────────────┐
│         KITE AI BLOCKCHAIN — Chain ID 2368                   │
│   UnlockShieldOracle.sol (361 lines)                         │
│   ├── commitPrediction(commitHash, token, unlockTs, risk)   │
│   ├── revealPrediction(id, impact, salt) → verifies hash    │
│   ├── recordOutcome(id, actualImpact) → scores accuracy     │
│   └── reputation() → public score, streak, error stats      │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Innovation: The Stress Engine (RS-GARCH-MC-JD)

This is the academic core — and the piece that makes UnlockShield more than an API aggregator.

**Pipeline:**
1. **Calibrate GARCH(1,1)** from 30-day realized volatility
2. **Detect current regime** via 5-signal model: market breadth, F&G index, BTC dominance, momentum, altcoin strength
3. **Generate 2,000 Monte Carlo paths** with regime-aware drift/volatility, Markov transitions between regimes
4. **Inject jump-diffusion shocks** with parameters empirically calibrated from 180+ historical token unlock events
5. **Compute risk metrics**: VaR(95), CVaR(95), expected drawdown, Uniswap v3 LP impermanent loss distribution
6. **Output probability distribution** consumed by the hedge engine and committed on-chain

**Validation example:** ARB with 2.65% cliff unlock from investor/team in BEAR regime simulates VaR(95) = -30.69%. Compare to TIA's actual -28.5% from its 16.3% unlock — model produces realistic, conservative estimates with proper negative skewness and fat tails.

**Why this matters academically:** Most DeFi risk tooling uses static historical volatility. By combining regime-switching with empirically-calibrated jump parameters, this framework adapts to current market conditions rather than averaging across years of unrelated data. This is the methodology being formally written up as part of the author's MSc dissertation: *"Stress Testing AMM Wrappers Under Realistic Market Volatility."*

---

## Quick Start (Local Development)

**Prerequisites:** Python 3.10+, Node.js 18+, MetaMask with Kite Testnet, ~1 KITE from [faucet.gokite.ai](https://faucet.gokite.ai)

### 1. Deploy the Oracle Contract

```bash
cd contracts
npm install
cp .env.example .env   # then edit .env, add your AGENT_PRIVATE_KEY (a testnet-only wallet)
npx hardhat run deploy.js --network kiteTestnet
# Note the deployed contract address — you'll need it for backend
```

### 2. Run the Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # add CONTRACT_ADDRESS, AGENT_PRIVATE_KEY, optionally ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
# API at http://localhost:8000/docs
```

### 3. Run the Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:5173
```

### 4. Verify End-to-End

```bash
# Quick stress test
curl http://localhost:8000/api/stress/quick/ARB

# Full stress test with all scenarios
curl http://localhost:8000/api/stress/run/ARB

# Commit a prediction on-chain
curl -X POST http://localhost:8000/api/predictions/create/ARB
```

---

## Selected API Endpoints (58 total)

| Endpoint | Purpose |
|---|---|
| `GET /api/market/overview` | 300+ tokens, regime, sectors, F&G |
| `GET /api/market/token/{symbol}` | Single-token deep dive, 30d history |
| `GET /api/unlocks/upcoming` | Upcoming unlock events from Tokenomist (34+ live events) |
| `GET /api/events/stream` | Multi-event intelligence stream (8 event types) |
| `GET /api/stress/run/{symbol}` | Full RS-GARCH MC stress test (multi-scenario) |
| `GET /api/stress/quick/{symbol}` | Fast stress estimate |
| `POST /api/predictions/create/{symbol}` | Create + commit prediction on-chain |
| `POST /api/predictions/reveal/{commit_id}` | Reveal + score accuracy |
| `GET /api/predictions/reputation` | Current agent reputation (0-1000) |

Full Swagger docs: https://unlockshield-api.onrender.com/docs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.19 on Kite AI Testnet (Chain ID 2368) |
| Backend | Python 3.10, FastAPI, web3.py, NumPy |
| AI Reasoning Layer | LLM-based risk explanation generator (Anthropic API) |
| Simulation | Custom RS-GARCH Monte Carlo + Merton Jump-Diffusion |
| Frontend | React 18, Vite, Lucide icons |
| Data | CoinPaprika, DeFiLlama, Alternative.me, Tokenomist |
| Deploy | Vercel (frontend), Render (backend), Kite Testnet (contract) |

---

## What's Real vs What's WIP

Honest accounting for hackathon judges:

| Component | Status |
|---|---|
| RS-GARCH Monte Carlo stress engine | Fully working — 969 lines, tested, produces realistic outputs |
| Multi-source data integration | Fully working — CoinPaprika, DeFiLlama, Tokenomist, F&G live |
| Prediction oracle (commit-reveal logic) | Fully working in Python; smart contract written, deploys on `npx hardhat run deploy.js` |
| Smart contract on Kite Testnet | Code complete (361 lines Solidity); deploy with one command |
| Frontend dashboard | Live on Vercel; Stress Test and Predictions tabs functional |
| Hedge execution | Simulated for hackathon (recommendations + execution plan, not real DEX calls) |
| Live agent reputation | Built and queryable; track record accumulates over time as predictions resolve |

---

## Dissertation & Research Foundation

This project is the engineering counterpart to the author's MSc dissertation at University College London (UCL):

> **"Stress Testing AMM Wrappers Under Realistic Market Volatility — Extending simulation frameworks to include stochastic price paths and volatility shocks, analysing wrapper performance and robustness."**

The dissertation formalises the RS-GARCH + jump-diffusion methodology, evaluates it against production AMM wrappers (Arrakis V2, Gamma Strategies), and validates predictions empirically against 20+ historical unlock events. The hackathon prototype demonstrates the methodology is feasible and useful in production.

**Academic references:**
- Bollerslev (1986) — GARCH(1,1) volatility clustering
- Merton (1976) — Jump-diffusion for sudden price shocks
- Hamilton (1989) — Markov regime-switching
- Milionis et al. (2022) — Loss-Versus-Rebalancing for AMM LPs
- Cartea, Drissi, Monga (2024) — Predictable loss and optimal liquidity provision

---

## Team

**Rajat Durge** — MSc Emerging Digital Technologies, University College London (UCL). Dissertation on AMM wrapper stress testing under realistic market volatility. Industry partner: NTT Data.

Contact: rajatdurge11@gmail.com · GitHub: [@Rajatd91](https://github.com/Rajatd91)

---

## License

MIT — see [LICENSE](LICENSE)
