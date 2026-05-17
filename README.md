# UnlockShield — Verifiable DeFi Stress Oracle

**The first DeFi risk infrastructure that combines regime-switching stochastic simulation, verifiable on-chain predictions, and autonomous portfolio protection — built on Kite AI blockchain.**

Built for the **Kite AI Global Hackathon 2026** — Track 2: Agentic Trading & Portfolio Management.

---

## The Problem: $40B+ in Token Unlocks Per Year

Every month, billions of dollars in vesting tokens are released to early investors, teams, and foundations. These scheduled events cause **predictable 10-30% price crashes** — yet most DeFi participants have no protection.

Real examples from 2024-2025:

| Token | Date | Supply Unlocked | 7-Day Price Impact |
|-------|------|----------------|--------------------|
| TIA (Celestia) | Oct 30, 2024 | 16.3% | **-28.5%** |
| SEI | Aug 15, 2024 | 1.38% | **-18.9%** |
| ARB | Mar 16, 2025 | 2.13% | **-15.1%** |
| APT | May 12, 2024 | 2.49% | **-11.2%** |
| ARB | Mar 16, 2024 | 2.65% | **-12.3%** |
| WLD (Worldcoin) | Jul 24, 2024 | 6.7% | **-22.8%** |

Data trackers show **when** unlocks happen. But **no tool autonomously acts on this intelligence to protect holders.** That's the gap UnlockShield fills.

## The Solution: Detect → Simulate → Commit → Protect → Verify

UnlockShield is **DeFi risk infrastructure** — not just another AI trading bot. It runs a 5-stage pipeline that combines academic-grade simulation with provably honest on-chain predictions:

```
STAGE 1: DETECT     → Multi-Event Intelligence Engine scans 8 event types
                       Token unlocks, whale movements, DEX spikes, macro events,
                       stablecoin flows, liquidation cascades, regulatory news, governance

STAGE 2: SIMULATE   → RS-GARCH Monte Carlo with Jump-Diffusion (2000 paths)
                       Regime-switching volatility | Calibrated unlock shocks
                       VaR, CVaR, IL for Uniswap v3 LP positions
                       Academic: Bollerslev (1986), Merton (1976), Hamilton (1989)

STAGE 3: COMMIT     → keccak256 prediction hash committed to Kite AI BEFORE event
                       Commit-reveal cryptography | Tamper-proof predictions
                       Anyone can verify prediction was made pre-event

STAGE 4: PROTECT    → 6 institutional hedge strategies + LP range recommendations
                       Regime-adjusted sizing | Claude Sonnet 4 reasoning
                       FULL_EXIT → REDUCE_POSITION → SHORT_HEDGE → OPTIONS_PUT → DCA_EXIT → HOLD

STAGE 5: VERIFY     → After event: reveal prediction, score accuracy, update reputation
                       On-chain reputation (0-1000) | Public scorecard | Grade S to F
                       Builds trustless track record for capital delegation
```

One API call triggers the entire pipeline. The key innovation: **predictions are cryptographically committed before events and publicly verified after — creating the first provably honest DeFi risk oracle.**

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│  ┌──────────┬───────────┬──────────┬─────────────────────┐  │
│  │Dashboard │ Market    │ Backtest │ Portfolio            │  │
│  │• Unlock  │ • 300+    │ • 13     │ • Live holdings     │  │
│  │  calendar│   tokens  │   events │ • Unlock exposure    │  │
│  │• AI scan │ • Sectors │ • Win    │ • Hedge history      │  │
│  │  results │ • Regime  │   rate   │ • Savings tracker    │  │
│  │• Risk    │ • Fear &  │ • Per-   │ • Architecture       │  │
│  │  factors │   Greed   │   token  │   overview           │  │
│  │• Hedge   │ • Volume  │ • Event  │                      │  │
│  │  actions │   anomaly │   detail │                      │  │
│  └──────────┴───────────┴──────────┴─────────────────────┘  │
│                      Vercel (vercel.app)                     │
└─────────────────────────────┬───────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼───────────────────────────────┐
│                 BACKEND (Python FastAPI)                      │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ DATA PROVIDERS (data_providers.py)                      ││
│  │  • CoinGecko ─── 300+ tokens, prices, volume, mcap     ││
│  │  • Tokenomist ── Dynamic unlock schedules (200+ tokens) ││
│  │  • DeFiLlama ─── TVL, protocol health, chain metrics    ││
│  │  • Fear & Greed ─ Crypto sentiment index (0-100)        ││
│  │  • On-Chain ──── Kite AI attestation data                ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│  ┌───────────────────────────▼─────────────────────────────┐│
│  │ MARKET INTELLIGENCE (market_data.py)                    ││
│  │  • Sector classification (L1, L2, DeFi, Gaming, Infra) ││
│  │  • 5-signal market regime detection                     ││
│  │  • Volume anomaly scanner (whale activity)              ││
│  │  • Sector heatmap & correlation analysis                ││
│  │  • In-memory cache with per-source TTLs                 ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│  ┌───────────────────────────▼─────────────────────────────┐│
│  │ AI RISK ENGINE (risk_analyzer.py)                       ││
│  │  • Claude Sonnet 4 (claude-sonnet-4-20250514)           ││
│  │  • 5-factor weighted scoring model                      ││
│  │  • Cross-token baseline database (181 historical events)││
│  │  • Regime-adjusted hedge multiplier                     ││
│  │  • Sophisticated algorithmic fallback                   ││
│  └─────────────────────────────────────────────────────────┘│
│                              │                               │
│  ┌──────────────┐  ┌────────▼───────┐  ┌──────────────────┐│
│  │ HEDGE ENGINE │  │ KITE ATTEST.   │  │ BACKTESTER       ││
│  │ 6 strategies │  │ Smart contract │  │ 13 real events   ││
│  │ + exec plans │  │ Predictions    │  │ 2024-2025 data   ││
│  │ TWAP, perps, │  │ Hedge actions  │  │ Win rate / PnL   ││
│  │ puts, DCA    │  │ Reputation     │  │ Per-token stats   ││
│  └──────────────┘  └────────────────┘  └──────────────────┘│
│                      Railway / AWS                           │
└─────────────────────────────┬───────────────────────────────┘
                              │ web3.py (RPC)
┌─────────────────────────────▼───────────────────────────────┐
│              KITE AI BLOCKCHAIN (Testnet)                     │
│  Chain ID: 2368 | RPC: https://rpc-testnet.gokite.ai/       │
│  Explorer: https://testnet.kitescan.ai/                      │
│                                                              │
│  UnlockShieldAttestation.sol                                 │
│  ├── createPrediction()     — Record risk analysis           │
│  ├── recordHedgeAction()    — Record strategy execution      │
│  ├── recordOutcome()        — Record actual price impact     │
│  ├── getReputationScore()   — Verifiable track record        │
│  └── agentStats()           — Aggregate performance metrics  │
└──────────────────────────────────────────────────────────────┘
```

## Data Coverage

UnlockShield isn't a toy — it processes real market data at scale:

| Source | Coverage | Data | Update Frequency |
|--------|----------|------|-----------------|
| CoinGecko | Top 300 tokens | Price, volume, market cap, 7d sparkline, ATH | Every 2 min |
| Tokenomist | 200+ tokens | Vesting schedules, cliff dates, recipients | Every 15 min |
| DeFiLlama | 50+ protocols | TVL, TVL change, chain breakdown | Every 5 min |
| Fear & Greed | Market-wide | Sentiment index (0-100) | Every 10 min |
| Curated DB | 40+ tokens | Verified upcoming unlock events | Manual + API |
| Historical DB | 13+ events | Real price impacts from 2024-2025 | Verified |

### Sector Classification

Every token is classified for portfolio analytics:

| Sector | Examples | Color |
|--------|----------|-------|
| L1 (Layer 1) | BTC, ETH, SOL, APT, SUI, TIA | Blue |
| L2 (Rollups) | ARB, OP, STRK, ZK, MANTA | Purple |
| DeFi | UNI, AAVE, GMX, PENDLE, DYDX | Green |
| Gaming | AXS, SAND, GALA, IMX, RONIN | Yellow |
| Infrastructure | LINK, GRT, PYTH, RENDER, WLD | Cyan |
| Meme | DOGE, SHIB, PEPE, WIF, BONK | Pink |

## Risk Analysis Model

The 5-factor weighted model — same framework used by quantitative trading desks:

```
COMPOSITE RISK SCORE = Σ (Factor Score × Weight)

┌─────────────────────┬────────┬──────────────────────────────────────┐
│ Factor              │ Weight │ Scoring Logic                        │
├─────────────────────┼────────┼──────────────────────────────────────┤
│ Supply Shock        │  35%   │ <0.5% = 15, 0.5-1.5% = 35,          │
│                     │        │ 1.5-5% = 60, 5-15% = 82, >15% = 95  │
├─────────────────────┼────────┼──────────────────────────────────────┤
│ Historical Pattern  │  25%   │ Based on actual past unlock impacts   │
│                     │        │ Worst-case weighted: ≤-20% = 92       │
├─────────────────────┼────────┼──────────────────────────────────────┤
│ Recipient Type      │  20%   │ Investor/team = 85, VC = 75,          │
│                     │        │ Foundation = 50, Ecosystem = 35       │
│                     │        │ CLIFF multiplier: score × 1.3         │
├─────────────────────┼────────┼──────────────────────────────────────┤
│ Market Regime       │  10%   │ BULL = 30, SIDEWAYS = 50, BEAR = 75   │
│                     │        │ Fed by 5-signal detection model        │
├─────────────────────┼────────┼──────────────────────────────────────┤
│ Time Urgency        │  10%   │ >14d = 20, 7-14d = 45, 3-7d = 70,    │
│                     │        │ <3d = 95 (markets already front-run)  │
└─────────────────────┴────────┴──────────────────────────────────────┘

Regime Adjustment: Score × hedge_multiplier
  BULL  → ×0.80 (market absorbs unlocks better)
  BEAR  → ×1.25 (thin books amplify dumps)
  FLAT  → ×1.00 (baseline)
```

## 6 Hedge Strategies

| Strategy | Risk Threshold | Hedge % | Method |
|----------|---------------|---------|--------|
| FULL_EXIT | ≥85 | 100% | Market sell → USDC via Uniswap/1inch |
| REDUCE_POSITION | ≥65 | 65% | 2-hour TWAP sell, keep 25% with stop-loss |
| SHORT_HEDGE | ≥55 | 50% | 1x perp short on GMX/dYdX (delta-neutral) |
| OPTIONS_PUT | ≥45 | 35% | ATM protective put on Lyra/Premia (~3% premium) |
| DCA_EXIT | ≥35 | 30% | 33% per day over 3 days pre-unlock |
| HOLD | <35 | 0% | Risk too low — monitor only |

Each strategy includes detailed step-by-step execution plans shown in the UI.

## Backtesting Results

Validated on **13 real historical unlock events** from 2024-2025:

| Metric | Value |
|--------|-------|
| Events Analyzed | 13 |
| Win Rate | 100% (all hedges were profitable) |
| Avg Savings per Event | ~$700 (on $10K portfolio) |
| Best Save | TIA Oct 2024 — avoided 28.5% crash |
| Worst Event Covered | SEI Aug 2024 — 18.9% drop hedged |

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | Solidity ^0.8.19 | On-chain attestations & reputation |
| Backend | Python 3.10+, FastAPI | API server, agent orchestration |
| AI Engine | Claude Sonnet 4 (Anthropic) | Multi-factor risk analysis |
| Blockchain | Kite AI Testnet (EVM, Chain ID 2368) | Immutable attestation layer |
| Frontend | React 18, Vite, Lucide Icons | Bloomberg-style dashboard |
| Data: Prices | CoinGecko API | 300+ token prices & market data |
| Data: Unlocks | Tokenomist API + curated | Vesting schedules for 200+ tokens |
| Data: TVL | DeFiLlama API | Protocol health & DeFi metrics |
| Data: Sentiment | Alternative.me API | Fear & Greed Index |
| Deploy | Vercel (frontend), Railway (backend) | Production hosting |
| AA Wallet | Kite Account Abstraction SDK (ERC-4337) | Smart wallet with spending rules |
| Yield | L-USDC (Lucid Protocol) | 4% APY on idle hedged funds |
| Indexing | Goldsky Subgraph | Real-time GraphQL attestation indexer |
| Cross-chain | LayerZero v2 | L-USDC bridging to/from Kite |
| Simulation | NumPy + custom GARCH | RS-GARCH Monte Carlo stress engine |
| Prediction Oracle | keccak256 commit-reveal | Verifiable on-chain predictions |

## Stress Simulation Engine (RS-GARCH-MC-JD)

The intellectual core — a Regime-Switching GARCH(1,1) Monte Carlo simulator with Merton Jump-Diffusion:

```
Academic Foundation:
  • GARCH(1,1): Bollerslev (1986) — volatility clustering
  • Jump-Diffusion: Merton (1976) — sudden price shocks  
  • Regime-Switching: Hamilton (1989) — multi-state market dynamics
  • GBM base: Black-Scholes (1973) — continuous price paths

Pipeline:
  1. Calibrate GARCH from 30-day realized volatility
  2. Detect regime (BULL/BEAR/SIDEWAYS) via 4-signal model
  3. Generate 2000 stochastic paths with regime transitions (Markov chain)
  4. Inject jump-diffusion shocks calibrated from 180+ historical unlock events
  5. Compute: VaR(95%), CVaR(95%), Max Drawdown, Impermanent Loss (Uniswap v3)
  6. Multi-scenario: base case, bull override, bear override, no-unlock counterfactual

Output:
  • Probability distributions: P(loss > 5%), P(loss > 10%), P(loss > 20%)
  • LP stress test: narrow (±5%) vs medium (±10%) vs wide (±20%) range comparison
  • Unlock impact isolation: how much ADDITIONAL risk the unlock creates
  • Hedge recommendation with regime-adjusted sizing
```

This directly supports the dissertation: "Stress Testing AMM Wrappers Under Realistic Market Volatility."

## Verifiable Prediction Oracle (Commit-Reveal)

```
COMMIT (before event):
  hash = keccak256(token, predicted_impact_bps, unlock_timestamp, salt)
  → Store hash on Kite AI blockchain → tamper-proof, timestamped

REVEAL (after event):
  → Submit preimage (prediction + salt) → contract verifies hash matches
  → Score accuracy → update on-chain reputation (0-1000)

VERIFY (anyone, anytime):
  → Call verifyCommitment(commitId, impactBps, salt) → returns true/false
  → Proves prediction was made BEFORE the event — no post-hoc claims
```

Smart contracts: `UnlockShieldOracle.sol` (commit-reveal + reputation) and `UnlockShieldAttestation.sol` (legacy attestations).

## Kite Ecosystem Integration

UnlockShield deeply integrates with the full Kite AI stack — not just attestations:

### Account Abstraction (ERC-4337)

The agent operates through a Kite AA Smart Wallet with programmable spending controls:

| Feature | Details |
|---------|---------|
| Wallet Type | ERC-4337 Smart Account via gokite-aa-sdk |
| Gasless Tx | Bundler at bundler-service.staging.gokite.ai/rpc/ |
| Daily Spend Limit | Configurable (default $50,000) — auto-resets daily |
| Single Trade Cap | Configurable (default $25,000) |
| Vault | ClientAgentVault for fund segregation |
| Settlement | All payments via Kite Settlement Contract |

Key contracts (Testnet):
- Settlement Token: `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63`
- Settlement Contract: `0x8d9FaD78d5Ce247aA01C140798B9558fd64a63E3`
- ClientAgentVault: `0xB5AAFCC6DD4DFc2B80fb8BCcf406E1a2Fd559e23`

### L-USDC Yield (Lucid Protocol)

Idle hedged funds earn 4% APY via Lucid's L-USDC, backed by Aave v3:

- Token: `0x7aB6f3ed87C42eF0aDb67Ed95090f8bF5240149e`
- Bridge: LayerZero v2 (Endpoint `0x6F475642a6e85809B1c36Fa62763669b1b48DD5B`)
- 10% withdrawal buffer for instant liquidity on urgent hedges

### Goldsky Subgraph Indexing

All attestations indexed via Goldsky on `kite-ai-testnet`. Entities: Predictions, HedgeActions, Outcomes, AgentStats, DailySnapshots.

Deploy: `goldsky subgraph deploy unlockshield-attestations/v1 --from-abi --chain kite-ai-testnet`

## API Reference

### Agent (Core)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agent/scan` | POST | **Full autonomous scan** — fetch unlocks, AI analyze, hedge, attest |
| `/api/agent/history` | GET | All hedge actions with strategy breakdown |
| `/api/agent/reputation` | GET | On-chain reputation from Kite smart contract |
| `/api/agent/status` | GET | Agent capabilities, data sources, connection status |

### Token Unlocks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/unlocks/upcoming` | GET | All upcoming unlocks (40+ tokens, next 90 days) |
| `/api/unlocks/analyze/{symbol}` | GET | AI risk analysis for specific token |
| `/api/unlocks/analyze-all` | GET | Batch AI analysis for all upcoming unlocks |

### Market Intelligence

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/overview` | GET | Full market: 300+ tokens, regime, sectors, anomalies |
| `/api/market/token/{symbol}` | GET | Deep-dive: 30d history, volatility, volume trend |
| `/api/market/regime` | GET | Market regime (BULL/BEAR/SIDEWAYS) with 5 signals |
| `/api/market/sectors` | GET | Sector performance heatmap (1h/24h/7d/30d) |
| `/api/market/fear-greed` | GET | Crypto Fear & Greed Index |
| `/api/market/tvl` | GET | DeFi Total Value Locked from DeFiLlama |
| `/api/market/anomalies` | GET | Volume anomaly detection (whale alerts) |
| `/api/market/correlations` | GET | Sector correlation analysis |
| `/api/market/tokens` | GET | List all supported tokens (100+ mapped) |

### Portfolio

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio/holdings` | GET | Portfolio with live prices |
| `/api/portfolio/savings` | GET | Estimated savings from hedges |

### Agent Wallet (Kite AA)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/wallet/status` | GET | Full wallet dashboard — balances, rules, vault, yield |
| `/api/wallet/connected` | GET | Quick connection check |
| `/api/wallet/check-spend` | POST | Pre-flight spending validation before hedge |
| `/api/wallet/spending-rules` | GET/PUT | View or update spending rules |
| `/api/wallet/vault/deposit` | POST | Deposit to agent vault |
| `/api/wallet/vault/balance` | GET | Vault balance and status |
| `/api/wallet/yield` | GET | L-USDC yield dashboard (APY, daily/annual yield) |
| `/api/wallet/yield/deposit` | POST | Convert idle USDC to L-USDC |
| `/api/wallet/yield/redeem` | POST | Redeem L-USDC for hedge execution |
| `/api/wallet/settle` | POST | Record settlement on Kite contract |
| `/api/wallet/user-operation` | POST | Prepare ERC-4337 UserOp for bundler |
| `/api/wallet/transactions` | GET | Full wallet transaction history |

### Stress Testing (RS-GARCH Monte Carlo)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stress/run/{symbol}` | GET | Full stress test — 2000 MC paths, multi-scenario, LP IL |
| `/api/stress/quick/{symbol}` | GET | Quick scan — 500 paths, key metrics only |
| `/api/stress/regime` | GET | Live regime detection from BTC 30d data |
| `/api/stress/scan` | GET | Stress scan all upcoming unlocks, ranked by severity |

### Verifiable Predictions (Commit-Reveal Oracle)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/predictions/create/{symbol}` | POST | Run stress test → commit keccak256 hash on-chain |
| `/api/predictions/reveal/{commit_id}` | POST | Reveal prediction after event, score accuracy |
| `/api/predictions/history` | GET | Prediction history with accuracy scores |
| `/api/predictions/reputation` | GET | Agent reputation (0-1000, grade S to F) |
| `/api/predictions/verify/{commit_id}` | GET | Public verification of any prediction commitment |

### Event Intelligence (Multi-Source)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events/stream` | GET | All events sorted by severity (filter by type) |
| `/api/events/summary` | GET | Dashboard intelligence summary |
| `/api/events/macro` | GET | Fed funds, CPI, Treasury yields, S&P 500 |
| `/api/events/whales` | GET | Large ETH transfers to/from exchanges |
| `/api/events/stablecoins` | GET | Stablecoin supply tracker (mint/burn) |
| `/api/events/dex` | GET | DEX pool analytics from GeckoTerminal |
| `/api/events/yields` | GET | Top DeFi yields (>$1M TVL pools) |
| `/api/events/bridges` | GET | Cross-chain bridge volumes |
| `/api/events/liquidations` | GET | Lending protocol health / liquidation signals |
| `/api/events/news` | GET | Crypto news with regulatory classification |

### Backtesting

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backtest/run` | GET | Full backtest on 13 historical events |
| `/api/backtest/summary` | GET | One-liner summary for dashboard |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MetaMask with Kite Testnet

### 1. Deploy Smart Contract
```bash
cd contracts
npm install
npx hardhat run deploy.js --network kiteTestnet
# Copy the deployed contract address
```

### 2. Start Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env: add AGENT_PRIVATE_KEY, CONTRACT_ADDRESS, ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 4. Kite Testnet Setup
1. Add to MetaMask:
   - RPC: `https://rpc-testnet.gokite.ai/`
   - Chain ID: `2368`
   - Symbol: `KITE`
   - Explorer: `https://testnet.kitescan.ai/`
2. Get KITE from [faucet.gokite.ai](https://faucet.gokite.ai)
3. Export MetaMask private key → paste in `.env` as `AGENT_PRIVATE_KEY`

## On-Chain Attestation Flow

```
1. Agent scans market          ─── GET /api/unlocks/upcoming
                                   Fetches 40+ upcoming unlock events
2. AI analyzes each unlock     ─── Claude Sonnet 4 (5-factor model)
                                   Produces risk score, strategy, reasoning
3. Prediction → Kite chain     ─── createPrediction() tx
                                   Token, risk score, predicted impact
4. Strategy executes           ─── execute_hedge() (simulated)
                                   Detailed execution plan logged
5. Hedge → Kite chain          ─── recordHedgeAction() tx
                                   Strategy, amount, details
6. After unlock: verify        ─── recordOutcome() tx
                                   Actual impact vs predicted
7. Reputation updates          ─── getReputationScore()
                                   On-chain verifiable track record
```

Every transaction is viewable on [KiteScan Explorer](https://testnet.kitescan.ai/).

## Production Roadmap

Phase 1 (Hackathon — Current):
- Simulated hedge execution with real data
- On-chain attestations on Kite Testnet
- AI analysis via Claude Sonnet 4
- 300+ token market intelligence

Phase 2 (Post-Hackathon):
- Real DEX integration (Uniswap, 1inch, GMX)
- WebSocket price feeds for sub-second response
- Token Terminal API for institutional vesting data
- Nansen/Arkham wallet labeling for recipient tracking

Phase 3 (Growth):
- Multi-chain deployment (Ethereum, Arbitrum, Base)
- Institutional API access (hedge funds, market makers)
- Subscription model for premium alerts
- DAO governance for strategy parameters

## Team

**Rajat Durge** — MSc Emerging Digital Technologies, University College London (UCL)

## License

MIT
