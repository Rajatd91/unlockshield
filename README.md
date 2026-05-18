# UnlockShield — Autonomous Risk Agent on Kite AI

**An autonomous trading agent that monitors token unlock events, runs regime-switching Monte Carlo stress simulations, commits each prediction on-chain *before* the event, and executes USDC hedges through an on-chain spending-policy contract. Predictions are revealed and scored after each event to build a trustless reputation grade on Kite AI.**

> Submitted to the **Kite AI Global Hackathon 2026** — Track 2: Agentic Trading & Portfolio Management.

---

## Live Submission Links

| Resource | Link |
|---|---|
| **Live Demo (Frontend)** | https://unlockshield.vercel.app |
| **Live Agent dashboard** | https://unlockshield.vercel.app/app (open the **Live Agent** tab to see the loop running) |
| **Backend API** | https://unlockshield-api.onrender.com |
| **API Docs (Swagger)** | https://unlockshield-api.onrender.com/docs |
| **GitHub Repository** | https://github.com/Rajatd91/unlockshield |
| **Oracle Contract** | https://testnet.kitescan.ai/address/0xD2d642Ea44973d90Bb0a6f403e8A4815020Fdd79 |
| **AgentTreasury Contract** | Address printed by `deploy_treasury.js` after you deploy it (see Deploy section) |
| **Kite Testnet** | Chain ID 2368 · RPC `https://rpc-testnet.gokite.ai/` |

---

## Track 2 criteria mapping

| Track 2 requirement | How UnlockShield satisfies it |
|---|---|
| Build autonomous agents that operate and settle on Kite | `agent_loop.py` runs every 90s with no user input, settles every action on Kite Testnet |
| Executes paid actions | `AgentTreasury.executeHedge()` transfers USDC for every hedge — real on-chain settlement, not just attestation |
| Stablecoin-first settlement | All capital moves in USDC (6-decimal). Native KITE only used for gas |
| Reputation-aware capital delegation | On-chain reputation grade (S-F, 0-1000) built from commit-reveal scored predictions — any third party can read it before delegating capital |
| Programmable constraints | Spending policy enforced on-chain: max single trade, daily cap, min risk threshold. Agent cannot widen its own bounds |
| Uses Kite chain for attestations | Every prediction = `keccak256` commit on Kite oracle. Every hedge = `HedgeExecuted` event on Kite treasury |
| Real-world applicability | Token unlocks drained billions in 2024-2025 from real LP positions. Agent acts on the same data, with the same risk model that produced a Grade C+ track record on 13 historical events |
| Live demo in production | Frontend on Vercel, backend on Render, contracts on Kite Testnet, agent running continuously |

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

UnlockShield is a **fully autonomous agent**: a backend loop runs continuously, scans live unlock data, simulates impact, commits predictions on-chain, and moves USDC through a constrained treasury — with **no user clicks required**. The UI exists to observe the agent's behaviour, not to drive it.

**Four things no existing hackathon project combines:**

1. **Regime-Switching GARCH Monte Carlo with Jump-Diffusion** — 2,000 stochastic price paths per simulation, calibrated from 180+ historical unlock events. Academic foundation: Bollerslev (1986), Merton (1976), Hamilton (1989). Built from scratch in `backend/app/services/stress_engine.py` (969 lines).
2. **Autonomous decision loop** — `agent_loop.py` runs every 90s, scans the next 14 days of unlocks, commits predictions, and executes USDC hedges through `AgentTreasury.executeHedge()`. The frontend's Live Agent tab streams every decision in real time so judges can watch the agent work.
3. **Bounded autonomy in Solidity** — `AgentTreasury.sol` enforces max single trade, rolling 24h daily cap, and minimum risk threshold *on-chain*. The agent's signing key cannot widen its own bounds; only the human owner can. This is programmable constraints in the literal sense.
4. **Trustless reputation grade** — Accuracy score (0–1000, grade S to F) is built from commit-reveal scored predictions. The 13 seeded historical events produced a real Grade C+ from the same scoring formula that scores every new prediction. No tuning to inflate the grade.

---

## The Autonomous 6-Stage Loop

The backend runs this loop continuously (every 90 seconds by default, configurable via `AGENT_LOOP_INTERVAL`):

```
1. DETECT    → Multi-Event Intelligence
                Tokenomist + CoinPaprika + DeFiLlama + Fear&Greed
                Pulls the next 14 days of unlock events ranked by supply impact

2. SIMULATE  → RS-GARCH Monte Carlo (2,000 paths)
                Regime-switching volatility | Markov chain regime transitions
                Merton jump-diffusion calibrated from 180+ historical events
                Outputs: VaR(95), CVaR, max drawdown, IL probability dist

3. COMMIT    → keccak256(token, impact, timestamp, salt)
                Hash committed to UnlockShieldOracle on Kite AI
                Tamper-proof timestamp via block.timestamp
                Returns a real KiteScan tx hash

4. EXECUTE   → AgentTreasury.executeHedge(token, action, risk, usdAmount, ref)
                Stablecoin-first: USDC transfer to hedge sink
                Policy gates checked on-chain: maxSingleTrade,
                dailyCap, minRiskScore, balanceUsd
                Emits HedgeExecuted (success) or HedgeBlocked (policy failure)

5. REVEAL    → After event resolves: oracle.revealPrediction(commitId, actual)
                Contract verifies hash matches → scores accuracy
                Reputation score and grade update on-chain

6. PUBLISH   → /api/agent/activity streams every decision
                /api/agent/treasury reads the on-chain passport
                Live Agent tab in the UI polls both every 5s
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
┌─────────────────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite — Vercel)                    │
│  Dashboard │ Live Agent │ Stress Test │ Predictions │ Backtest   │
│  Live Agent tab polls /api/agent/activity every 5s               │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼───────────────────────────────────┐
│              BACKEND (FastAPI — Render) — 60+ endpoints          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ AGENT LOOP (agent_loop.py)        runs every 90s, no input │ │
│  │   1. fetch_upcoming_unlocks(14 days)                       │ │
│  │   2. for each top-risk unlock:                             │ │
│  │        - oracle.commit_to_chain()  → Kite tx               │ │
│  │        - treasury.execute_hedge()  → USDC tx if risk≥55    │ │
│  │   3. auto-reveal predictions whose unlock date passed      │ │
│  │   Every decision logged to /api/agent/activity              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ STRESS ENGINE (stress_engine.py — 969 lines)               │ │
│  │  RS-GARCH(1,1) + Merton Jump-Diffusion + Markov regime    │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ DATA LAYER                                                  │ │
│  │  CoinPaprika • DeFiLlama • Fear&Greed • Tokenomist         │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ web3.py (AGENT_PRIVATE_KEY signs)
┌─────────────────────────────▼───────────────────────────────────┐
│           KITE AI BLOCKCHAIN — Chain ID 2368                     │
│                                                                  │
│  UnlockShieldOracle.sol  (commit-reveal predictions)             │
│    commitPrediction()  revealPrediction()  reputation()          │
│                                                                  │
│  AgentTreasury.sol  (bounded-autonomy capital execution) ★ NEW   │
│    executeHedge(token, action, risk, usdAmount, ref)             │
│    on-chain policy: maxSingleTradeUsd · dailyCapUsd · minRisk    │
│    agentPassport() → public identity + stats                     │
│                                                                  │
│  MockUSDC.sol  (6-decimal stablecoin for hedge settlement) ★ NEW │
└──────────────────────────────────────────────────────────────────┘
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
cp .env.example .env   # add AGENT_PRIVATE_KEY (testnet-only wallet)
npx hardhat run deploy.js --network kiteTestnet
# Note the printed CONTRACT_ADDRESS
```

### 2. Deploy the AgentTreasury + MockUSDC

```bash
# Same contracts/ directory
npx hardhat run deploy_treasury.js --network kiteTestnet
# Prints USDC_ADDRESS and TREASURY_ADDRESS — seed treasury with 10,000 USDC
```

### 3. Run the Backend (starts the autonomous loop on boot)

```bash
cd ../backend
pip install -r requirements.txt
cp .env.example .env
# In .env set:
#   CONTRACT_ADDRESS, AGENT_PRIVATE_KEY (must match the deploy wallet)
#   USDC_ADDRESS, TREASURY_ADDRESS
#   KITE_PASSPORT_ADDRESS=0xD232F1F3c569644F455254A637a90b60408e3f32
#   AGENT_LOOP_ENABLED=true     (default; set to false to disable autonomy)
#   AGENT_LOOP_INTERVAL=90      (seconds between cycles)
uvicorn app.main:app --reload --port 8000
# Within ~90s the activity log starts populating at /api/agent/activity
```

### 4. Run the Frontend

```bash
cd ../frontend
npm install
npm run dev
# Dashboard at http://localhost:5173/app — open the Live Agent tab
```

### 5. Verify the autonomous loop is working

```bash
# Loop status + recent decisions
curl http://localhost:8000/api/agent/activity

# Treasury balance, policy, recent hedges
curl http://localhost:8000/api/agent/treasury

# Reputation score driven by revealed predictions
curl http://localhost:8000/api/predictions/reputation
```

---

## Selected API Endpoints (60+ total)

| Endpoint | Purpose |
|---|---|
| `GET /api/agent/activity` | Live decision feed from the autonomous loop (boot, scan, commit, hedge, reveal events) |
| `GET /api/agent/treasury` | On-chain agent passport: balance, policy, recent hedges |
| `POST /api/agent/scan` | Manually trigger a scan (UI uses this for the "Run Agent Scan" button) |
| `GET /api/market/overview` | 300+ tokens, regime, sectors, F&G |
| `GET /api/market/token/{symbol}` | Single-token deep dive, 30d history |
| `GET /api/unlocks/upcoming` | Upcoming unlock events from Tokenomist (34+ live events) |
| `GET /api/events/stream` | Multi-event intelligence stream (8 event types) |
| `GET /api/stress/run/{symbol}` | Full RS-GARCH MC stress test (multi-scenario) |
| `POST /api/predictions/create/{symbol}` | Create + commit prediction on-chain (manual; loop does this too) |
| `POST /api/predictions/reveal/{commit_id}` | Reveal + score accuracy (loop auto-reveals when events resolve) |
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
| Autonomous agent loop | **Fully working** — runs every 90s, no user input required; activity feed visible at `/api/agent/activity` and the Live Agent tab |
| RS-GARCH Monte Carlo stress engine | Fully working — 969 lines, tested, produces realistic VaR/CVaR outputs |
| Multi-source data integration | Fully working — CoinPaprika, DeFiLlama, Tokenomist, F&G live |
| Prediction oracle (commit-reveal) | Fully working — committing real Kite transactions; auto-reveals after unlock dates pass |
| UnlockShieldOracle smart contract | Deployed at `0xD2d642Ea44973d90Bb0a6f403e8A4815020Fdd79` |
| AgentTreasury + MockUSDC contracts | Source committed; deploy with `npx hardhat run deploy_treasury.js --network kiteTestnet` (single command) |
| On-chain USDC hedge execution | **Live once treasury is deployed** — `AgentTreasury.executeHedge()` enforces policy and transfers USDC per hedge decision |
| On-chain spending policy | Enforced by contract: `maxSingleTradeUsd`, `dailyCapUsd`, `minRiskScore` |
| Live agent reputation grade | Grade C+ on 13 real 2024-2025 unlocks (same formula scores future predictions; no tuning) |
| Frontend Live Agent dashboard | Live on Vercel; polls activity + treasury every 5s |
| Real DEX integration | Not in MVP — hedge USDC routes to a configurable sink address. Production version would route to GMX/Uniswap |

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

**Rajat Durge** — MSc Emerging Digital Technologies, University College London (UCL).

Contact: rajatdurge11@gmail.com · GitHub: [@Rajatd91](https://github.com/Rajatd91)

---

## License

MIT — see [LICENSE](LICENSE)
