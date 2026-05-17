# Deploying the Autonomous Agent (USDC Treasury + Loop)

This is what you do tonight to turn UnlockShield from a risk dashboard
into the autonomous trading agent Track 2 actually asks for.

Total time: 15-20 minutes.

---

## What you're shipping

1. `MockUSDC.sol` — a 6-decimal stablecoin on Kite Testnet for hedge settlement
2. `AgentTreasury.sol` — holds USDC, enforces spending policy on-chain, executes hedges
3. Backend autonomous loop — already deployed when you push; runs every 90s with no user input
4. Live Agent tab — already in the frontend; polls activity + treasury every 5s

---

## Step 1 — Pull the latest code

```bash
cd /Users/rajat/Downloads/unlockshield
git pull origin main
```

You should see the new files:
- `contracts/contracts/MockUSDC.sol`
- `contracts/contracts/AgentTreasury.sol`
- `contracts/deploy_treasury.js`
- `backend/app/services/agent_loop.py`
- `backend/app/services/treasury_service.py`

---

## Step 2 — Make sure your wallet has KITE

The treasury deploy needs ~0.1 KITE for gas. Check at https://faucet.gokite.ai.

---

## Step 3 — Deploy the new contracts

```bash
cd contracts
npx hardhat run deploy_treasury.js --network kiteTestnet
```

Expected output:
```
═══════════════════════════════════════════════════════
UnlockShield AgentTreasury — Kite Testnet Deployment
═══════════════════════════════════════════════════════
Deployer / Agent: 0xYourAddress
KITE balance:     1.0

[1/3] Deploying MockUSDC...
       MockUSDC: 0xUsdcAddress

[2/3] Deploying AgentTreasury...
       AgentTreasury: 0xTreasuryAddress

[3/3] Minting seed USDC + funding treasury...
       Seeded with: 10000 USDC

═══════════════════════════════════════════════════════
DEPLOYED
═══════════════════════════════════════════════════════
MockUSDC:         0xUsdcAddress
AgentTreasury:    0xTreasuryAddress
KiteScan (USDC):  https://testnet.kitescan.ai/address/0xUsdcAddress
KiteScan (Vault): https://testnet.kitescan.ai/address/0xTreasuryAddress
```

**Save both addresses.**

---

## Step 4 — Set environment variables on Render

Go to https://dashboard.render.com → `unlockshield-api` → Environment

Add these new variables (keep your existing ones):

| Key | Value |
|---|---|
| `USDC_ADDRESS` | `0x...` (MockUSDC address from step 3) |
| `TREASURY_ADDRESS` | `0x...` (AgentTreasury address from step 3) |
| `AGENT_LOOP_ENABLED` | `true` |
| `AGENT_LOOP_INTERVAL` | `90` (seconds) |
| `AGENT_HEDGE_MIN_RISK` | `55` (any unlock scoring ≥ 55 gets hedged) |
| `AGENT_HEDGE_BASE_USD` | `200` (sized up by risk tier — max $800 at risk≥80) |

**Important:** `AGENT_PRIVATE_KEY` must equal the wallet that deployed the contracts (the contracts grant only that wallet permission to call `executeHedge`).

Click "Save Changes". Render redeploys, the agent loop starts within ~60s.

---

## Step 5 — Verify the loop is running

```bash
# Should show "running: true" within ~60s of Render finishing the redeploy
curl https://unlockshield-api.onrender.com/api/agent/activity | head

# Should show treasury passport with $10,000 USDC balance
curl https://unlockshield-api.onrender.com/api/agent/treasury
```

---

## Step 6 — Open the Live Agent tab in your browser

https://unlockshield.vercel.app/app → **Live Agent** tab

Within ~90 seconds you'll see:

- A green "RUNNING" status badge with cycle count incrementing
- Treasury balance: $10,000 USDC
- Spending policy: $1,000 max single trade · $5,000 daily cap · risk ≥35 minimum
- A scrolling activity log: `cycle_start → scan → commit → hedge → cycle_complete`
- Each commit and hedge entry has a clickable "tx on KiteScan ↗" link

---

## Step 7 — Verify on KiteScan

Click the **Treasury on KiteScan** button at the top of the Live Agent tab.

You should see the AgentTreasury contract with:
- Transactions: `fund` (your seed), then `executeHedge` calls as the agent works
- Events: `HedgeExecuted` events with token/action/amount

---

## What this gives the judges

When a judge opens your demo:

1. **Live Agent tab** shows the agent actively working — they don't have to take your word that it's autonomous, they can watch it
2. **Treasury passport** proves stablecoin settlement is real — every hedge is a USDC transfer
3. **On-chain spending policy** proves bounded autonomy — they can read the contract on KiteScan
4. **Recent hedges table** is a verifiable history of every action the agent took
5. **KiteScan tx links** let them follow any individual decision to its receipt

This is exactly what Track 2 asks for. Verifiable, autonomous, settles in stablecoin, runs in production.

---

## Troubleshooting

**Agent shows "OFFLINE" or "starting…"**
- Check Render logs for the message `"Autonomous agent online"`
- If `AGENT_LOOP_ENABLED=true` is missing, the loop won't start
- Render free tier sleeps after 15min idle — first request after sleep takes ~30s to wake; the loop restarts automatically on wake

**Treasury shows "not deployed yet" banner**
- `TREASURY_ADDRESS` and `USDC_ADDRESS` env vars are not set on Render
- Check spelling exactly — they're case-sensitive

**Hedges all show "blocked" with reason `risk_below_threshold`**
- Working as intended — current upcoming unlocks are all low-risk
- Lower `AGENT_HEDGE_MIN_RISK` to `35` to see more hedge activity during the demo

**Hedges show `policy_blocked` with reason `exceeds_daily_cap`**
- Treasury has spent its daily $5,000 quota
- Wait until UTC midnight or update policy via `treasury.updatePolicy()` from your wallet
